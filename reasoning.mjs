// Experimental winner-derived instrument; a dependency match is not design eligibility.
import {reviewCandidate} from './decision.mjs';
const record=x=>x!==null && typeof x==='object' && !Array.isArray(x);
const text=x=>typeof x==='string' && x.length>0 && !/[\uD800-\uDFFF]/u.test(x);
const revisions=x=>record(x) && Object.entries(x).every(([id,revision])=>text(id)&&text(revision));
export function verifyDependencyBindings(current, observed) {
  const base={scope:'dependency-revisions-only',qualityClaim:false};
  if(!revisions(current) || !Object.keys(current).length || !revisions(observed)) return {...base,status:'unknown',reason:'missing-or-invalid-dependency-bindings',checks:[]};
  const checks=Object.entries(current).map(([id,revision])=>({id,currentRevision:revision,observedRevision:Object.hasOwn(observed,id)?observed[id]:null,
    status:Object.hasOwn(observed,id)&&observed[id]===revision?'pass':'unknown'}));
  return {...base,status:checks.every(x=>x.status==='pass')?'pass':'unknown',checks};
}

export function reviewWithDependencies(plan, snapshots, contract, observations, current, observed) {
  const dependencies=verifyDependencyBindings(current, observed);
  const review=reviewCandidate(plan, snapshots, contract, observations);
  const result={...review,dependencies,releaseEligible:false,evidenceScope:'exploratory',experimental:true};
  if(dependencies.status!=='pass') return {...result,status:'blocked',choice:null,reason:'dependency-evidence-unknown'};
  return result;
}
