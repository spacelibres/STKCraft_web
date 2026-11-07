import { existsSync, readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { FIELDS, type VisitorRow } from "./fields";

const CSV = process.env.VISITOR_CSV ?? "/var/lib/stkscraft/visitors.csv";

function readRows(): VisitorRow[] {
  if (!existsSync(CSV)) return [];
  const records = parse(readFileSync(CSV, "utf8"), {
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

const rows = readRows();
if (rows.length === 0) {
  console.log("No visitors recorded yet.");
  process.exit(0);
}

console.log(`${rows.length} unique IPs\n`);
console.log(
  `${"IP".padEnd(39)} ${"FIRST SEEN".padEnd(20)} ${"LAST SEEN".padEnd(20)} ${"HITS".padStart(5)}  ${"COUNTRY".padEnd(18)} ${"CITY".padEnd(20)}  LAST PATH`,
);
console.log("-".repeat(150));
for (const row of rows) {
  console.log(
    `${row.ip.slice(0, 39).padEnd(39)} ${row.first_seen_utc.slice(0, 20).padEnd(20)} ${row.last_seen_utc
      .slice(0, 20)
      .padEnd(20)} ${row.hits.padStart(5)}  ${(row.country || "-").padEnd(18)} ${(row.city || "-").padEnd(20)}  ${row.last_path.slice(0, 40)}`,
  );
}
