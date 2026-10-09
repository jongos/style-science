// Optional collector. The host owns browser launch, navigation, revisions and trust.
import { relationPlanFingerprint, validateRelationPlan } from './relation-measures.mjs';

export async function captureRelationMeasures(page, design, plan, environmentId) {
  design = structuredClone(design);
  plan = structuredClone(plan);
  validateRelationPlan(design, plan);
  if (!['web', 'html'].includes(design.context.medium)) throw Error('HTML relation adapter requires web/html medium');
  if (!plan.environments.some(e => e.id === environmentId)) throw Error('Undeclared environment');
  const payload = await page.evaluate(async ({ bindings, requirements, relations }) => {
    await document.fonts.ready;
    const measurements = Object.create(null);
    const elements = new Map(), errors = new Map();
    for (const binding of bindings) {
      try {
        const matches = document.querySelectorAll(binding.selector);
        if (matches.length !== 1 || !(matches[0] instanceof HTMLElement)) errors.set(binding.node, 'selector-not-unique-html-element');
        else elements.set(binding.node, matches[0]);
      } catch { errors.set(binding.node, 'invalid-selector'); }
    }
    // One physical element cannot stand in for two declared nodes.
    const identities = new Map();
    for (const [id, el] of elements) {
      if (identities.has(el)) { errors.set(id, 'aliased-binding'); errors.set(identities.get(el), 'aliased-binding'); }
      else identities.set(el, id);
    }
    function bounds(el) {
      const rect = el.getBoundingClientRect();
      if (el.getClientRects().length !== 1 || rect.width <= 0 || rect.height <= 0) return null;
      for (let p = el; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (s.display === 'none' || s.visibility !== 'visible' || Number(s.opacity) === 0 || s.transform !== 'none' ||
            !['none', ''].includes(s.translate) || !['none', ''].includes(s.rotate) || !['none', ''].includes(s.scale) ||
            !['1', 'normal', ''].includes(s.zoom) || s.contentVisibility === 'hidden') return null;
      }
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }
    for (const requirement of requirements) {
      const relation = relations.find(r => r.id === requirement.relation);
      const a = elements.get(relation.from), b = elements.get(relation.to);
      if (errors.has(relation.from) || errors.has(relation.to)) {
        measurements[requirement.id] = { unknown: errors.get(relation.from) ?? errors.get(relation.to) }; continue;
      }
      if (requirement.instrument === 'dom-parent') measurements[requirement.id] = { value: b.parentElement === a };
      else if (requirement.instrument === 'dom-before') {
        const position = a.compareDocumentPosition(b);
        measurements[requirement.id] = position & (Node.DOCUMENT_POSITION_DISCONNECTED | Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_CONTAINED_BY)
          ? { unknown: 'nested-or-disconnected-nodes' } : { value: Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING) };
      } else {
        const from = bounds(a), to = bounds(b);
        measurements[requirement.id] = from && to ? { from, to } : { unknown: 'unsupported-box-geometry' };
      }
    }
    return { environment: { width: innerWidth, height: innerHeight, colorScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }, measurements };
  }, { bindings: plan.bindings, requirements: plan.requirements, relations: design.relations });
  return { schemaVersion: 1, planHash: relationPlanFingerprint(design, plan), designHash: plan.designHash, artifactRevision: design.revision,
    environment: { id: environmentId, ...payload.environment }, measurements: payload.measurements,
    adapter: 'gdc-relation-html/0.1.0', renderer: page.context().browser()?.version() ?? 'host-browser-version-unavailable' };
}
