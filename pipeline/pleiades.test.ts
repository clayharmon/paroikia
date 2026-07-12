import { readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildIndex, loadIndex, writeIndex } from "./pleiades.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const miniDump = readFileSync(join(here, "fixtures", "pleiades", "places-mini.csv"), "utf8");

describe("buildIndex", () => {
  const index = buildIndex(miniDump);

  it("indexes every row by Pleiades id", () => {
    expect(index.size).toBe(3);
    expect([...index.keys()].sort()).toEqual(["550893", "599612", "999999"]);
  });

  it("joins coordinates for a located place (Ephesus)", () => {
    const ephesus = index.get("599612");
    expect(ephesus?.title).toBe("Ephesos");
    expect(ephesus?.lat).toBeCloseTo(37.94, 2);
    expect(ephesus?.lon).toBeCloseTo(27.34, 2);
    expect(ephesus?.min_date).toBe(-750);
    expect(ephesus?.max_date).toBe(640);
  });

  it("keeps unlocated places with null coordinates", () => {
    const unlocated = index.get("999999");
    expect(unlocated?.lat).toBeNull();
    expect(unlocated?.lon).toBeNull();
    expect(unlocated?.min_date).toBeNull();
  });
});

describe("index persistence", () => {
  it("round-trips through writeIndex/loadIndex", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pleiades-test-"));
    const file = join(dir, "index.json");
    const index = buildIndex(miniDump);
    writeIndex(index, file);
    const loaded = loadIndex(file);
    expect(loaded).not.toBeNull();
    expect(loaded?.get("599612")).toEqual(index.get("599612"));
    expect(loaded?.size).toBe(index.size);
  });

  it("returns null when no index file exists", () => {
    expect(loadIndex(join(tmpdir(), "does-not-exist", "index.json"))).toBeNull();
  });
});
