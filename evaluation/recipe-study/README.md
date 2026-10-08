# Recipe Screening Record

Start with the [agent guides](../../guides/recipes/README.md). This folder contains the supporting record for a no-pilot text-and-number screen performed through the authorized TypeSafe playground on 2026-10-07, expanded at the user's request until exactly 1,000 winners were retained.

## Results

1,000 winners, 1,318 losers, 2,318 distinct candidates and 6,954 completed judgments from `jev-1.13.0`. Selection uses majority vote across original, reversed and relabeled options, with declared token contrast as a separate gate. Of the retained recipes, 915 had unanimous votes and 85 had split votes. Confidence values are preserved but are not probabilities of beauty.

The original 1,000 attempts yielded 413 winners. The user then clarified that the target was 1,000 winners. Under the [continuation contract](CONTINUATION.md), 1,318 new combinations were evaluated without rerunning rejected recipes or weakening thresholds. Later batches shrank to the remaining winner count so the final library would contain exactly 1,000. This is a winner-targeted search, not an unbiased aesthetic acceptance-rate estimate.

The user requested binary best guesses and winner-only retention. Only the winning recipes and their judgments remain. Aggregate loser counts are retained, but losing inputs and mixed-batch outputs are not archived. This intentionally limits full outcome auditing.

## Files

- `winners.json`: full numerical recipes, prompts, three raw winning-recipe judgments and decoding maps.
- `summary.json`: coverage, counts, token usage, limitations and transport notes.
- `urls.txt`: 300 distinct-domain reference URLs, with no site content.
- `corpus.json` and `collection-log.json`: URL discovery source, assigned context and collection metadata. Target sites were not individually inspected or availability-checked.
- `manifest.json` and `run-contract.json`: frozen candidate hash and selection contract.
- `PROTOCOL.md`: scope, feature decisions and the binary selection amendment made before judging.
- `CONTINUATION.md`: the subsequent winner-target stopping rule, frozen before expansion judgments.
- `continue-study.mjs` and `request.mjs`: deterministic new combinations, the unchanged rubric, and winner-only response ingestion. Expansion losing inputs and responses never cross the disk-persistence boundary.
- `jev-final-winners.png`: a cropped response-panel capture from the final batch of four winning recipes; not an archive of a reference website.

The capture shows successful judgments from the final batch. All twelve final-batch answers were parsed and validated against their recipe IDs and option mappings.

## Reproduction Boundaries

Run the retained-data checks without any network calls:

```shell
node --test evaluation/recipe-study/study.test.mjs
```

`generate.mjs` reconstructs the initial 1,000 candidates. `prepare.mjs` creates temporary playground batches from those candidates and the frozen corpus. `analyze.mjs` requires complete responses from a new authorized run; it cannot recreate deleted responses. These scripts do not call Jev or read credentials. Regeneration is not a re-execution of the original judgments. Temporary candidates, requests and responses are Git-ignored and must be removed after winner extraction.

`build-guides.mjs` rebuilds the six Markdown guides from the retained 1,000 winners without contacting Jev or reconstructing losers. The legacy `analyze.mjs` is for the initial fixed-attempt phase only; do not use it to overwrite the combined results.

The first verbose request exceeded the service token limit and yielded no judgments. Compact requests retained the same recipes and judging rubric. The initial twenty successful batches returned 150 judgments each; twenty-nine expansion batches completed the target, with smaller final batches. One clipboard timeout was recovered from the existing completed response, with IDs checked before saving.

## What Was and Was Not Tested

All 2,318 tested recipes received three binary model judgments. Code computed declared color-pair contrast. The website corpus supplied directory inclusion, category and URL clues; it did not supply inspected design measurements. It was collected after the original set was frozen and reused for the expansion. The source is a single minimalist gallery with unequal category coverage, not a representative web sample or a holdout validation set. Context, numeric settings and prompt order rotate together, so this study cannot isolate their causal effects.

Jev accepts text only: [state documentation](https://docs.typesafe.ai/concepts/state). It did not browse the supplied links or see rendered recipes. No sites were archived, no font files were copied, and no human data were collected. Winners mean promising ideas to try, not measured beauty or verified usability. Future agents must inspect actual rendered output and validate the intended task.

The independent GDC checks and mathematical outcome canvas remain unchanged. This library is advisory knowledge, not a new verifier rule or universal aesthetic ranker.
