import {createHash} from 'node:crypto';
const canonical=x=>Array.isArray(x)?`[${x.map(canonical).join(',')}]`:x&&typeof x==='object'?`{${Object.keys(x).sort().map(k=>`${JSON.stringify(k)}:${canonical(x[k])}`).join(',')}}`:JSON.stringify(x);
export const inspectionKinds=['font-face-loaded','scroll-containment','focus-target','focus-outline','center-hit-target','native-title','native-headings','native-fonts','native-page-geometry','native-table-bounds','native-pagination'];
const scalar=x=>typeof x==='string' && !/[\uD800-\uDFFF]/u.test(x);
const fields=(x,required,optional=[])=>x && typeof x==='object' && !Array.isArray(x) && required.every(k=>Object.hasOwn(x,k)) && Object.keys(x).every(k=>required.includes(k)||optional.includes(k));

export function inspectionFingerprint(plan) {
  if(!fields(plan,['schemaVersion','artifactSha256','environment','renderer','checks']) || plan.schemaVersion!==1 || !/^[a-f0-9]{64}$/.test(plan.artifactSha256??'') ||
    !fields(plan.environment,['medium','width','height','theme','state']) || !fields(plan.renderer,['name','version']) ||
    !['html','docx'].includes(plan.environment?.medium) || !['width','height'].every(k=>Number.isSafeInteger(plan.environment[k]) && plan.environment[k]>0) ||
    !['light','dark'].includes(plan.environment.theme) || !scalar(plan.environment.state) || !plan.environment.state ||
    !['name','version'].every(k=>scalar(plan.renderer[k]) && plan.renderer[k]) ||
    !Array.isArray(plan.checks) || !plan.checks.length || plan.checks.some(c=>!fields(c,['id','kind'],['selector','expected']) || !scalar(c.id) || !c.id || !inspectionKinds.includes(c.kind) || ('selector' in c && !scalar(c.selector)) || ('expected' in c && !scalar(c.expected))) ||
    new Set(plan.checks.map(c=>c.id)).size!==plan.checks.length) throw Error('Invalid inspection plan');
  return createHash('sha256').update(canonical(plan)).digest('hex');
}

export function inspectValue(kind,facts) {
  if(!facts || facts.unknown) return 'unknown';
  const binary=(...keys)=>keys.every(k=>typeof facts[k]==='boolean')?keys.every(k=>facts[k])?'pass':'fail':'unknown';
  if(kind==='font-face-loaded') return binary('declared','loaded');
  if(kind==='focus-target') return binary('focused','enabled');
  if(kind==='focus-outline') return binary('focused','outlinePresent');
  if(kind==='center-hit-target') return binary('centerHitsTarget');
  if(kind==='scroll-containment') {
    const keys=['scrollWidth','clientWidth','scrollHeight','clientHeight'];
    if(!keys.every(k=>Number.isSafeInteger(facts[k]) && facts[k]>=0) || !facts.clientWidth || !facts.clientHeight) return 'unknown';
    return facts.scrollWidth<=facts.clientWidth && facts.scrollHeight<=facts.clientHeight?'pass':'fail';
  }
  if(kind==='native-pagination') return 'unknown';
  if(kind.startsWith('native-')) return binary('valid');
  return 'unknown';
}

export function verifyInspection(plan,snapshot) {
  const planHash=inspectionFingerprint(plan);
  const bound=snapshot && snapshot.planHash===planHash && snapshot.artifactSha256===plan.artifactSha256 &&
    canonical(snapshot.environment)===canonical(plan.environment) && canonical(snapshot.renderer)===canonical(plan.renderer) && snapshot.settled===true;
  const results=plan.checks.map(c=>{
    const expectedSource=c.kind.startsWith('native-')?'package':'rendered';
    const observation=snapshot?.observations?.[c.id];
    return {id:c.id,kind:c.kind,status:bound && observation?.source===expectedSource?inspectValue(c.kind,observation.facts):'unknown',source:expectedSource};
  });
  return {schemaVersion:1,planHash,status:results.some(x=>x.status==='fail')?'fail':results.every(x=>x.status==='pass')?'pass':'unknown',results,
    qualityClaim:false,coverage:'Declared facts only; not complete accessibility, aesthetic quality or native pagination certification'};
}
