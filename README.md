<a href="https://jongos.github.io/style-science/#manifesto">
  <picture>
    <source media="(max-width: 600px)" srcset="docs/assets/readme-mobile.png">
    <img src="docs/assets/readme-desktop.png" width="960" alt="Style Science. Design Deserves Better Questions. Style is a language. Make its decisions legible. Design reasoning for AI, agents and automated systems.">
  </picture>
</a>

# Style Science

**Give Design Decisions a Reason.**

Style Science is a design reasoning and constraint toolkit for people, agents and software systems. It connects what a design must do with evidence of what it actually does, so decisions can be questioned, compared and revised.

Its Generative Design Canvas (GDC) turns declared requirements and captured observations into inspectable results: **pass, fail or unknown**. It supports human judgment without turning taste into a universal score.

## Put It to Work

- **Make a brief actionable.** Turn “make it clearer” into requirements such as visible pricing, readable contrast and no mobile overflow.
- **Compare alternatives honestly.** Keep benefits, costs and missing evidence visible rather than hiding them in one score.
- **Check an agent’s output.** Test declared constraints before carrying a candidate forward for design review.
- **Share the reasoning.** Keep requirements and evidence understandable across a team and its tools.

## Try the Core

Style Science is a toolkit, not an automatically installable agent skill. From a checkout, with Node.js 22+:

```sh
node --input-type=module -e "import { contrast } from './engine.mjs'; console.log(contrast('#000000', '#ffffff'));"
```

Start with the [example requirement plan](examples/plan.json), then follow the [integration guide](REFERENCE.md#try-it) for JavaScript, Python and rendered observations. A numerical check answers a specific requirement; it does not establish overall design quality.

GDC is an early engineering prototype. Its broader effect on design quality has not been established, and no human study has been run.

[Read the manifesto](https://jongos.github.io/style-science/) · [Explore the interactive study](https://jongos.github.io/style-science/#design-study) · [Research and limits](REFERENCE.md#contextual-decisions-and-research)

## In the Hex Men Family

| Project | How It Complements This Work |
|---|---|
| [Dazzler](https://github.com/jongos/Dazzler) | Create and refine expressive interfaces, documents and visual stories. |
| [Longshot](https://github.com/jongos/Longshot) | Independently attempt rendered interface tasks and return reproducible evidence. |
| [Spiral](https://github.com/jongos/Spiral) | Trace multi-person workflows, handoffs and waiting states before building. |
| [Shatterstar](https://github.com/jongos/Shatterstar) | Evaluate what to remove, combine, hide or defer while preserving important tasks. |

[Hex Men](https://github.com/jongos/Hex-Men) brings the collection together. Choose the project your question needs; there is no required sequence. Spiral and Shatterstar are research-informed drafts and their repositories require access.

## Further Reading

[Detailed project reference](REFERENCE.md) · [License and credits](REFERENCE.md#license-and-credits)
