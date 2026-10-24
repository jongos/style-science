<a href="https://jongos.github.io/style-science/#manifesto">
  <picture>
    <source media="(max-width: 600px)" srcset="docs/assets/readme-mobile.png">
    <img src="docs/assets/readme-desktop.png" width="960" alt="Style Science. Design Deserves Better Questions. Style is a language. Make its decisions legible. Design reasoning for AI, agents and automated systems.">
  </picture>
</a>

# Style Science

**Give Design Decisions a Reason.**

Style Science connects design requirements to measurable checks. Teams and agents can use its JavaScript and Python tools to compare alternatives, inspect results and revise decisions.

Its Generative Design Canvas (GDC) checks declared requirements against captured observations and reports **pass, fail or unknown** for design review.

## The Problem

A design review ends with “make it clearer” or “it feels off.” Two people can read that in two ways. An AI agent cannot check it at all.

When a team picks one design over another, the reasons can be hard to find later.

## What This Does About It

Style Science turns a vague request into a short list of checks. For example: the main heading is visible. Its text is easy to read against its background. The page does not spill off the side of a phone screen.

Each check ends in pass, fail or unknown. “Unknown” means the evidence was not collected, so Style Science does not guess. Teams and agents can use its tools to compare options and keep the reasons in view.

It is an early prototype, not a proven measure of design quality.

## Put It to Work

- **Make a brief actionable.** Turn “make it clearer” into requirements such as visible pricing, readable contrast and no mobile overflow.
- **Compare alternatives honestly.** Keep benefits, costs and missing evidence visible rather than hiding them in one score.
- **Check an agent’s output.** Test declared constraints before carrying a candidate forward for design review.
- **Share the reasoning.** Keep requirements and evidence understandable across a team and its tools.

## Try the Core

Use Style Science through its JavaScript or Python toolkit. From a checkout, with Node.js 22+:

```sh
node --input-type=module -e "import { contrast } from './engine.mjs'; console.log(contrast('#000000', '#ffffff'));"
```

Start with the [example requirement plan](examples/plan.json), then follow the [integration guide](REFERENCE.md#try-it) for JavaScript, Python and rendered observations.

[Read the manifesto](https://jongos.github.io/style-science/) · [Explore the interactive study](https://jongos.github.io/style-science/#design-study) · [Research foundations](REFERENCE.md#contextual-decisions-and-research)

## Part of the Hex Men Collection

[Hex Men](https://github.com/jongos/Hex-Men) is a directory of independent projects by Jon Gosier. Each project stands on its own; these are its members.

| Project | What It Does |
|---|---|
| [Hex Men](https://github.com/jongos/Hex-Men) | Directory of independent projects |
| [Dazzler](https://github.com/jongos/Dazzler) | Create and refine expressive visual interfaces |
| [Longshot](https://github.com/jongos/Longshot) | Independently test rendered UI tasks and provide replayable evidence |
| **Style Science** (this repository) | Provide inspectable design reasoning, constraints and evidence |
| [Spiral](https://github.com/jongos/Spiral) | Rehearse role-limited asynchronous workflows before building |
| [Shatterstar](https://github.com/jongos/Shatterstar) | Propose reversible evidence-backed simplification while preserving important tasks |
| [Mojo](https://github.com/jongos/Mojo) | Remove repetition, needless nuance and overly cautious language from AI outputs |
| [Colossus](https://github.com/jongos/Colossus) | Inventory selected developer workspaces read-only and surface evidence-backed questions |

## Further Reading

[Detailed project reference](REFERENCE.md) · [License and credits](REFERENCE.md#license-and-credits)
