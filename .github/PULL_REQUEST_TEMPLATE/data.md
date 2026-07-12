## Source

<!--
Where these evidence items come from: edition, volume, page or section
numbers. Precise enough that a reviewer can re-find each passage.
-->

## Verification

<!--
Who checked each item against the source, and how. LLM-assisted extraction is
welcome; unverified extraction is not (see AGENTS.md, invariant 5).
-->

## Checks

- [ ] Every item passes `pnpm validate`
- [ ] Dates are `not_before`/`not_after` ranges with a `dating_basis`
- [ ] Places are Pleiades URIs with a `place_certainty` grade, and none dangle
- [ ] Every item has a source citation block
- [ ] Nothing under `data/claims/` was hand-edited
- [ ] The source's license permits redistribution under CC BY 4.0
