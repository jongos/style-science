import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveStudy} from '../site/study.js';
import {contrast} from '../engine.mjs';

test('two-input study stays bounded, deterministic and readable across its input grid',()=>{
  for(let s=0;s<=100;s+=5) for(let e=0;e<=100;e+=5) {
    const state=deriveStudy(s,e);
    assert.deepEqual(state,deriveStudy(s,e));
    assert.equal(state.points.length,48);
    assert.equal(state.depth,Math.round(e/100*(1-s/100)*100));
    assert.ok(state.prompt.includes(`Depth: ${state.depth}/100`));
    assert.ok(state.points.every(p=>Number.isFinite(p.depth)));
    if(s===100||e===0) assert.ok(state.points.every(p=>p.depth===0));
    assert.equal(state.bands.length,6);
    assert.deepEqual(state.bands.flatMap(b=>b.indices),Array.from({length:48},(_,i)=>i));
    for(const phrase of [`heading size ${state.heading}px`,`weight ${state.weight}`,`body line height ${state.leading}`,`${state.gap}px between groups`,`${state.radius}px corner radius`,`accent ${state.accent}`,`surface ${state.surface}`]) assert.ok(state.prompt.includes(phrase));
    for(const p of state.points) {assert.ok(p.x-p.radius>0&&p.x+p.radius<600);assert.ok(p.y-p.radius>0&&p.y+p.radius<360);}
    assert.ok(contrast(state.ink,state.surface)>=4.5);
    assert.ok(contrast(state.accent,state.surface)>=4.5);
    for(const value of [state.family,state.heading,state.weight,state.gap,state.accent,state.surface,state.leading,state.radius]) assert.ok(state.prompt.includes(String(value)));
  }
});
test('both inputs produce multidirectional changes and their interaction affects output',()=>{
  for(const [a,b] of [[deriveStudy(30,20),deriveStudy(70,20)],[deriveStudy(30,20),deriveStudy(30,80)]]) {
    const dx=a.points.map((p,i)=>b.points[i].x-p.x),dy=a.points.map((p,i)=>b.points[i].y-p.y);
    for(const delta of [dx,dy]) {assert.ok(delta.some(v=>v>1));assert.ok(delta.some(v=>v < -1));}
    assert.notEqual(a.prompt,b.prompt);
  }
  assert.notEqual(deriveStudy(20,80).gap-deriveStudy(20,20).gap,0);
  assert.notEqual(deriveStudy(20,80).radius-deriveStudy(20,20).radius,deriveStudy(90,80).radius-deriveStudy(90,20).radius);
  assert.deepEqual(deriveStudy(-5,150),deriveStudy(0,100));
  assert.deepEqual(deriveStudy('bad',null),deriveStudy(0,0));
});
