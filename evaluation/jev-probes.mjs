import { writeFile, mkdir } from 'node:fs/promises';

// Analyst predictions are hypotheses, not labels from a human study.
export const cases = [
  ['density_lookup', 'density', 'Technicians locate one fault code among 50 on a desktop display; entries have short labels and stable IDs.', 'Compact indexed rows showing many entries.', 'Spacious entries showing fewer entries per screen.', 'A'],
  ['density_reading', 'density', 'Readers study a 4000-word explanation on desktop for understanding; there is no space limit.', 'Compact text with little separation between sections.', 'Moderate spacing with a continuous reading column.', 'B'],
  ['density_unknown', 'density', 'A page contains 50 items. Their length, purpose, audience and viewport are unspecified.', 'Compact indexed rows.', 'Spacious separated entries.', 'U'],
  ['comparison', 'structure', 'People compare three plans on the same eight attributes on desktop.', 'Aligned attribute rows across all three plans.', 'One complete narrative about each plan in sequence.', 'A'],
  ['narrative', 'structure', 'People read three independent personal accounts to understand each author; comparing matching attributes is not the task.', 'Aligned attribute rows across all three accounts.', 'One continuous narrative for each account.', 'B'],
  ['mobile_compare', 'structure', 'On a narrow phone, users compare three plans on eight attributes. Full side-by-side columns require unreadably small text.', 'Keep all columns side by side and reduce text size.', 'Use an attribute selector with readable plan values and explicit comparison labels.', 'B'],
  ['whitespace_room', 'space', 'A short explanatory page has ample screen space. Its paragraphs currently run together. Font and contrast are readable.', 'Increase separation between meaningful sections.', 'Keep section separation unchanged.', 'A'],
  ['whitespace_cost', 'space', 'A frequently used operations view has readable labels and clear grouping; extra space would hide critical rows below the fold.', 'Increase separation between all rows.', 'Retain the current compact spacing.', 'B'],
  ['palette_semantics', 'color', 'A monitoring dashboard has six distinct alarm categories that operators must identify. Text labels and icons accompany color.', 'Use multiple categorical colors with tested distinctions.', 'Use one accent color for every category.', 'A'],
  ['palette_single', 'color', 'An essay has one primary action and no categories to distinguish. Both proposed palettes pass declared contrast checks.', 'Use six categorical accent colors throughout.', 'Use one action accent with neutral reading text.', 'B'],
  ['palette_distance', 'color', 'Two palettes differ greatly in computed color-space distance. No images, audience judgments or task outcomes are available.', 'The distance proves perceived design diversity.', 'The distance is a descriptor that requires perceptual validation.', 'B'],
  ['redundancy_alarm', 'redundancy', 'A critical alarm must be understood by users including people with color-vision differences.', 'Encode the alarm in color alone.', 'Encode the alarm in color, a label and an icon.', 'B'],
  ['redundancy_noise', 'redundancy', 'A routine settings list repeats the same neutral icon, label and explanatory sentence on every row; users know the labels.', 'Retain all repeated cues on every row.', 'Remove repetitive explanations while retaining unambiguous labels.', 'B'],
  ['novelty_art', 'novelty', 'An experimental digital exhibition asks visitors to explore an unfamiliar artistic world; novelty is an explicit goal and navigation remains discoverable.', 'Use a distinctive exploratory composition.', 'Use a conventional administrative table composition.', 'A'],
  ['novelty_operations', 'novelty', 'Operators repeatedly process time-sensitive records; fast accurate operation is the goal and they know the current conventions.', 'Introduce unfamiliar navigation for distinction.', 'Preserve familiar navigation while improving the visual craft.', 'B'],
  ['symmetry_compare', 'symmetry', 'Two alternatives deserve equal attention and must be compared using the same fields.', 'Use equal visual weight and aligned fields.', 'Give one alternative much more visual weight without a stated reason.', 'A'],
  ['symmetry_priority', 'symmetry', 'A page contains one urgent task and several optional background references.', 'Give every item equal visual weight.', 'Give the urgent task more visual weight.', 'B'],
  ['brand_prior', 'context', 'A financial education game explicitly requests bright playful colors for teenagers. Readability and correctness are separately checked.', 'Apply a muted formal palette because the subject is finance.', 'Use the requested playful palette within the checked constraints.', 'B'],
  ['premium_unknown', 'context', 'A brief says premium. There is no audience, brand reference, product category or rendered image.', 'Choose a restrained monochrome style.', 'Choose an ornate colorful style.', 'U'],
  ['equivalent', 'invariance', 'Two proposals have identical content, layout, typography, interaction, measurements and rendered pixels. Only their internal IDs differ.', 'Prefer proposal A.', 'Prefer proposal B.', 'I'],
  ['font_unknown', 'typography', 'Two installed fonts are available. Their metrics, rendered samples, reading task and audience are unspecified.', 'Prefer the serif font.', 'Prefer the sans-serif font.', 'U'],
  ['line_length', 'typography', 'An English long-form article has lines spanning nearly the entire ultrawide monitor. Readers report losing their place at line breaks.', 'Constrain the reading measure while preserving comfortable type size.', 'Keep the current measure and add decorative color.', 'A'],
  ['threshold_generalization', 'epistemic', 'A layout scores well on four HTML checks: overflow, text presence, contrast and a style lock. No audience test has been run.', 'Conclude the layout is aesthetically better.', 'Conclude only the declared measured checks passed.', 'B'],
  ['unknown_measurement', 'epistemic', 'A requested mobile snapshot is absent. Desktop passes all checks.', 'Infer mobile pass from desktop.', 'Keep mobile status unknown and collect its observation.', 'B'],
  ['correlation', 'epistemic', 'Popular websites often use a particular spacing ratio. There is no randomized comparison or control for brand, audience or task.', 'Treat the ratio as a causal design law.', 'Treat the association as a hypothesis for controlled testing.', 'B'],
  ['confidence', 'epistemic', 'A model assigns 99 percent confidence to a design recommendation. No domain calibration or human outcome data exists.', 'Treat the recommendation as experimentally validated.', 'Record a confident model prediction with empirical benefit untested.', 'B'],
  ['constraint', 'epistemic', 'A candidate has a declared contrast failure but receives a high aesthetic score.', 'Allow the score to compensate for the failure.', 'Keep it ineligible until the requirement is satisfied or explicitly revised.', 'B'],
  ['scalar_weights', 'mathematics', 'Two feasible candidates trade off task completion speed and audience preference. Stakeholders have supplied no exchange rate between them.', 'Choose universal fixed weights and declare one optimal.', 'Retain both nondominated options pending a context-specific preference or experiment.', 'B'],
  ['sample_transfer', 'epistemic', 'A layout intervention improves a single desktop essay for five expert designers. The proposed deployment is a mobile reference tool for novice users.', 'Transfer the result as an established benefit.', 'Treat transfer as an untested hypothesis requiring target-task evaluation.', 'B'],
  ['stop_rule', 'mathematics', 'An additional design iteration has unknown expected benefit and a known positive rendering/review cost. No outcome history or deadline is supplied.', 'Always generate another variation.', 'Always stop immediately.', 'U'],
];

export function buildBatch(subset, variant) {
  const questions = {}, mapping = {};
  for (const [id, family, scenario, a, b, prediction] of subset) {
    const meanings = { A:a, B:b, U:'The supplied evidence is insufficient to prefer either proposal.', I:'The supplied evidence establishes no relevant difference between the proposals.' };
    const labels = variant === 2 ? {A:'B',B:'A',U:'I',I:'U'} : {A:'A',B:'B',U:'U',I:'I'};
    const order = variant === 1 ? ['I','U','B','A'] : ['A','B','U','I'];
    const key = `${id}_v${variant}`;
    questions[key] = {type:'choice',instructions:`Scenario: ${scenario} Which conclusion or design direction is best supported for the stated task? Judge the supplied descriptions, not the option letters. Use insufficient evidence when a preference requires missing information; use no relevant difference only when equivalence is established.`,criteria:Object.fromEntries(order.map(k=>[labels[k],meanings[k]]))};
    mapping[key] = {id,family,prediction,variant,decode:Object.fromEntries(Object.entries(labels).map(([meaning,label])=>[label,meaning]))};
  }
  return {state:{study:'Exploratory semantic design probes. Synthetic descriptions only. No rendered images or human outcome measurements. Each question is independent.'},questions,mapping};
}

if (process.argv[1]?.endsWith('jev-probes.mjs')) {
  const root = new URL('./jev-pass-2026-10-07/', import.meta.url);
  await mkdir(root,{recursive:true});
  for (let group=0;group<2;group++) for(let variant=0;variant<(group===0?3:1);variant++) {
    await writeFile(new URL(`batch-${group}-${variant}.json`,root),JSON.stringify(buildBatch(cases.slice(group*15,group*15+15),variant),null,2)+'\n');
  }
  console.log('Prepared the four executed batches: 60 judgments. Further broad screening was stopped to require a concrete feature decision.');
}
