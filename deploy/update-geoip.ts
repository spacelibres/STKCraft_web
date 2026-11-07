import { chmodSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import maxmind, { type CityResponse } from "maxmind";

const DEST = process.env.VISITOR_GEOIP ?? "/var/lib/stkscraft/geoip/dbip-city.mmdb";
const DIR = DEST.replace(/[^/]+$/, "");

function month(offset: number): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1))
    .toISOString()
    .slice(0, 7);
}

async function download(url: string, target: string): Promise<void> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const compressed = Buffer.from(await response.arrayBuffer());
  writeFileSync(target, gunzipSync(compressed));
}

async function main(): Promise<void> {
  mkdirSync(DIR, { recursive: true, mode: 0o700 });
  const temp = `${DEST}.tmp`;
  for (const offset of [0, -1]) {
    const url = `https://download.db-ip.com/free/dbip-city-lite-${month(offset)}.mmdb.gz`;
    console.log(`trying ${url}`);
    try {
      await download(url, temp);
      await maxmind.open<CityResponse>(temp);
      renameSync(temp, DEST);
      chmodSync(DEST, 0o600);
      console.log(`updated ${DEST}`);
      return;
    } catch (error) {
      console.log(`failed: ${String(error)}`);
    }
  }
  rmSync(temp, { force: true });
  throw new Error("could not download a DB-IP Lite city database");
}

if (existsSync(DEST)) {
  console.log(`existing database: ${DEST}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
