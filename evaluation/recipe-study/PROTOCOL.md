# Recipe Screening Protocol

Frozen before collection and Jev judgments, 2026-10-07. No pilot. This is a full text-and-number recipe screen, not a human study or visual preference experiment.

## Scope and Evidence

Generate 1,000 recipes before selecting a corpus of 300 distinct website URLs. Retain URLs and source/provenance metadata, not site archives, screenshots, HTML, CSS or copied assets. The corpus is reference discovery, not beauty labels or independent human votes. Directory selection and shared design families introduce bias.

Jev accepts text only (https://docs.typesafe.ai/concepts/state). A URL is not inspected page content. Do not ask Jev to pretend it browsed URLs, measured rendered properties or saw candidate screenshots. Website-specific aesthetic validation and rendered candidate verification remain untested in this pass. These unavailable tests cannot be converted to passes. This is a documented departure from the earlier proposed rendered evaluation, necessitated by the judge's input contract.

## Feature Decisions

1. Recipe coherence: choose winner or loser as requested by the user, using a best guess about contextual coherence. Winners become optional idea seeds; losers are excluded from the recommended set. This changes guide inclusion, not a universal prohibition.
2. Reference support: explicitly mark URL-only references as insufficient to establish visual similarity or quality. Remove any claim of website-validated beauty when inspection evidence is absent.
3. Presentation stability: repeat every recipe with reversed option order and relabeled options. Use a two-of-three majority for the binary result and retain disagreement as a stability warning. The user's binary selection policy replaces the initially proposed abstention/review selection policy before any judgments were collected.

## Frozen Selection Rules

For every recipe obtain three separately evaluated Choice judgments: original, reversed options, relabeled options. Options mean winner (best-guess promising text-level starting point) or loser (best-guess unsuitable for this brief). Do not rerun semantic failures to get desired answers. Transport failures may be retried and recorded. Raw response model IDs, distributions and reported confidence remain visible; confidence is not a calibrated probability of beauty and is not a selection threshold. Repeats from one model are not independent human votes.

Declared token arithmetic must pass 4.5:1 body/surface and on-accent contrast before guide recommendation. Accent colors failing small-text contrast are restricted to non-text decoration or separately verified large text; never silently used as small text. Arithmetic stays in code, not Jev.

Winner means token checks pass and at least two normalized judgments choose winner. Loser means token failure or at least two choose loser. Missing or malformed responses are operationally incomplete, not a third aesthetic category and never assumed winners. No forced survivor count, no weighted beauty score, no iterative tuning of this frozen set. These are explicitly heuristic picks, not empirically established aesthetic outcomes.

## Budget and Stopping

Exactly 1,000 candidates and 3,000 planned judgments, in bounded batches. No paid subscription or credit purchase. Stop for billing, authentication or service blocks; retain completed evidence and explicit missing coverage. No human data collection. Do not claim holdout validation: URL references cannot provide ground-truth aesthetic outcomes. Do not claim independent samples or broad aesthetic laws from this factorial library.

## Delivery

Per the user's retention instruction, preserve only winning recipes and their supporting judgments, plus generator, manifest hash, URL corpus, aggregate counts and agent-facing guides. Candidate inputs and mixed-batch responses are temporary working data and must be removed after analysis, not committed. Do not retain a loser catalog. Every guide must distinguish token checks, text-only model opinion and untested rendered behavior. No external posting or upstream contribution is part of this experiment.
