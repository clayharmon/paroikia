import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createGunzip } from "node:zlib";
import { parse } from "csv-parse/sync";

// The CSV dump, not the JSON one: the full JSON places dump runs to hundreds
// of megabytes and exceeds what JSON.parse handles comfortably, and the index
// needs only five of its fields, all present in the CSV.
export const DEFAULT_DUMP_URL =
  "https://atlantides.org/downloads/pleiades/dumps/pleiades-places-latest.csv.gz";

export interface PleiadesPlace {
  id: string;
  title: string;
  lat: number | null;
  lon: number | null;
  min_date: number | null;
  max_date: number | null;
}

export type PleiadesIndex = Map<string, PleiadesPlace>;

function num(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function downloadDump(url: string, destCsv: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || res.body === null) {
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  }
  await pipeline(
    Readable.fromWeb(res.body as WebReadableStream),
    createGunzip(),
    createWriteStream(destCsv),
  );
}

export function buildIndex(csvText: string): PleiadesIndex {
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];
  const index: PleiadesIndex = new Map();
  for (const row of rows) {
    const id = row["id"];
    if (id === undefined || id === "") continue;
    index.set(id, {
      id,
      title: row["title"] ?? "",
      lat: num(row["reprLat"]),
      lon: num(row["reprLong"]),
      min_date: num(row["minDate"]),
      max_date: num(row["maxDate"]),
    });
  }
  return index;
}

export function writeIndex(index: PleiadesIndex, file: string): void {
  writeFileSync(file, JSON.stringify(Object.fromEntries(index)));
}

export function loadIndex(file: string): PleiadesIndex | null {
  if (!existsSync(file)) return null;
  const entries = JSON.parse(readFileSync(file, "utf8")) as Record<string, PleiadesPlace>;
  return new Map(Object.entries(entries));
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const cacheDir = join(root, ".pleiades-cache");
  const csvFile = join(cacheDir, "pleiades-places.csv");
  const indexFile = join(cacheDir, "index.json");
  const url = process.env["PLEIADES_DUMP_URL"] ?? DEFAULT_DUMP_URL;

  mkdirSync(cacheDir, { recursive: true });
  console.log(`fetching ${url}`);
  await downloadDump(url, csvFile);
  const index = buildIndex(readFileSync(csvFile, "utf8"));
  writeIndex(index, indexFile);
  console.log(`indexed ${index.size} places -> ${indexFile}`);
}
