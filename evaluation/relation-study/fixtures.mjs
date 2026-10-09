import { designFingerprint } from '../../language.mjs';

export const design = {
  languageVersion: '0.1.0', id: 'synthetic-relations', revision: '1',
  context: { task: 'reference-lookup', audience: 'fixture-reader', medium: 'web', intent: 'quiet-hierarchy' },
  nodes: [
    { id: 'entry', kind: 'group', role: 'reference-entry', tokenRefs: [] },
    { id: 'title', kind: 'text', role: 'title', tokenRefs: [] },
    { id: 'description', kind: 'text', role: 'description', tokenRefs: [] },
  ],
  relations: [
    { id: 'entry-title', kind: 'contains', from: 'entry', to: 'title' },
    { id: 'entry-description', kind: 'contains', from: 'entry', to: 'description' },
    { id: 'reading-order', kind: 'precedes', from: 'title', to: 'description' },
    { id: 'hierarchy', kind: 'emphasizes', from: 'title', to: 'description' },
    { id: 'grouped', kind: 'groups-with', from: 'title', to: 'description' },
  ],
};

export const environments = [390, 1280].flatMap(width => ['light', 'dark'].map(colorScheme => ({
  id: `${width}-${colorScheme}`, width, height: width === 390 ? 844 : 900, colorScheme,
})));

export function makePlan() {
  return { schemaVersion: 1, id: 'synthetic-relation-measures', designHash: designFingerprint(design),
    bindings: design.nodes.map(n => ({ node: n.id, selector: `#${n.id}` })), environments: structuredClone(environments),
    requirements: [
      { id: 'parent-title', relation: 'entry-title', instrument: 'dom-parent' },
      { id: 'box-title', relation: 'entry-title', instrument: 'box-contains' },
      { id: 'parent-description', relation: 'entry-description', instrument: 'dom-parent' },
      { id: 'box-description', relation: 'entry-description', instrument: 'box-contains' },
      { id: 'dom-order', relation: 'reading-order', instrument: 'dom-before' },
      { id: 'y-order', relation: 'reading-order', instrument: 'y-before' },
    ] };
}

const pass = { 'parent-title': 'pass', 'box-title': 'pass', 'parent-description': 'pass', 'box-description': 'pass', 'dom-order': 'pass', 'y-order': 'pass' };
const titleUnknown = { 'parent-title': 'unknown', 'box-title': 'unknown', 'dom-order': 'unknown', 'y-order': 'unknown' };
export const cases = [
  { id: 'normal', css: '', expected: pass },
  { id: 'escaped-child', css: '#title{position:absolute;left:400px;top:16px}', expected: { ...pass, 'box-title': 'fail', 'y-order': 'fail' } },
  { id: 'reversed-column', css: '#entry{display:flex;flex-direction:column-reverse;justify-content:flex-end;gap:8px}#description{margin-top:0}', expected: { ...pass, 'y-order': 'fail' } },
  { id: 'wrapper', css: '', wrapper: true, expected: { ...pass, 'parent-title': 'fail' } },
  { id: 'transformed', css: '#entry{transform:translateX(1px)}', expected: { ...pass, 'box-title': 'unknown', 'box-description': 'unknown', 'y-order': 'unknown' } },
  { id: 'individual-transform', css: '#title{translate:1px}', expected: { ...pass, 'box-title': 'unknown', 'y-order': 'unknown' } },
  { id: 'hidden', css: '#title{display:none}', expected: { ...pass, 'box-title': 'unknown', 'y-order': 'unknown' } },
  { id: 'duplicate', css: '', duplicate: true, expected: { ...pass, ...titleUnknown } },
  { id: 'missing', css: '', missing: true, expected: { ...pass, ...titleUnknown } },
  { id: 'bad-selector', css: '', selector: '[', expected: { ...pass, ...titleUnknown } },
  { id: 'aliased-selector', css: '', selector: '#description', expected: { ...pass, ...titleUnknown, 'parent-description': 'unknown', 'box-description': 'unknown' } },
];

export function html(fixture = cases[0], { offset = 24, scale = 1 } = {}) {
  const title = fixture.missing ? '' : '<h1 id="title">Reference entry</h1>';
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Original GDC measurement fixture</title>
  <style>*{box-sizing:border-box}body{margin:0;background:#fafafa;color:#202020;font:16px Arial,sans-serif}
  #entry{position:relative;margin:${offset}px;width:${280*scale}px;height:${200*scale}px;padding:${16*scale}px;border:${2*scale}px solid #1a7568;background:white}
  #title,#description{display:block;margin:0;width:${220*scale}px;height:${40*scale}px;font-size:${16*scale}px;line-height:${20*scale}px}
  #title{font-weight:bold}#description{margin-top:${8*scale}px}#wrapper{height:${40*scale}px}
  ${fixture.css}</style><main id="entry">${fixture.wrapper ? `<div id="wrapper">${title}</div>` : title}<p id="description">Synthetic measurement content.</p>${fixture.duplicate ? title : ''}</main></html>`;
}
