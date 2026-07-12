# data

The dataset. Licensed [CC BY 4.0](../LICENSE-data.md).

- `evidence/`: one JSON file per evidence item, id-slugged filenames. This is
  the hand-curated core of the project; every file must pass schema
  validation.
- `claims/`: presence claims derived from evidence by
  `pipeline/derive-claims.ts`. Never hand-edit these. CI regenerates them and
  fails if committed claims drift from the derivation rules.
- `sources/`: the bibliography (`bibliography.bib`) that evidence citations
  key into.
