# Paroikia

An evidence-first atlas of early Christianity, c. 30–325 CE.

Paroikia (Greek παροικία, the early Christians' own word for a local
community, and the root of "parish") is an open dataset and map of where
Christian communities are attested in the first three centuries, and on what
evidence.

## The problem it fixes

The best quantitative work on early Christian expansion (Fousek et al.,
*PLOS ONE* 2018) rests on a digitization of van der Meer & Mohrmann's *Atlas
of the Early Christian World*, printed in 1958. That atlas gives no citation
per point, no dating uncertainty, and no way to ask why a dot is on the map.
Paroikia records the evidence behind the dot:

- **Every claim traces to a citable source.** A community appears because
  specific evidence items say so: inscriptions, council subscriptions,
  literary attestations, papyri. Each item carries a full citation.
- **The schema rejects point dates.** Every date is a `not_before`/`not_after`
  range with an explicit `dating_basis`.
- **The project maintains no coordinates of its own.** Places are
  [Pleiades](https://pleiades.stoa.org) URIs with a `place_certainty` grade;
  coordinates come from Pleiades.
- **Evidence quality is graded.** A dated inscription outranks a council
  subscription; a contemporary literary source outranks a retrospective one;
  hagiography ranks last. The rubric is versioned and ships with the data.

## Status

Repository scaffold. There is no data and no map yet.

| Milestone | Deliverable |
|---|---|
| 0 | Repository scaffold (done) |
| 1 | JSON Schemas, controlled vocabularies, validation pipeline, CI |
| 2 | Pleiades join: daily-dump cache, coordinate lookup, dangling-ID report |
| 3 | Pilot dataset: Asia Minor, from Harnack's *Mission and Expansion*, vol. 2 |
| 4 | Map: time slider, evidence panel with citations (Astro + MapLibre GL JS) |
| 5 | Cross-check against Fousek et al.'s points; v0.1 with a Zenodo DOI |

## Layout

```
schema/      JSON Schemas + controlled vocabularies
data/
  evidence/  one JSON file per evidence item; the hand-curated core
  claims/    presence claims derived by the pipeline; never hand-edited
  sources/   bibliography
pipeline/    TypeScript: validate, pleiades join, derive claims, export
site/        static map (Astro + MapLibre GL JS)
analysis/    notebooks, later phases
docs/        design summary, data model, contributing guide
```

Flat-file JSON in git, a TypeScript pipeline, a static site. No backend, no
database. CI validates every pull request.

## How to cite

v0.1 will carry a Zenodo DOI. Until then, cite the repository URL and a
commit hash.

## License

Code is [MIT](LICENSE); data is [CC BY 4.0](LICENSE-data.md).
