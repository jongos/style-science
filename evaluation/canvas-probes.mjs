import {mkdir,writeFile} from 'node:fs/promises';

export const hypotheses = [
  {id:'intervals',feature:'Outcome comparison',ifSupported:'Add bounded effect intervals and an inconclusive state',ifRefuted:'Reject interval verdicts and retain raw measurement display only'},
  {id:'comparability',feature:'Measurement identity',ifSupported:'Require matching context, environment, units and instrument',ifRefuted:'Reject generalized comparison and accept only explicitly paired records'},
  {id:'experiment',feature:'Experiment admission',ifSupported:'Require concrete feature actions under both outcomes',ifRefuted:'Remove generic experiment scheduling and keep manual research only'},
];
export const cases = [
  ['overlap','intervals','Two measured completion-time ranges overlap. The candidate has a lower midpoint but the supplied bounds allow it to be slower. No probability distribution is supplied.','Mark the candidate faster using the midpoint.','Report an unresolved effect from the supplied bounds.','B'],
  ['separated','intervals','The entire measured candidate time range is below the entire baseline range by more than the declared meaningful difference. Conditions and units match.','Report improvement on this measured time outcome only.','Declare overall design quality improved.','A'],
  ['small_effect','intervals','A difference is fully inside the task owner\'s declared practically negligible band. Both signed improvement and signed worsening inside that band are possible.','Report practically negligible under these supplied bounds and declared band.','Report that the designs are visually identical.','A'],
  ['threshold','intervals','An effect range touches the meaningful-improvement threshold but also includes smaller effects.','Report unambiguous meaningful improvement.','Report inconclusive relative to that threshold.','B'],
  ['probability','intervals','Only lower and upper engineering bounds are supplied, with no sampling design or probability model.','Use the range width to infer probability of improvement.','Preserve bounds without inventing probability.','B'],
  ['units','comparability','One completion-time record is in milliseconds and one in seconds. No approved unit conversion has been applied.','Compare raw numbers directly.','Require explicit normalization to matching units before comparison.','B'],
  ['environment','comparability','The baseline is measured on desktop and the candidate only on mobile; the task is intended to work on both.','Treat the two records as a paired effect.','Require corresponding observations in each declared environment.','B'],
  ['instrument','comparability','Baseline comprehension uses a five-item quiz; candidate comprehension uses a different ten-item quiz, with no validated crosswalk.','Compare percentages as an equivalent instrument.','Keep the effect unknown until instruments are comparable.','B'],
  ['proxy','comparability','Candidate performance is predicted by Jev while baseline performance is measured with target users.','Treat both as observed outcomes.','Separate model predictions from measured outcomes.','B'],
  ['tradeoff','comparability','Candidate improves lookup time and worsens error rate. No permitted exchange rate is specified.','Preserve the per-outcome tradeoff without choosing a winner.','Combine the outcomes using equal weights.','A'],
  ['actionable','experiment','A proposed spacing experiment names the affected feature, baseline, intervention, outcome metric, budget, and different feature actions for supportive versus refuting evidence.','Accept its plan for review, without claiming preregistration or permission to collect human data.','Discard it because no outcome is known in advance.','A'],
  ['no_action','experiment','A proposed color experiment has the same action under every result: retain the existing feature without modification.','Admit it into the feature-development queue.','Reject it from this queue because no possible result changes a feature decision.','B'],
];
const root=new URL('./canvas-pass-2026-10-07/',import.meta.url);
await mkdir(root,{recursive:true});
for(let variant=0;variant<3;variant++) {
  const questions={},mapping={};
  for(const [id,hypothesis,scenario,a,b,prediction] of cases) {
    const descriptions={A:a,B:b,U:'Insufficient information to choose either interpretation.'};
    const labels=variant===2?{A:'B',B:'U',U:'A'}:{A:'A',B:'B',U:'U'};
    const order=variant===1?['U','B','A']:['A','B','U'];
    const key=`${id}_v${variant}`;
    questions[key]={type:'choice',instructions:`${scenario} Which implementation behavior is justified by the stated evidence? This is a semantic contract review, not a request to calculate or assert design laws.`,criteria:Object.fromEntries(order.map(k=>[labels[k],descriptions[k]]))};
    mapping[key]={hypothesis,prediction,decode:Object.fromEntries(Object.entries(labels).map(([meaning,label])=>[label,meaning]))};
  }
  await writeFile(new URL(`batch-${variant}.json`,root),JSON.stringify({state:{purpose:'Review proposed mathematical design-canvas features using synthetic scenarios. Each question is independent.'},hypotheses,questions,mapping},null,2)+'\n');
}
console.log('Prepared 36 semantic probes for three actionable feature hypotheses.');
