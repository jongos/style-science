import { createHash } from 'node:crypto';
import {readFileSync} from 'node:fs';
import { verify } from './engine.mjs';

export const decisionVersion = '0.3.0';
const variants = ['baseline', 'reordered', 'relabeled'];
const plain = x => x && typeof x === 'object' && !Array.isArray(x);
const scalarText = x => typeof x === 'string' && !/[\uD800-\uDFFF]/u.test(x);
const nonempty = x => scalarText(x) && x.trim().length > 0;
const codePointOrder = (a,b) => {
  const left=Array.from(a,x=>x.codePointAt(0)),right=Array.from(b,x=>x.codePointAt(0));
  for(let i=0;i<Math.min(left.length,right.length);i++) if(left[i]!==right[i]) return left[i]-right[i];
  return left.length-right.length;
};
const canonical = x => Array.isArray(x) ? `[${x.map(canonical).join(',')}]`
  : plain(x) ? `{${Object.keys(x).sort(codePointOrder).map(k => `${JSON.stringify(k)}:${canonical(x[k])}`).join(',')}}` : JSON.stringify(x);
const sameSet = (a,b) => a.length === b.length && new Set(a).size === a.length && a.every(x=>b.includes(x));
const identityPolicy = JSON.parse(readFileSync(new URL('./model-identity-policy.json',import.meta.url),'utf8'));
const identityPolicyHash = createHash('sha256').update(canonical(identityPolicy)).digest('hex');
const pinnedModel = (model,provider) => typeof model==='string' && model===model.trim() && Object.hasOwn(identityPolicy.providers,provider) && new RegExp(`^(?:${identityPolicy.providers[provider].pattern})$`).test(model);

function validateContract(c) {
  if (!plain(c) || !sameSet(Object.keys(c).filter(k=>k!=='identityPolicy'), ['id','context','requiredContext','options','abstainOptions']) || !nonempty(c.id) || (Object.hasOwn(c,'identityPolicy') && c.identityPolicy!==identityPolicy.version)) throw Error('Invalid decision contract');
  if (!plain(c.context) || !Object.keys(c.context).every(scalarText) || Object.values(c.context).some(x=>x !== null && !scalarText(x))) throw Error('Context values must be text or null');
  if (!Array.isArray(c.requiredContext) || !c.requiredContext.length || !c.requiredContext.every(nonempty) || new Set(c.requiredContext).size !== c.requiredContext.length) throw Error('Declare unique required context fields');
  if (!plain(c.options) || Object.keys(c.options).length < 2 || !Object.keys(c.options).every(nonempty) || !Object.values(c.options).every(nonempty)) throw Error('Declare at least two described options');
  if (!Array.isArray(c.abstainOptions) || !c.abstainOptions.length || !c.abstainOptions.every(nonempty) || !sameSet(c.abstainOptions,[...new Set(c.abstainOptions)]) || !c.abstainOptions.every(x=>Object.hasOwn(c.options,x)) || c.abstainOptions.length === Object.keys(c.options).length) throw Error('Declare abstention and substantive options');
}

export function decisionFingerprint(contract) {
  validateContract(contract);
  return createHash('sha256').update(canonical(contract.identityPolicy ? {...contract,identityPolicyHash} : contract)).digest('hex');
}

// Advisory only: repetition measures sensitivity, not independent corroboration.
export function assessChoice(contract, observations) {
  const contractHash = decisionFingerprint(contract);
  const base = { decisionVersion, contractHash, identityPolicyVersion:identityPolicy.version, identityPolicyHash, evidenceClass:'model-prediction', automaticAction:false, releaseEligible:false, evidenceScope:'exploratory' };
  const missing = contract.requiredContext.filter(k=>!Object.hasOwn(contract.context,k) || !nonempty(contract.context[k]));
  if (missing.length) return {...base,status:'needs-context',missing};
  if (!Array.isArray(observations)) throw Error('Observations must be an array');
  const ids = Object.keys(contract.options);
  if (observations.length !== variants.length || !sameSet(observations.map(o=>o?.variant), variants)) return {...base,status:'needs-observations'};
  if (observations.some(o=>o.contractHash !== contractHash)) return {...base,status:'stale'};
  const modelIdentities = observations.map(o=>{
    for (const key of ['model','resolvedModel','requestedModel','provider']) {
      if (o[key] !== undefined && o[key] !== null && typeof o[key] !== 'string') throw Error('Model identities must be text or null');
    }
    // An explicitly missing resolution must not fall back to a legacy value.
    const resolvedModel = (Object.hasOwn(o,'resolvedModel') ? o.resolvedModel : o.model) ?? null;
    const provider = o.provider ?? (contract.identityPolicy ? null : 'typesafe');
    return {variant:o.variant,requestedModel:o.requestedModel ?? null,resolvedModel,provider,
      identityStatus:!nonempty(resolvedModel)?'missing':pinnedModel(resolvedModel,provider) && (contract.identityPolicy || provider==='typesafe')?'pinned':'unpinned'};
  });
  base.modelIdentities = modelIdentities;
  if (modelIdentities.some(o=>o.identityStatus==='missing')) return {...base,status:'needs-model',modelIdentityStatus:'missing'};
  if (new Set(modelIdentities.map(o=>JSON.stringify([o.provider,o.resolvedModel]))).size !== 1) return {...base,status:'model-mismatch',modelIdentityStatus:'mixed'};
  const modelIdentityStatus = modelIdentities[0].identityStatus;
  const normalized = observations.map(o=>{
    const a=o.answer, map=o.optionMap;
    if (!plain(map) || !sameSet(Object.values(map),ids) || !plain(a) || !Object.hasOwn(map,a.choice) || !plain(a.probabilities) || !sameSet(Object.keys(map),Object.keys(a.probabilities))) throw Error('Invalid option mapping or answer');
    const values=Object.values(a.probabilities);
    if (values.some(p=>typeof p !== 'number' || !Number.isFinite(p) || p<0 || p>1) || Math.abs(values.reduce((s,p)=>s+p,0)-1)>0.025 || typeof a.confidence !== 'number' || !Number.isFinite(a.confidence) || a.confidence<0 || a.confidence>1) throw Error('Invalid probability or confidence');
    if (a.probabilities[a.choice] < Math.max(...values)) throw Error('Choice must maximize reported probability');
    return {variant:o.variant,choice:map[a.choice],confidence:a.confidence,probabilities:Object.fromEntries(Object.entries(a.probabilities).map(([k,p])=>[map[k],p]))};
  });
  let maxTotalVariation=0;
  for(let i=0;i<normalized.length;i++) for(let j=i+1;j<normalized.length;j++) {
    // Normalize rounded provider distributions before measuring their distance.
    const a=normalized[i].probabilities,b=normalized[j].probabilities;
    const sa=Object.values(a).reduce((s,p)=>s+p,0),sb=Object.values(b).reduce((s,p)=>s+p,0);
    maxTotalVariation=Math.max(maxTotalVariation,ids.reduce((s,k)=>s+Math.abs(a[k]/sa-b[k]/sb),0)/2);
  }
  const choice=normalized[0].choice;
  const tied=normalized.some(o=>Object.values(o.probabilities).filter(p=>p===o.probabilities[o.choice]).length>1);
  const status=normalized.some(o=>o.choice!==choice) ? 'unstable' : tied ? 'ambiguous' : contract.abstainOptions.includes(choice) ? 'abstain' : 'advisory';
  return {...base,status,choice:['unstable','ambiguous'].includes(status)?null:choice,
    model:modelIdentities[0].resolvedModel,resolvedModel:modelIdentities[0].resolvedModel,modelIdentityStatus,
    releaseEligible:modelIdentityStatus==='pinned' && status==='advisory',
    evidenceScope:modelIdentityStatus==='pinned'?'version-pinned-model-observation':'exploratory',maxTotalVariation,observations:normalized};
}

export function reviewCandidate(plan, snapshots, contract, observations) {
  const feasibility=verify(plan,snapshots);
  if(feasibility.status!=='pass') return {status:'blocked',automaticAction:false,releaseEligible:false,feasibility};
  return {feasibility,...assessChoice(contract,observations)};
}
