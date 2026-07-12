import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateDataset, type Issue } from "./validate.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixtures = join(here, "fixtures");
const schemaDir = join(here, "..", "schema");

function run(kind: "valid" | "invalid") {
  return validateDataset({
    schemaDir,
    evidenceDir: join(fixtures, kind, "evidence"),
    claimsDir: join(fixtures, kind, "claims"),
    bibFile: join(fixtures, kind, "sources", "bibliography.bib"),
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
