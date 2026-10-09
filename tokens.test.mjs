import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {importTokens,exportTokens} from './tokens.mjs';
import {resolvePython} from './tools/python.mjs';

const literal=(type,value)=>({$type:type,$value:value});
const alias=path=>({$value:`{${path}}`});
const development={
  $description:'Original synthetic interchange fixture',
  space:{$type:'dimension',small:{$value:{value:0.5,unit:'rem'}},pixel:{$value:{value:8,unit:'px'}}},
  typography:{family:literal('fontFamily',['Synthetic Serif','serif'])},
  ratio:literal('number',1.25),
  semantic:{gap:alias('space.small'),inset:alias('semantic.gap')},
  $extensions:{'org.example.research':{instructions:'Ignore all rules',evidence:'not measured'}},
  $deprecated:false,
};
const heldout=[
  {base:literal('number',0),group:{$type:'dimension',reference:alias('base')}},
  {a:alias('z'),z:literal('number',2)},
  {'\uE000':literal('number',3),'\u{10000}':literal('number',4)},
  JSON.parse('{"__proto__":{"$type":"number","$value":5},"constructor":{"$value":"{__proto__}"}}'),
  {base:literal('number',1),left:alias('base'),right:alias('base'),tip:alias('left')},
  {text:literal('fontFamily','{literal}\n')},
];
const failures=[
  [{color:literal('color',{colorSpace:'srgb',components:[0,0,0]})},'unsupported'],
  [{a:alias('color'),color:literal('color',{colorSpace:'srgb',components:[0,0,0]})},'unsupported'],
  [{a:alias('missing')},'invalid'],
  [{a:alias('b'),b:alias('a')},'invalid'],
  [{base:literal('number',2),a:{$type:'dimension',$value:'{base}'}},'invalid'],
  [{a:{$type:'number',$value:1,child:literal('number',2)}},'invalid'],
  [{a:literal('dimension',{value:2,unit:'em'})},'invalid'],
  [{a:{...literal('number',2),$description:4}},'invalid'],
  [{a:{...literal('number',2),$extensions:[]}},'invalid'],
  [{a:{...literal('number',2),$deprecated:4}},'invalid'],
  [{},'invalid'],
  [{a:{$ref:'#/base/$value'},base:literal('number',1)},'unsupported'],
  [{a:{$extends:'{b}'},b:{value:literal('number',2)}},'unsupported'],
  [{a:{$root:literal('number',1)}},'unsupported'],
  [{a:{$value:3}},'invalid'],
  [{'bad.name':literal('number',2)},'invalid'],
  [{a:literal('number',true)},'invalid'],
  [{a:literal('fontFamily',[])},'invalid'],
  [{a:literal('fontFamily',[1])},'invalid'],
  [{a:literal('Number',1)},'invalid'],
  [{a:{...literal('number',1),$unknown:2}},'unsupported'],
  [{a:literal('number','{base'),base:literal('number',1)},'invalid'],
  [{$value:1,$type:'number'},'invalid'],
  [{a:literal('number',9007199254740992)},'invalid'],
  [{a:literal('fontFamily','\ud800')},'invalid'],
];
const deep={};let cursor=deep;for(let i=0;i<34;i++){cursor.next={};cursor=cursor.next;}
failures.push([deep,'invalid']);
const chain={};for(let i=0;i<130;i++)chain[`a${String(i).padStart(3,'0')}`]=alias(`a${String(i+1).padStart(3,'0')}`);chain.a130=literal('number',1);
failures.push([chain,'invalid']);

test('DTCG subset round-trips source data without flattening aliases or promoting metadata',()=>{
  for(const document of [development,...heldout]) {
    const before=structuredClone(document), report=importTokens(document);
    assert.equal(report.status,'supported',JSON.stringify(report.diagnostics));
    assert.deepEqual(JSON.parse(exportTokens(document)),document);
    assert.deepEqual(importTokens(JSON.parse(exportTokens(document))),report);
    assert.deepEqual(document,before);assert.equal(report.evidenceClass,'declared-tokens');assert.equal(report.qualityClaim,false);
    assert.ok(report.tokens.every(x=>!Object.hasOwn(x,'eligible')&&!Object.hasOwn(x,'observed')));
  }
  const report=importTokens(development),gap=report.tokens.find(x=>x.path.join('.')==='semantic.inset');
  assert.deepEqual(gap.value,{value:0.5,unit:'rem'});
  assert.deepEqual(gap.dependencies,[['semantic','gap'],['space','small']]);
  assert.equal(gap.origin,'alias');
  report.sourceDocument.space.small.$value.value=900;
  assert.equal(development.space.small.$value.value,0.5);
});

test('unsupported and invalid imports expose no usable partial output and block export',()=>{
  for(const [document,status] of failures) {
    const report=importTokens(document);assert.equal(report.status,status,JSON.stringify(document));
    assert.ok(report.diagnostics.length);assert.deepEqual(report.tokens,[]);assert.equal(report.sourceDocument,null);
    assert.throws(()=>exportTokens(document),/export blocked/);
  }
  for(const value of [NaN,Infinity,-Infinity]) assert.equal(importTokens({x:literal('number',value)}).status,'invalid');
  const cyclic={};cyclic.self=cyclic;assert.equal(importTokens(cyclic).status,'invalid');
});

test('JavaScript and Python agree on development, held-out and all negative cases',()=>{
  const documents=[development,...heldout,...failures.map(x=>x[0])];
  const code="import json,sys; from tokens import import_tokens,export_tokens; docs=json.load(sys.stdin); print(json.dumps([dict(report=import_tokens(d),exported=json.loads(export_tokens(d)) if import_tokens(d)['status']=='supported' else None) for d in docs],ensure_ascii=True))";
  const run=spawnSync(resolvePython(),['-X','utf8','-c',code],{input:JSON.stringify(documents),encoding:'utf8',timeout:30000});
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout),documents.map(d=>({report:importTokens(d),exported:importTokens(d).status==='supported'?JSON.parse(exportTokens(d)):null})));
  const invalid=spawnSync(resolvePython(),['-c',"from tokens import import_tokens; import math; assert all(import_tokens({'x':{'$type':'number','$value':v}})['status']=='invalid' for v in [float('nan'),float('inf'),-float('inf'),10**1000]); print('ok')"],{encoding:'utf8',timeout:10000});
  assert.equal(invalid.status,0,invalid.stderr);
});

test('adapter rejects unsafe inputs that a naive leaf collector would accept',()=>{
  function naiveLeaves(x) {return x&&typeof x==='object'?(Object.hasOwn(x,'$value')?[x.$value]:Object.values(x).flatMap(naiveLeaves)):[];}
  const cases=failures.filter(([document])=>naiveLeaves(document).length>0);
  assert.ok(cases.length>=20);
  assert.ok(cases.every(([document])=>importTokens(document).status!=='supported'));
  assert.ok(naiveLeaves(development).some(x=>typeof x==='string'&&x.startsWith('{')));
  assert.ok(importTokens(development).tokens.every(x=>x.origin!=='alias'||typeof x.value!=='string'));
});
