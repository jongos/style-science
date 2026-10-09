import {deriveStudy} from './study.js';

const structure = document.querySelector('#structure');
const expression = document.querySelector('#expression');
const study = document.querySelector('.experiment');
const specimen = document.querySelector('#specimen');
const points = [...document.querySelectorAll('[data-point]')];
const plot = document.querySelector('#study');
function updateStudy() {
  const state = deriveStudy(structure.value, expression.value);
  for (const id of ['structure', 'expression']) document.querySelector(`#${id}-value`).value = String(state[id]);
  for (const [name, value] of Object.entries({font: state.font, weight: state.weight, heading: `${state.heading}px`, gap: `${state.gap}px`, leading: state.leading, radius: `${state.radius}px`, accent: state.accent, surface: state.surface, ink: state.ink})) specimen.style.setProperty(`--sample-${name}`, value);
  study.style.setProperty('--dot-color', state.accent);
  const width = plot.clientWidth || 600, height = plot.clientHeight || 360;
  plot.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const plotted = state.points.map(p=>({x:p.x * width / 600, y:p.y * height / 360, radius:p.radius * Math.min(1, width / 600)}));
  points.forEach((point, i) => {
    point.setAttribute('cx', plotted[i].x);
    point.setAttribute('cy', plotted[i].y);
    point.setAttribute('r', plotted[i].radius);
  });
  document.querySelector('#study-links').setAttribute('d', plotted.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' '));
  document.querySelector('#study').setAttribute('aria-label', `48 points in ${state.arrangement}; structure ${state.structure}, expression ${state.expression}.`);
  const fields = {family: state.family, weight: state.weight, size: `${state.heading}px`, gap: `${state.gap}px`, leading: state.leading, radius: `${state.radius}px`, accent: state.accent, surface: state.surface};
  for (const [id, value] of Object.entries(fields)) document.querySelector(`[data-value="${id}"]`).textContent = value;
  for (const id of ['accent', 'surface']) document.querySelector(`[data-swatch="${id}"]`).style.backgroundColor = state[id];
  document.querySelector('#sample-prompt').textContent = state.prompt;
}
if (structure && expression && specimen) {
  structure.addEventListener('input', updateStudy);
  expression.addEventListener('input', updateStudy);
  updateStudy();
  new ResizeObserver(updateStudy).observe(plot);
}
