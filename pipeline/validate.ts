import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import type { ErrorObject, ValidateFunction } from "ajv";

export interface Issue {
  file: string;
  message: string;
}

export interface DatasetPaths {
  schemaDir: string;
  evidenceDir: string;
  claimsDir: string;
  bibFile: string;
}

export interface ValidationResult {
  issues: Issue[];
  evidenceCount: number;
  claimCount: number;
}

interface VocabFile {
  vocabulary: string;
  version: string;
  terms: { value: string }[];
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function listJsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => join(dir, f));
}

function loadVocab(schemaDir: string, filename: string): Set<string> {
  const vocab = readJson(join(schemaDir, "vocab", filename)) as VocabFile;
  return new Set(vocab.terms.map((t) => t.value));
}

// Keys of @entries in a .bib file, e.g. "@book{harnack1908," -> "harnack1908".
function collectBibkeys(bibFile: string): Set<string> {
  if (!existsSync(bibFile)) return new Set();
  const text = readFileSync(bibFile, "utf8");
  return new Set(
    [...text.matchAll(/@[A-Za-z]+\s*\{\s*([^,\s]+)\s*,/g)].map((m) => m[1] as string),
  );
}

function ajvIssues(file: string, errors: ErrorObject[] | null | undefined): Issue[] {
  return (errors ?? []).map((e) => ({
    file,
    message: `${e.instancePath || "/"} ${e.message ?? "invalid"}`,
  }));
}

interface Citation {
  bibkey?: unknown;
}

function citationsOf(source: unknown): Citation[] {
  if (typeof source !== "object" || source === null) return [];
  const s = source as { primary?: unknown; secondary?: unknown };
  const lists = [s.primary, s.secondary].filter(Array.isArray);
  return lists.flat().filter((c): c is Citation => typeof c === "object" && c !== null);
}

export function validateDataset(paths: DatasetPaths): ValidationResult {
  const ajv = new Ajv2020({ allErrors: true });
  const validateEvidence: ValidateFunction = ajv.compile(
    readJson(join(paths.schemaDir, "evidence-item.schema.json")) as object,
  );
  const validateClaim: ValidateFunction = ajv.compile(
    readJson(join(paths.schemaDir, "presence-claim.schema.json")) as object,
  );

  const evidenceTypes = loadVocab(paths.schemaDir, "evidence-type.json");
  const claimTypes = loadVocab(paths.schemaDir, "claim-type.json");
  const datingBases = loadVocab(paths.schemaDir, "dating-basis.json");
  const placeCertainties = loadVocab(paths.schemaDir, "place-certainty.json");
  const bibkeys = collectBibkeys(paths.bibFile);

  const issues: Issue[] = [];
  const evidenceIds = new Set<string>();

  const checkIdAndFilename = (file: string, id: unknown, seen: Set<string>): void => {
    if (typeof id !== "string") return;
    const stem = basename(file, ".json");
    if (id !== stem) {
      issues.push({ file, message: `id '${id}' does not match filename '${stem}.json'` });
    }
    if (seen.has(id)) {
      issues.push({ file, message: `duplicate id '${id}'` });
    }
    seen.add(id);
  };

  const checkVocab = (file: string, field: string, value: unknown, allowed: Set<string>, vocabFile: string): void => {
    if (typeof value === "string" && !allowed.has(value)) {
      issues.push({ file, message: `${field} '${value}' is not in schema/vocab/${vocabFile}` });
    }
  };

  const checkRange = (file: string, notBefore: unknown, notAfter: unknown): void => {
    if (typeof notBefore === "number" && typeof notAfter === "number" && notBefore > notAfter) {
      issues.push({ file, message: `not_before (${notBefore}) is after not_after (${notAfter})` });
    }
  };

  const checkBibkeys = (file: string, source: unknown): void => {
    for (const citation of citationsOf(source)) {
      if (typeof citation.bibkey === "string" && !bibkeys.has(citation.bibkey)) {
        issues.push({ file, message: `bibkey '${citation.bibkey}' is not in the bibliography` });
      }
    }
  };

  const evidenceFiles = listJsonFiles(paths.evidenceDir);
  for (const file of evidenceFiles) {
    let doc: unknown;
    try {
      doc = readJson(file);
    } catch (err) {
      issues.push({ file, message: `not parseable as JSON: ${(err as Error).message}` });
      continue;
    }
    if (!validateEvidence(doc)) {
      issues.push(...ajvIssues(file, validateEvidence.errors));
    }
    const item = doc as {
      id?: unknown;
      evidence_type?: unknown;
      date?: { not_before?: unknown; not_after?: unknown; basis?: unknown };
      place?: { certainty?: unknown; note?: unknown };
      source?: unknown;
    };
    checkIdAndFilename(file, item.id, evidenceIds);
    checkVocab(file, "evidence_type", item.evidence_type, evidenceTypes, "evidence-type.json");
    checkVocab(file, "date.basis", item.date?.basis, datingBases, "dating-basis.json");
    checkVocab(file, "place.certainty", item.place?.certainty, placeCertainties, "place-certainty.json");
    checkRange(file, item.date?.not_before, item.date?.not_after);
    checkBibkeys(file, item.source);
    const certainty = item.place?.certainty;
    if ((certainty === "region_only" || certainty === "unlocated") && typeof item.place?.note !== "string") {
      issues.push({ file, message: `place.certainty '${String(certainty)}' requires place.note` });
    }
  }

  const claimIds = new Set<string>();
  const claimFiles = listJsonFiles(paths.claimsDir);
  for (const file of claimFiles) {
    let doc: unknown;
    try {
      doc = readJson(file);
    } catch (err) {
      issues.push({ file, message: `not parseable as JSON: ${(err as Error).message}` });
      continue;
    }
    if (!validateClaim(doc)) {
      issues.push(...ajvIssues(file, validateClaim.errors));
    }
    const claim = doc as {
      id?: unknown;
      claim_type?: unknown;
      not_before?: unknown;
      not_after?: unknown;
      evidence?: unknown;
    };
    checkIdAndFilename(file, claim.id, claimIds);
    checkVocab(file, "claim_type", claim.claim_type, claimTypes, "claim-type.json");
    checkRange(file, claim.not_before, claim.not_after);
    if (Array.isArray(claim.evidence)) {
      for (const ref of claim.evidence) {
        if (typeof ref === "string" && !evidenceIds.has(ref)) {
          issues.push({ file, message: `unknown evidence reference '${ref}'` });
        }
      }
    }
  }

  return { issues, evidenceCount: evidenceFiles.length, claimCount: claimFiles.length };
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const { issues, evidenceCount, claimCount } = validateDataset({
    schemaDir: join(root, "schema"),
    evidenceDir: join(root, "data", "evidence"),
    claimsDir: join(root, "data", "claims"),
    bibFile: join(root, "data", "sources", "bibliography.bib"),
  });
  for (const issue of issues) {
    console.error(`${issue.file}: ${issue.message}`);
  }
  console.log(`${evidenceCount} evidence item(s), ${claimCount} claim(s), ${issues.length} problem(s)`);
  if (issues.length > 0) process.exit(1);
}
