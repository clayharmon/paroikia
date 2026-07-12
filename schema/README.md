# schema

JSON Schemas for the two record types, plus controlled vocabularies.

- `evidence-item.schema.json`: a single piece of evidence (inscription,
  council subscription, literary attestation, papyrus). Requires a source
  citation block, a `not_before`/`not_after` range with `dating_basis`, a
  Pleiades place URI with `place_certainty`, and accepts external IDs
  (Trismegistos, EDH, papyri.info, CTS URNs).
- `presence-claim.schema.json`: a derived claim that a Christian community is
  attested at place P within a date range. Claims are generated from evidence
  items by versioned derivation rules; CI rejects hand-authored ones.
- `vocab/`: controlled vocabularies as data files with prose definitions,
  including the evidence-quality gradient (dated inscription > council
  subscription > contemporary literary > retrospective literary >
  hagiographic), maintained as a versioned rubric.
