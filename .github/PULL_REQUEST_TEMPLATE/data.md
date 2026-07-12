## Source

<!--
Where these evidence items come from: edition, volume, page or section
numbers. Precise enough that a reviewer can re-find each passage.
-->

## Items

<!--
One row per evidence item. Link the location (the Pleiades place) and each
source so a reviewer can open them without leaving the PR. Leave the
secondary link out if there is no online copy; drop the column if none of
the items cite secondary scholarship.
-->

| Item | Location (Pleiades) | Primary | Secondary |
|---|---|---|---|
| `lit-example-place` | [123456](https://pleiades.stoa.org/places/123456) | [Author, Work 1.2](https://example.org/text) | [Editor, Title, p. 00](https://archive.org/details/example) |

## Verification

<!--
One checkbox per item, ticked when a person has checked it against the
source (AGENTS.md, invariant 5). LLM-assisted extraction is welcome;
unverified extraction is not. Spell out anything the reviewer must decide:
a disputed date, an uncertain or provisional Pleiades id.
-->

- [ ] `lit-example-place`: Author, Work 1.2; date 00–00

## Checks

- [ ] Every item passes `pnpm validate`
- [ ] Dates are `not_before`/`not_after` ranges with a `dating_basis`
- [ ] Places are Pleiades URIs with a `place_certainty` grade, and none dangle
- [ ] Every item has a source citation block
- [ ] Nothing under `data/claims/` was hand-edited
- [ ] The source's license permits redistribution under CC BY 4.0
