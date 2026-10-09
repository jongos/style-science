// Original partial DTCG 2025.10 adapter. See evaluation/TOKEN-INTERCHANGE.md.
const object=x=>x!==null && typeof x==='object' && !Array.isArray(x) && [Object.prototype,null].includes(Object.getPrototypeOf(x));
const scalar=x=>typeof x==='string' && !/[\uD800-\uDFFF]/u.test(x);
const numeric=x=>typeof x==='number' && Number.isFinite(x) && Math.abs(x)<=Number.MAX_SAFE_INTEGER;
const supported=new Set(['number','dimension','fontFamily']);
const known=new Set([...supported,'color','fontWeight','duration','cubicBezier','strokeStyle','border','transition','shadow','gradient','typography']);
const order=(a,b)=>{const x=Array.from(a,c=>c.codePointAt(0)),y=Array.from(b,c=>c.codePointAt(0));for(let i=0;i<Math.min(x.length,y.length);i++)if(x[i]!==y[i])return x[i]-y[i];return x.length-y.length;};
const pointer=parts=>'/'+parts.map(x=>x.replaceAll('~','~0').replaceAll('/','~1')).join('/');
const copy=x=>JSON.parse(JSON.stringify(x));

export function importTokens(document) {
  const diagnostics=[], records=new Map(), resolved=new Map();
  const add=(path,code,status='invalid')=>diagnostics.push({path:pointer(path),code,status});
  let count=0;
  function json(value,depth=0) {
    if(++count>4096 || depth>32) throw Error('input-limit');
    if(value===null || typeof value==='boolean' || scalar(value) || numeric(value)) return;
    if(Array.isArray(value)) {for(const item of value) json(item,depth+1);return;}
    if(object(value)) {for(const [key,item] of Object.entries(value)) {if(!scalar(key))throw Error('invalid-json');json(item,depth+1);}return;}
    throw Error('invalid-json');
  }
  const result=()=>({adapterVersion:'0.1.0',specification:'DTCG-2025.10-partial',
    status:diagnostics.some(x=>x.status==='invalid')?'invalid':diagnostics.length?'unsupported':'supported',
    diagnostics,tokens:diagnostics.length?[]:[...resolved.values()].sort((a,b)=>order(a.path.join('.'),b.path.join('.'))),
    sourceDocument:diagnostics.length?null:copy(document),evidenceClass:'declared-tokens',qualityClaim:false});
  try {json(document);} catch(error) {add([],error.message);return result();}
  if(!object(document) || Object.hasOwn(document,'$value')) {add([],'invalid-document');return result();}
  function visit(node,path,inherited=null) {
    if(!object(node)) {add(path,'invalid-node');return;}
    const token=Object.hasOwn(node,'$value');
    for(const key of Object.keys(node).sort(order)) {
      if(key.startsWith('$') && !['$value','$type','$description','$deprecated','$extensions'].includes(key)) add([...path,key],'unsupported-property','unsupported');
      else if(token && !key.startsWith('$')) add([...path,key],'mixed-token-group');
    }
    if('$description' in node && !scalar(node.$description)) add(path,'invalid-description');
    if('$deprecated' in node && typeof node.$deprecated!=='boolean' && !scalar(node.$deprecated)) add(path,'invalid-deprecated');
    if('$extensions' in node && !object(node.$extensions)) add(path,'invalid-extensions');
    if('$type' in node && (!scalar(node.$type) || !known.has(node.$type))) add(path,'invalid-type');
    if(token) {records.set(path.join('.'),{node,path,inherited});return;}
    for(const name of Object.keys(node).sort(order).filter(x=>!x.startsWith('$'))) {
      if(!name || /[{}.]/.test(name)) {add([...path,name],'invalid-name');continue;}
      visit(node[name],[...path,name],node.$type??inherited);
    }
  }
  visit(document,[]);
  if(!records.size && !diagnostics.length) add([],'empty-document');
  function resolve(name,chain=[]) {
    if(resolved.has(name)) return resolved.get(name);
    const r=records.get(name);
    if(!r) return null;
    if(chain.includes(name)) {add(r.path,'alias-cycle');return null;}
    if(chain.length>128) {add(r.path,'alias-limit');return null;}
    const value=r.node.$value;
    const match=typeof value==='string'?/^\{([^{}]+)\}$/.exec(value):null;
    let type=r.node.$type??r.inherited, actual=value, dependencies=[], origin='literal';
    if(match && match[0]===value) {
      origin='alias';
      if(!records.has(match[1])) {add(r.path,'missing-reference');return null;}
      const diagnosticStart=diagnostics.length;
      const target=resolve(match[1],[...chain,name]);
      if(!target) {add(r.path,'unresolved-reference',diagnostics.slice(diagnosticStart).some(x=>x.status==='invalid')?'invalid':'unsupported');return null;}
      type=r.node.$type??target.type;
      if(type!==target.type) {add(r.path,'alias-type-mismatch');return null;}
      actual=target.value;dependencies=[target.path,...target.dependencies];
      if(dependencies.length>128) {add(r.path,'alias-limit');return null;}
    }
    if(!known.has(type)) {add(r.path,'missing-or-invalid-type');return null;}
    if(!supported.has(type)) {add(r.path,'unsupported-type','unsupported');return null;}
    let valid=false;
    if(type==='number') valid=numeric(actual);
    if(type==='dimension') valid=object(actual) && Object.keys(actual).length===2 && numeric(actual.value) && ['px','rem'].includes(actual.unit);
    if(type==='fontFamily') valid=(scalar(actual) && actual.length>0) || (Array.isArray(actual) && actual.length>0 && actual.every(x=>scalar(x)&&x.length>0));
    if(!valid) {add(r.path,'invalid-value');return null;}
    const entry={path:r.path,type,value:copy(actual),origin,dependencies};
    resolved.set(name,entry);return entry;
  }
  // Structural ambiguity invalidates the whole import before alias resolution.
  if(!diagnostics.length) for(const name of [...records.keys()].sort(order)) resolve(name);
  return result();
}

export function exportTokens(document) {
  const report=importTokens(document);
  if(report.status!=='supported') throw Error(`Token export blocked: ${report.status}`);
  return JSON.stringify(report.sourceDocument,null,2)+'\n';
}
