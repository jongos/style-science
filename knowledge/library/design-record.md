# Durable design decisions

For persistent records, fluid typography, safe token interchange and compatible theme proposals, follow [persistent systems](persistent-systems.md). Discover the existing project record before choosing a new direction.

For substantial projects, read the existing design document and token implementation before designing. Extend that record in place. If none exists and a durable record will help future work, create `DESIGN.md` in the authorized project alongside implementation. Do not require it for small edits, read-only reviews, isolated components or one-off snippets. Do not put client design records in the plugin repository.

Use only applicable sections; replace every example with actual decisions. Link to authoritative token files rather than maintaining duplicate value tables that will drift. Describe any unresolved disagreement between the record and implementation; neither silently overrides the user or an established design system.

```markdown
# Design decisions — Project name

## Purpose and constraints

- Artifact and region types:
- Audience and primary task:
- Existing brand/stack constraints and locked choices:
- Descriptive direction and its concrete visual consequences:
- References actually inspected, with the feature borrowed from each:
- Assumptions and unresolved decisions:

## Direction and composition

- Organizing idea and why it serves the task:
- First viewport and content order:
- Density, grouping, alignment and responsive behavior:
- Signature detail, if warranted:
- Familiar conventions deliberately retained:

## Typography

- Families, sources, licenses, fallbacks and actual weights:
- Character coverage and required numeric/OpenType features:
- Hierarchy, measure, line height and spacing:
- Font assets/CSS and loading strategy:

## Color and tokens

- Brand seed and palette provenance:
- Canonical token file and semantic role mapping:
- Light/dark modes in scope and state overrides:
- Measured contrast report and covered relationships:
- Spacing, radius, elevation and motion tokens:
- Framework adapter and version:
- Exceptions and unresolved constraints:

## Component and media conventions

- Applicable states for the components being changed:
- Form labels, validation and retained-input behavior:
- Table alignment, numeric formatting and overflow:
- Navigation/overlay semantics and focus management:
- Empty/loading/error/success feedback:
- Icon family and accessible-name rules:
- Imagery source, usage rights and art direction:
- Motion purpose and reduced-motion behavior:

## Review evidence

- Direction versus actual composition:
- Viewports and content cases inspected:
- Primary action and relevant states exercised:
- Keyboard, focus, contrast and other checks performed:
- Remaining failures or checks not performed:
- Fixes and reasons for any intentional exceptions:

## Change notes

- Date: what changed, why, and validation.
```

Do not prefill review sections with “pass” or claim screen-reader testing from a screenshot. Distinguish a contrast report from a complete interface audit. If the user wants only a critique, deliver findings without editing their record or implementation.

## Notes and credits

Adapted from Samuel Berthe's [frontend-design-deslop/design-md.md](https://github.com/samber/cc-skills/blob/f866b800353719270a9ea101a41c5e2a2618d460/skills/frontend-design-deslop/references/design-md.md), under [MIT](deslop-LICENSE.txt). Modified for the project's existing source of truth and this skill's font/color tools.
