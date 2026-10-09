import {deriveStudy} from './study.js';

const structure = document.querySelector('#structure');
const expression = document.querySelector('#expression');
const specimen = document.querySelector('#specimen');
const points = [...document.querySelectorAll('[data-point]')];
const plot = document.querySelector('#study');
function updateStudy() {
  const state = deriveStudy(structure.value, expression.value);
  for (const id of ['structure', 'expression']) document.querySelector(`#${id}-value`).value = String(state[id]);
  for (const [name, value] of Object.entries({font: state.font, weight: state.weight, heading: `${state.heading}px`, gap: `${state.gap}px`, leading: state.leading, radius: `${state.radius}px`, accent: state.accent, surface: state.surface, ink: state.ink})) specimen.style.setProperty(`--sample-${name}`, value);
  const width = plot.clientWidth || 600, height = plot.clientHeight || 360;
  plot.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const plotted = state.points.map(p=>({x:p.x * width / 600, y:p.y * height / 360, radius:p.radius * Math.min(1, width / 600)}));
  points.forEach((point, i) => {
    point.setAttribute('cx', plotted[i].x);
    point.setAttribute('cy', plotted[i].y);
    point.setAttribute('r', plotted[i].radius);
    point.style.fill = i % 8 === 0 ? 'var(--paper)' : 'var(--ink)';
    point.style.strokeWidth = i % 8 === 0 ? '3' : '2';
  });
  // Paint nearer nodes last while retaining stable point identities and connections.
  [...points].sort((a,b)=>state.points[Number(a.dataset.point)].depth-state.points[Number(b.dataset.point)].depth).forEach(point=>plot.appendChild(point));
  document.querySelector('#depth-value').textContent = `${state.depth}/100`;
  const links = document.querySelector('#study-links');
  if (!links.children.length) state.bands.forEach(() => links.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path')));
  state.bands.forEach((band, i) => {
    const path = links.children[i];
    path.setAttribute('d', band.indices.map((index, j) => `${j ? 'L' : 'M'}${plotted[index].x},${plotted[index].y}`).join(' '));
    path.style.strokeWidth = band.width * Math.min(1, width / 600);
  });
  document.querySelector('#study').setAttribute('aria-label', `48 points in ${state.arrangement}; structure ${state.structure}, expression ${state.expression}, derived depth ${state.depth} out of 100.`);
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
