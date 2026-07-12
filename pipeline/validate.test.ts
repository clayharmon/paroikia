import { readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildIndex, writeIndex } from "./pleiades.js";
import { validateDataset, type Issue } from "./validate.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixtures = join(here, "fixtures");
const schemaDir = join(here, "..", "schema");

function run(kind: "valid" | "invalid", pleiadesIndexFile?: string) {
  return validateDataset({
    schemaDir,
    evidenceDir: join(fixtures, kind, "evidence"),
    claimsDir: join(fixtures, kind, "claims"),
    bibFile: join(fixtures, kind, "sources", "bibliography.bib"),
    ...(pleiadesIndexFile !== undefined ? { pleiadesIndexFile } : {}),
  });
}

function issuesFor(issues: Issue[], filename: string): Issue[] {
  return issues.filter((i) => i.file.endsWith(filename));
}

describe("valid fixtures", () => {
  it("pass with zero issues", () => {
    const result = run("valid");
    expect(result.issues).toEqual([]);
    expect(result.evidenceCount).toBe(1);
    expect(result.claimCount).toBe(1);
    expect(result.pleiadesChecked).toBe(false);
  });
});

describe("pleiades join", () => {
  async function indexFileFrom(csv: string): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "validate-pleiades-"));
    const file = join(dir, "index.json");
    writeIndex(buildIndex(csv), file);
    return file;
  }

  it("passes when every place id resolves", async () => {
    const miniDump = readFileSync(join(fixtures, "pleiades", "places-mini.csv"), "utf8");
    const result = run("valid", await indexFileFrom(miniDump));
    expect(result.issues).toEqual([]);
    expect(result.pleiadesChecked).toBe(true);
  });

  it("flags dangling ids in evidence and claims", async () => {
    const withoutEphesus = "id,title,reprLat,reprLong,minDate,maxDate\n550893,Smyrna,38.42,27.14,-1000.0,1453.0\n";
    const result = run("valid", await indexFileFrom(withoutEphesus));
    const dangling = result.issues.filter((i) => i.message.includes("dangling Pleiades id '599612'"));
    expect(dangling).toHaveLength(2);
    const files = dangling.map((i) => i.file.split("/").pop()).sort();
    expect(files).toEqual(["congregation-ephesus-ignatius.json", "lit-ignatius-ephesians.json"]);
  });

  it("skips the check when the index file does not exist", () => {
    const result = run("valid", join(tmpdir(), "no-such-index.json"));
    expect(result.issues).toEqual([]);
    expect(result.pleiadesChecked).toBe(false);
  });
});

describe("invalid fixtures", () => {
  const { issues } = run("invalid");

  it("rejects a missing source block", () => {
    const found = issuesFor(issues, "missing-source.json");
    expect(found.some((i) => i.message.includes("source"))).toBe(true);
  });

  it("rejects not_before after not_after", () => {
    const found = issuesFor(issues, "reversed-range.json");
    expect(found.some((i) => i.message.includes("not_before"))).toBe(true);
  });

  it("rejects an evidence_type outside the vocabulary", () => {
    const found = issuesFor(issues, "bad-evidence-type.json");
    expect(found.some((i) => i.message.includes("evidence_type"))).toBe(true);
  });

  it("rejects a non-Pleiades place URI", () => {
    const found = issuesFor(issues, "bad-pleiades.json");
    expect(found.some((i) => i.message.includes("pleiades_uri"))).toBe(true);
  });

  it("rejects an id that does not match the filename", () => {
    const found = issuesFor(issues, "filename-mismatch.json");
    expect(found.some((i) => i.message.includes("does not match filename"))).toBe(true);
  });

  it("rejects a bibkey missing from the bibliography", () => {
    const found = issuesFor(issues, "unknown-bibkey.json");
    expect(found.some((i) => i.message.includes("bibkey"))).toBe(true);
  });

  it("requires a place note for unlocated items", () => {
    const found = issuesFor(issues, "unlocated-no-note.json");
    expect(found.some((i) => i.message.includes("place.note"))).toBe(true);
  });

  it("rejects a claim referencing nonexistent evidence", () => {
    const found = issuesFor(issues, "dangling-evidence.json");
    expect(found.some((i) => i.message.includes("unknown evidence reference"))).toBe(true);
  });

  it("flags every broken fixture and nothing else", () => {
    const flagged = new Set(issues.map((i) => i.file.split("/").pop()));
    expect([...flagged].sort()).toEqual([
      "bad-evidence-type.json",
      "bad-pleiades.json",
      "dangling-evidence.json",
      "filename-mismatch.json",
      "missing-source.json",
      "reversed-range.json",
      "unknown-bibkey.json",
      "unlocated-no-note.json",
    ]);
  });
});
