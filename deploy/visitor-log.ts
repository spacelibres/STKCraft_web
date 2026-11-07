import { existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync, chmodSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import ipaddr from "ipaddr.js";
import maxmind, { type CityResponse, type Reader } from "maxmind";
import { FIELDS, type VisitorRow } from "./fields";

const LOG_PATH = process.env.VISITOR_LOG ?? "/var/log/caddy/stkscraft-access.log";
const STATE_PATH = process.env.VISITOR_STATE ?? "/var/lib/stkscraft/visitor-state.json";
const CSV_PATH = process.env.VISITOR_CSV ?? "/var/lib/stkscraft/visitors.csv";
const GEOIP_PATH = process.env.VISITOR_GEOIP ?? "/var/lib/stkscraft/geoip/dbip-city.mmdb";
const LOCK_PATH = process.env.VISITOR_LOCK ?? "/var/lib/stkscraft/visitor-log.lock";
const SKIP_PATHS = ["/health", "/webhook", "/api/visitors"];
const IGNORED_IPS = new Set(["127.0.0.1", "::1", "176.122.160.172", "2607:8700:5501:67ab::2"]);

interface LogEntry {
  ts?: number;
  request?: {
    remote_ip?: string;
    uri?: string;
    headers?: Record<string, string[]>;
  };
}

interface State {
  inode?: number;
  offset?: number;
}

function utc(ts: number): string {
  return new Date(ts * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function firstHeader(headers: Record<string, string[]> | undefined, name: string): string {
  const value = headers?.[name] ?? headers?.[name.toLowerCase()] ?? [];
  return String(value[0] ?? "").slice(0, 500);
}

function geo(reader: Reader<CityResponse> | null, ip: string): [string, string, string, string] {
  if (!reader) return ["", "", "", ""];
  try {
    const row = reader.get(ip);
    return [
      row?.country?.iso_code ?? "",
      row?.country?.names?.en ?? "",
      row?.subdivisions?.[0]?.names?.en ?? "",
      row?.city?.names?.en ?? "",
    ];
  } catch {
    return ["", "", "", ""];
  }
}

function isPublic(ip: string): boolean {
  if (IGNORED_IPS.has(ip)) return false;
  try {
    return ipaddr.parse(ip).range() === "unicast";
  } catch {
    return false;
  }
}

function loadRows(): Map<string, VisitorRow> {
  const rows = new Map<string, VisitorRow>();
  if (!existsSync(CSV_PATH)) return rows;
  const parsed = parse(readFileSync(CSV_PATH, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  for (const record of parsed) {
    const ip = String(record.ip ?? "").trim();
    if (!ip) continue;
    const row = {} as VisitorRow;
    for (const field of FIELDS) row[field] = String(record[field] ?? "");
    rows.set(ip, row);
  }
  return rows;
}

function writeRows(rows: Map<string, VisitorRow>): void {
  mkdirSync(CSV_PATH.replace(/[^/]+$/, ""), { recursive: true });
  chmodSync(CSV_PATH.replace(/[^/]+$/, ""), 0o700);
  const sorted = [...rows.values()].sort((a, b) => a.ip.localeCompare(b.ip));
  const body = sorted.length
    ? stringify(sorted, { header: true, columns: [...FIELDS] })
    : `${FIELDS.join(",")}\n`;
  const temp = `${CSV_PATH}.tmp`;
  writeFileSync(temp, body, { encoding: "utf8", mode: 0o600 });
  renameSync(temp, CSV_PATH);
  chmodSync(CSV_PATH, 0o600);
}

function acquireLock(): boolean {
  if (existsSync(LOCK_PATH)) {
    try {
      if (Date.now() - statSync(LOCK_PATH).mtimeMs > 10 * 60_000) unlinkSync(LOCK_PATH);
    } catch {
      // ignore and try to create it below
    }
  }
  try {
    writeFileSync(LOCK_PATH, String(process.pid), { flag: "wx", mode: 0o600 });
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  if (!existsSync(LOG_PATH)) {
    console.log(`access log not present yet: ${LOG_PATH}`);
    return;
  }
  if (!acquireLock()) {
    console.log("another collector is running");
    return;
  }

  try {
    let state: State = {};
    if (existsSync(STATE_PATH)) {
      try {
        state = JSON.parse(readFileSync(STATE_PATH, "utf8")) as State;
      } catch {
        state = {};
      }
    }

    let reader: Reader<CityResponse> | null = null;
    if (existsSync(GEOIP_PATH)) {
      try {
        reader = await maxmind.open<CityResponse>(GEOIP_PATH);
      } catch (error) {
        console.log(`geoip unavailable: ${String(error)}`);
      }
    }

    const rows = loadRows();
    const stat = statSync(LOG_PATH);
    let offset = Number(state.offset ?? 0);
    if (Number(state.inode) !== stat.ino || offset > stat.size) offset = 0;

    const data = readFileSync(LOG_PATH).subarray(offset);
    const end = data.lastIndexOf(0x0a);
    const chunk = end < 0 ? Buffer.alloc(0) : data.subarray(0, end + 1);
    const newOffset = offset + chunk.length;

    let added = 0;
    let updated = 0;
    for (const raw of chunk.toString("utf8").split("\n")) {
      if (!raw.trim()) continue;
      let entry: LogEntry;
      try {
        entry = JSON.parse(raw) as LogEntry;
      } catch {
        continue;
      }
      const request = entry.request ?? {};
      const uri = request.uri ?? "";
      if (SKIP_PATHS.some((prefix) => uri.startsWith(prefix))) continue;
      const ip = String(request.remote_ip ?? "").trim();
      if (!isPublic(ip)) continue;

      const seen = utc(Number(entry.ts ?? 0));
      const path = (uri.split("?")[0] || "/").slice(0, 300);
      const referer = firstHeader(request.headers, "Referer");
      const agent = firstHeader(request.headers, "User-Agent");
      const existing = rows.get(ip);
      if (existing) {
        existing.last_seen_utc = seen;
        existing.hits = String(Number(existing.hits || 0) + 1);
        existing.last_path = path;
        existing.last_referer = referer;
        existing.last_user_agent = agent;
        updated += 1;
      } else {
        const [countryCode, country, region, city] = geo(reader, ip);
        rows.set(ip, {
          ip,
          first_seen_utc: seen,
          last_seen_utc: seen,
          hits: "1",
          country_code: countryCode,
          country,
          region,
          city,
          last_path: path,
          last_referer: referer,
          last_user_agent: agent,
        });
        added += 1;
      }
    }

    writeRows(rows);
    mkdirSync(STATE_PATH.replace(/[^/]+$/, ""), { recursive: true, mode: 0o700 });
    writeFileSync(STATE_PATH, JSON.stringify({ inode: stat.ino, offset: newOffset }), {
      encoding: "utf8",
      mode: 0o600,
    });
    console.log(`visitors: ${rows.size} unique, ${added} new, ${updated} updated`);
  } finally {
    try {
      unlinkSync(LOCK_PATH);
    } catch {
      // already gone
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
