const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));
const mix = (a, b, t) => a + (b - a) * t;
const color = (a, b, t) => '#' + a.map((v, i) => Math.round(mix(v, b[i], t)).toString(16).padStart(2, '0')).join('');

// Authored demonstration mappings, not learned effects or GDC verification rules.
export function deriveStudy(structure = 65, expression = 45) {
  const s = clamp(structure) / 100, e = clamp(expression) / 100;
  const interaction = e * (1 - s);
  const family = s > .78 ? 'monospace' : e > .55 ? 'serif' : 'sans';
  const families = {sans: ['Inter', 'Inter, Arial, sans-serif'], serif: ['Georgia', 'Georgia, "Times New Roman", serif'], monospace: ['Courier New', '"Courier New", Courier, monospace']};
  const state = {
    structure: Math.round(s * 100), expression: Math.round(e * 100),
    family: families[family][0], font: families[family][1],
    weight: family === 'sans' ? Math.round((400 + 350 * e + 100 * s) / 50) * 50 : e + s * .2 > .55 ? 700 : 400,
    heading: Math.round(24 + 12 * e + 6 * interaction),
    gap: Math.round(12 + 24 * (1 - s) + 12 * e),
    leading: Number((1.4 + .25 * (1 - s) + .1 * e).toFixed(2)),
    radius: Math.round(8 * e * (1 - .6 * s)),
    accent: color([30, 76, 90], [151, 37, 76], e * .8 + interaction * .2),
    surface: color([239, 246, 246], [250, 232, 239], e),
    ink: '#20211d',
    arrangement: s > .7 ? 'an aligned grid' : s < .3 ? 'an open, dispersed composition' : 'a loosely grouped composition',
  };
  state.points = Array.from({length: 48}, (_, i) => {
    const angle = i * 2.3999632297 + e * Math.PI * 1.5;
    const radius = Math.sqrt((i + .5) / 48);
    const column = i % 8 - 3.5, row = Math.floor(i / 8) - 2.5;
    const gridX = 300 + column * (50 + 18 * e) + row * 4 * e;
    const gridY = 180 + row * (40 + 12 * e) + column * 2 * e;
    return {
      x: Number(mix(300 + Math.cos(angle) * radius * (185 + 80 * e), gridX, s).toFixed(2)),
      y: Number(mix(180 + Math.sin(angle) * radius * (100 + 50 * e), gridY, s).toFixed(2)),
      radius: Number((3 + e * 3 + (i % 6 === 0 ? 3 + 3 * interaction : 0)).toFixed(2)),
    };
  });
  state.prompt = `Design a field-notes page with ${state.arrangement}. Set headings in ${state.family} at ${state.heading}px and weight ${state.weight}; use ${state.leading} line height for body copy. Space groups ${state.gap}px apart. Pair ${state.surface} surfaces with ${state.ink} text and ${state.accent} accents, using ${state.radius}px corners. Keep the reading order clear and verify rendered contrast, font availability and mobile overflow. Preserve the content rather than letting the style dictate it.`;
  return state;
}
