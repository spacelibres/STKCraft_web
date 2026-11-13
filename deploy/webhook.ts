import { createHmac, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { FIELDS, type VisitorRow } from "./fields";

const HOST = "127.0.0.1";
const PORT = Number(process.env.WEBHOOK_PORT ?? "8788");
const SECRET_FILE = process.env.WEBHOOK_SECRET_FILE ?? "/etc/stkscraft/webhook.secret";
const TOKEN_FILE = process.env.VISITOR_TOKEN_FILE ?? "/etc/stkscraft/visitors.token";
const VISITOR_CSV = process.env.VISITOR_CSV ?? "/var/lib/stkscraft/visitors.csv";
const PENDING = process.env.DEPLOY_PENDING_FILE ?? "/var/lib/stkcraft-auto-update/webhook.pending";
const REPOSITORIES = new Set(["spacelibres/STKCraft_web", "spacelibres/STKCraft-Geocalc", "spacelibres/STKCraft-time"]);
const MAX_BODY = 1_000_000;


function send(
  res: ServerResponse,
  status: number,
  body: unknown,
  contentType = "application/json",
  headers: Record<string, string> = {},
): void {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
    ...headers,
  });
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function readRows(): VisitorRow[] {
  if (!existsSync(VISITOR_CSV)) return [];
  const text = readFileSync(VISITOR_CSV, "utf8");
  if (!text.trim()) return [];
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  return records.map((record) => {
    const row = {} as VisitorRow;
    for (const field of FIELDS) row[field] = String(record[field] ?? "");
    return row;
  });
}

function csvBody(rows: VisitorRow[]): string {
  return rows.length
    ? stringify(rows, { header: true, columns: [...FIELDS] })
    : `${FIELDS.join(",")}\n`;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function readTrimmed(path: string): string {
  return readFileSync(path, "utf8").trim();
}

function authorized(req: IncomingMessage, url: URL): boolean {
  const auth = req.headers.authorization ?? "";
  const provided = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : (url.searchParams.get("token") ?? "");
  try {
    return Boolean(provided && safeEqual(provided, readTrimmed(TOKEN_FILE)));
  } catch {
    return false;
  }
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    send(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/visitors") {
    if (!authorized(req, url)) {
      send(res, 401, { error: "unauthorized" }, "application/json", {
        "WWW-Authenticate": 'Bearer realm="STKCraft visitors"',
      });
      return;
    }
    const rows = readRows();
    if ((url.searchParams.get("format") ?? "json").toLowerCase() === "csv") {
      send(res, 200, csvBody(rows), "text/csv; charset=utf-8", {
        "Content-Disposition": 'attachment; filename="stkscraft-visitors.csv"',
      });
      return;
    }
    send(res, 200, {
      count: rows.length,
      generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      fields: [...FIELDS],
      rows,
    });
    return;
  }

  if (req.method !== "POST" || url.pathname !== "/webhook") {
    send(res, 404, { error: "not found" });
    return;
  }

  let body: Buffer;
  try {
    body = await readBody(req);
  } catch (error) {
    send(res, 413, { error: String(error) });
    return;
  }

  let secret: string;
  try {
    secret = readTrimmed(SECRET_FILE);
  } catch (error) {
    send(res, 500, { error: `secret unavailable: ${String(error)}` });
    return;
  }
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const signatureHeader = req.headers["x-hub-signature-256"];
  const signature = Array.isArray(signatureHeader) ? (signatureHeader[0] ?? "") : (signatureHeader ?? "");
  if (!safeEqual(signature, expected)) {
    send(res, 401, { error: "bad signature" });
    return;
  }

  const eventHeader = req.headers["x-github-event"];
  const event = Array.isArray(eventHeader) ? (eventHeader[0] ?? "") : (eventHeader ?? "");
  if (event === "ping") {
    send(res, 200, { ok: true, message: "pong" });
    return;
  }
  if (event !== "push") {
    send(res, 204, { ok: true, message: "ignored event" });
    return;
  }

  let payload: { ref?: string; repository?: { full_name?: string } };
  try {
    payload = JSON.parse(body.toString("utf8"));
    if (!payload || typeof payload !== "object") throw new Error("invalid payload");
  } catch {
    send(res, 400, { error: "invalid json" });
    return;
  }
  if (payload.ref !== "refs/heads/main" || !REPOSITORIES.has(payload.repository?.full_name ?? "")) {
    send(res, 204, { ok: true, message: "ignored ref" });
    return;
  }
  // systemd.path persists/coalesces requests arriving during an active build.
  writeFileSync(`${PENDING}.next`, `${Date.now()} ${payload.repository?.full_name}\n`, { mode: 0o600 });
  renameSync(`${PENDING}.next`, PENDING);
  send(res, 202, { ok: true, message: "deploy queued" });
}

if (!existsSync(SECRET_FILE)) {
  console.error(`missing webhook secret: ${SECRET_FILE}`);
  process.exit(1);
}

const server = createServer((req, res) => {
  handle(req, res).catch((error: unknown) => {
    console.error(error);
    if (!res.headersSent) send(res, 500, { error: "internal error" });
    else res.end();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`STKCraft webhook listening on ${HOST}:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
