import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('public exports and consumer modules belong to the explicit release profile', async () => {
  const json = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'));
  const manifest = await json('distribution.json');
  const pkg = await json('package.json');
  const contract = await json('consumer-contract.json');
  for (const target of Object.values(pkg.exports)) assert.ok(manifest.files.includes(target.slice(2)), target);
  for (const module of Object.values(contract.modules)) {
    for (const path of module.files) assert.ok(manifest.files.includes(path), path);
  }
  for (const name of ['language', 'relation-measures', 'relation-html', 'retrieval', 'inspection', 'tokens']) {
    assert.equal(pkg.exports['./' + name], undefined, `${name} requires a separate release review`);
  }
  assert.ok(!pkg.scripts.test.includes('test:research'));
  assert.ok(!pkg.scripts.test.includes('evaluation/downstream'));
});
