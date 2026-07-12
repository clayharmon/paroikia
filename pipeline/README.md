# pipeline

TypeScript scripts (Node 22+, run with `tsx`, tested with `vitest`) that turn
hand-curated evidence into validated, geocoded, exportable data.

| Script | Purpose |
|---|---|
| `validate.ts` | JSON Schema, vocabulary, and referential checks (claims reference real evidence, dates are sane) |
| `pleiades.ts` | fetch the Pleiades daily JSON dump to a local cache, join coordinates, flag dangling IDs |
| `derive-claims.ts` | evidence items to presence claims, via explicit versioned rules |
| `export.ts` | bulk JSON, CSV, and GeoJSON time-slices, plus a Frictionless `datapackage.json` |

Validation enforces the two core invariants: no point dates, and no
coordinates maintained in this repository.
