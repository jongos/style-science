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
