import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const changelog = fs.readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
const newest = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m);

if (!newest) {
  console.error("CHANGELOG.md has no '## [x.y.z]' release heading.");
  process.exit(1);
}

if (newest[1] !== pkg.version) {
  console.error(
    `Version mismatch: package.json is ${pkg.version}, newest CHANGELOG.md entry is ${newest[1]}.\n` +
      "Bump the patch version and add the matching changelog section in the same commit.",
  );
  process.exit(1);
}

console.log(`version ok: ${pkg.version}`);
