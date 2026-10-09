import {deriveStudy} from '../site/study.js';

export function studyMarkup() {
  const state = deriveStudy();
  const styles = `--sample-weight:${state.weight};--sample-heading:${state.heading}px;--sample-gap:${state.gap}px;--sample-leading:${state.leading};--sample-radius:${state.radius}px;--sample-accent:${state.accent};--sample-surface:${state.surface};--sample-ink:${state.ink}`;
  return `<section class="experiment" id="design-study" aria-labelledby="experiment-title">
<div class="study-heading"><span class="eyebrow">02 / Relationships in motion</span><h2 id="experiment-title">A Change Here.<br>A Different Design Everywhere.</h2><p class="caption">An authored design experiment, not a beauty score. Inter is bundled; serif and monospace specimens use system fonts.</p></div>
<div class="study-controls">
<div class="control"><label for="structure">Structure <output id="structure-value" for="structure">65</output></label><input id="structure" type="range" min="0" max="100" value="65" step="1"><div class="range-ends"><span>Dispersed</span><span>Ordered</span></div></div>
<div class="control"><label for="expression">Expression <output id="expression-value" for="expression">45</output></label><input id="expression" type="range" min="0" max="100" value="45" step="1"><div class="range-ends"><span>Restrained</span><span>Expressive</span></div></div>
</div>
<div class="apparatus"><svg id="study" viewBox="0 0 600 360" role="img" aria-label="48 points responding to structure and expression"><defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="currentColor" stroke-width=".5"/></pattern></defs><rect width="600" height="360" fill="url(#grid)" class="grid"/><path id="study-links" d=""/>${state.points.map((p, i) => `<circle data-point="${i}" cx="${p.x}" cy="${p.y}" r="${p.radius}"/>`).join('')}</svg><div class="apparatus-caption"><span>48 elements / two related inputs</span><span>Position, scale, rhythm</span></div></div>
<dl class="study-values">${[['family','Typeface',state.family],['weight','Weight',state.weight],['size','Heading',`${state.heading}px`],['gap','Spacing',`${state.gap}px`],['leading','Line Height',state.leading],['radius','Corners',`${state.radius}px`],['accent','Accent',state.accent],['surface','Surface',state.surface]].map(([id, label, value])=>`<div><dt>${label}</dt><dd>${['accent','surface'].includes(id)?`<i class="swatch" data-swatch="${id}" aria-hidden="true" style="background:${value}"></i>`:''}<output data-value="${id}" for="structure expression">${value}</output></dd></div>`).join('')}</dl>
<div class="specimen" id="specimen" style="${styles}"><article class="specimen-editorial"><span class="sample-kicker">Field notes / No. 08</span><h3>Make Room<br>for Ideas.</h3><p>A place to notice the ordinary, follow a question, and leave with a different point of view.</p><div class="sample-tags"><span>Observation</span><span>Possibility</span></div></article><article class="specimen-schedule"><span class="sample-kicker">An afternoon together</span><h3>The Open Studio</h3><p>Three sessions. One shared table.</p><dl><div><dt>14:00</dt><dd>Look closely</dd></div><div><dt>15:00</dt><dd>Make something</dd></div><div><dt>16:00</dt><dd>Compare notes</dd></div></dl></article></div>
<div class="prompt-field"><h3>A Prompt for This Direction</h3><p id="sample-prompt">${state.prompt}</p></div>
<noscript><p class="caption">This is the default specimen. JavaScript is required for the interactive study.</p></noscript>
</section>`;
}
