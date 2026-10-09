# Before a Design Corpus Becomes Training Data

Source review: October 7, 2026. No dataset records, screenshots or archives were downloaded. This is a provenance and planning review, not legal clearance.

The original 300-site collection remains URL-only. A separate public UI corpus would require an explicit acquisition decision, a pinned source revision, asset-specific rights review and a declared evaluation task before use. Training and redistribution are separate decisions.

## Candidate Sources

| Source | Publisher Statement | Useful Role | Remaining Gate |
| --- | --- | --- | --- |
| [UICrit](https://github.com/google-research-datasets/uicrit) | Repository describes its work as CC BY 4.0; screenshot IDs refer to RICO | Critiques and ratings with task context | Preserve per-comment human/model/mixed origin; review image rights separately |
| [RICO](https://www.interactionmining.org/archive/rico) | Provides screenshots, structure and metadata with a separate copyright notice | Aligned appearance and hierarchy | Review screenshot terms and third-party content before any download/use |
| [Enrico](https://github.com/luileito/enrico) | Repository carries MIT labeling and describes a curated RICO-derived collection | Topic/structure benchmark candidate | Do not assume a repository license resolves every underlying screenshot's rights |
| [RICO Semantics](https://github.com/google-research-datasets/rico_semantics/blob/main/README.md) | Annotation release states CC BY-SA 4.0 | Element semantics | Preserve annotation license and attribution separately from the base images |

## Two Traps to Avoid

UICrit's documentation distinguishes comments sourced from humans, a model, or both. A dataset-level description of human critique is therefore insufficient to label every comment as independent human evidence. Ratings and critiques also measure different things; do not silently turn a usability rating into observed task completion time. [Publisher documentation](https://github.com/google-research-datasets/uicrit).

RICO's [copyright notice](https://www.interactionmining.org/archive/rico/copyright.txt) warns about copyrighted screenshot content, disclaims warranties and describes responsibility/indemnity obligations attached to downloading. We have not accepted those terms or downloaded the corpus. A license attached to a derived annotation release does not itself resolve the separate image question.

The [CC BY 4.0 deed](https://creativecommons.org/licenses/by/4.0/) describes attribution and change-notice requirements and warns that other rights may matter. Keep obligations with each asset rather than flattening a combined corpus into one license label.

## Recommended Acquisition Contract

Before the next corpus experiment, decide the following explicitly:

1. Name the permitted use: local evaluation, training, redistribution, or a particular combination. Record who approved it and the relevant source terms without putting private identities into the public repository.
2. Pin the upstream revision and hashes, retaining provenance separately for annotations, images and hierarchies. Keep externally acquired assets outside the published repository unless redistribution has been approved.
3. Preserve annotation origin at the smallest available unit. Never promote model or mixed-origin labels to independent human ground truth.
4. Group related screens by app/brand, template family and source before splitting. Screens from one family are not independent simply because their IDs differ.
5. Define what the benchmark can settle. Topic recognition is not style recognition; perceived efficiency is not measured task time; geometry is not aesthetic quality.

Until acquisition and rights review are resolved, continue with original synthetic renders and deterministic measurements. Those can test algorithms and falsify specific shortcuts, but cannot establish human preference or broad generalization.
