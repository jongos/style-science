import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {compareKnowledge} from './knowledge-drift.mjs';

test('drift comparison distinguishes byte matches, differences and missing sources without writes', async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'gdc-drift-'));
  try {
    await mkdir(path.join(root,'references'));
    await writeFile(path.join(root,'references','a.md'),'preserved');
    const hash=createHash('sha256').update('preserved').digest('hex');
    const rows=await compareKnowledge(root,[{id:'match',source:'Dazzler references/a.md',sha256:hash},{id:'changed',source:'Dazzler references/a.md',sha256:'old'},{id:'missing',source:'Dazzler references/b.md',sha256:hash}]);
    assert.deepEqual(rows.map(r=>r.status),['match','different','missing']);
    assert.equal(await readFile(path.join(root,'references','a.md'),'utf8'),'preserved');
    await assert.rejects(compareKnowledge(root,[{source:'Dazzler references/../../outside'}]),/escapes/);
  } finally {await rm(root,{recursive:true,force:true});}
});
test('frozen import provenance matches the inventory',async()=>{
  const provenance=JSON.parse(await readFile(new URL('../knowledge/provenance.json',import.meta.url),'utf8'));
  const inventory=(await readFile(new URL('../knowledge/inventory.json',import.meta.url),'utf8')).replaceAll('\r\n','\n');
  assert.equal(createHash('sha256').update(inventory).digest('hex'),provenance.inventorySha256);
  assert.equal(provenance.sourceRevision,null);
});

test('drift separates CRLF-only changes without weakening byte provenance',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'gdc-eol-'));
  try {
    await mkdir(path.join(root,'references')); await mkdir(path.join(root,'snapshot'));
    await writeFile(path.join(root,'references','a.md'),'one\ntwo\n');
    await writeFile(path.join(root,'snapshot','a.md'),'one\r\ntwo\r\n');
    const sha256=createHash('sha256').update('one\r\ntwo\r\n').digest('hex');
    const entries=[{id:'a',source:'Dazzler references/a.md',file:'a.md',sha256}];
    const rows=await compareKnowledge(root,entries,{snapshotRoot:path.join(root,'snapshot')});
    assert.equal(rows[0].status,'eol-only'); assert.notEqual(rows[0].sourceSha256,rows[0].snapshotSha256);
    await writeFile(path.join(root,'references','a.md'),'one\nchanged\n');
    assert.equal((await compareKnowledge(root,entries,{snapshotRoot:path.join(root,'snapshot')}))[0].status,'different');
    await assert.rejects(compareKnowledge(root,entries,{snapshotRoot:path.join(root,'absent')}),/Cannot read frozen snapshot/);
  } finally {await rm(root,{recursive:true,force:true});}
});
