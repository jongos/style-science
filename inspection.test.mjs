import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolvePython} from './tools/python.mjs';
import {inspectionFingerprint,verifyInspection,inspectValue} from './inspection.mjs';
const plan={schemaVersion:1,artifactSha256:'a'.repeat(64),environment:{medium:'html',width:390,height:844,theme:'light',state:'expanded'},renderer:{name:'chromium',version:'fixture'},checks:[{id:'clip',kind:'scroll-containment',selector:'#copy'}]};
test('inspection scope binds artifact, plan, renderer, environment, state and settling',()=>{
  const good={planHash:inspectionFingerprint(plan),artifactSha256:plan.artifactSha256,environment:plan.environment,renderer:plan.renderer,settled:true,observations:{clip:{source:'rendered',facts:{scrollWidth:100,clientWidth:100,scrollHeight:30,clientHeight:30}}}};
  assert.equal(verifyInspection(plan,good).status,'pass');
  for(const change of [{artifactSha256:'b'.repeat(64)},{planHash:'bad'},{settled:false},{environment:{...plan.environment,state:'loading'}},{renderer:{name:'chromium',version:'other'}}]) assert.equal(verifyInspection(plan,{...good,...change}).status,'unknown');
  assert.equal(inspectValue('native-pagination',{valid:true}),'unknown');
  assert.equal(inspectValue('scroll-containment',{scrollWidth:101,clientWidth:100,scrollHeight:30,clientHeight:30}),'fail');
});
test('original DOCX package cases retain native facts and JS/Python verification parity',()=>{
  const source="import json,hashlib\nfrom evaluation.native_fixtures import native_fixture\nfrom docx_adapter import capture_docx\nfrom inspection import verify_inspection\nrows=[]\nfor variant in ['normal','missing-title','heading-jump','missing-font','wide-table','bad-page','long-content']:\n data=native_fixture(variant)\n p=dict(schemaVersion=1,artifactSha256=hashlib.sha256(data).hexdigest(),environment=dict(medium='docx',width=816,height=1056,theme='light',state='saved'),renderer=dict(name='ooxml-package',version='1'),checks=[dict(id=k,kind=k) for k in ['native-title','native-headings','native-fonts','native-page-geometry','native-table-bounds','native-pagination']])\n s=capture_docx(data,p,['Inter'])\n rows.append(dict(variant=variant,plan=p,snapshot=s,report=verify_inspection(p,s)))\nprint(json.dumps(rows))";
  const run=spawnSync(resolvePython(),['-X','utf8','-c',source],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);const rows=JSON.parse(run.stdout);
  for(const r of rows) assert.deepEqual(verifyInspection(r.plan,r.snapshot),r.report);
  assert.equal(rows[0].report.status,'unknown'); assert.ok(rows.slice(1,6).every(r=>r.report.status==='fail'));
  assert.ok(rows.every(r=>r.report.results.find(x=>x.kind==='native-pagination').status==='unknown'));
});
