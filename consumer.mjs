import {readFile,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
const object=x=>x!==null && typeof x==='object' && !Array.isArray(x);

// Caller pins the sidecar through its own trusted release process.
export async function inspectDistribution(directory, expected) {
  const fallback={status:'unknown',fallback:'retain-previous-pin-and-native-gates',contract:null};
  if(!object(expected) || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(expected.sourceRevision??'') || !object(expected.files) || !expected.files['consumer-contract.json']) return {...fallback,reason:'missing-trusted-manifest'};
  try {
    const root=await realpath(directory), source=JSON.parse(await readFile(resolve(root,'SOURCE.json'),'utf8'));
    if(source.sourceRevision!==expected.sourceRevision) return {...fallback,status:'invalid',reason:'source-mismatch'};
    const names=Object.keys(expected.files).sort();
    if(names.join('\n')!==Object.keys(source.files).sort().join('\n')) return {...fallback,status:'invalid',reason:'manifest-mismatch'};
    for(const name of names) {
      if(!/^[A-Za-z0-9_./-]+$/.test(name) || name.split('/').some(x=>!x || x==='.' || x==='..')) throw Error('Invalid path');
      const target=await realpath(resolve(root,name)), rel=relative(root,target);
      if(rel.startsWith('..') || isAbsolute(rel)) throw Error('Path escapes artifact');
      const hash=createHash('sha256').update(await readFile(target)).digest('hex');
      if(hash!==expected.files[name] || source.files[name]!==hash) return {...fallback,status:'invalid',reason:'hash-mismatch',file:name};
    }
    const contract=JSON.parse(await readFile(resolve(root,'consumer-contract.json'),'utf8'));
    if(contract.contractVersion!=='1.0.0') return {...fallback,status:'unsupported',reason:'contract-version'};
    if(!object(contract.modules) || !object(contract.schemas) || !Array.isArray(contract.unsupported)) throw Error('Invalid contract');
    for(const module of Object.values(contract.modules)) if(!object(module) || !Array.isArray(module.checks) || !module.checks.every(x=>typeof x==='string') || !Array.isArray(module.files) || module.files.some(x=>!Object.hasOwn(expected.files,x))) throw Error('Missing module');
    return {status:'verified',fallback:null,sourceRevision:source.sourceRevision,contract};
  } catch {return {...fallback,status:'invalid',reason:'missing-or-malformed-artifact'};}
}

export function negotiate(inspection, request) {
  if(!object(inspection) || !['verified','unknown','invalid','unsupported'].includes(inspection.status)) return {status:'unknown',fallback:'retain-previous-pin-and-native-gates',checks:[]};
  if(inspection.status!=='verified') return {status:inspection.status,fallback:'retain-previous-pin-and-native-gates',checks:[]};
  const c=inspection.contract;
  if(!object(c) || !object(c.schemas) || !object(c.modules) || !Array.isArray(c.unsupported) || Object.values(c.modules).some(m=>!object(m)||!Array.isArray(m.checks))) return {status:'unknown',fallback:'retain-previous-pin-and-native-gates',checks:[]};
  if(!object(request) || request.contractVersion!=='1.0.0' || request.planSchema!==c.schemas.plan || ['checks','modules'].some(k=>k in request && (!Array.isArray(request[k]) || !request[k].every(x=>typeof x==='string')))) return {status:'unsupported',fallback:'retain-previous-pin-and-native-gates',checks:[]};
  const checks=(request.checks??[]).map(check=>({check,status:Object.values(c.modules).some(m=>m.checks.includes(check))?'supported':c.unsupported.includes(check)?'unsupported':'unknown'}));
  const modules=(request.modules??[]).map(module=>({module,status:Object.hasOwn(c.modules,module)?'supported':'unsupported'}));
  return {status:checks.every(x=>x.status==='supported') && modules.every(x=>x.status==='supported')?'supported':'partial',checks,modules,fallback:'native-gates-remain-required'};
}
