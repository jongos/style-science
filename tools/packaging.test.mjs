import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolvePython} from './python.mjs';

test('committed-manifest packaging regressions in synthetic repositories', () => {
  const run=spawnSync(resolvePython(), ['-X','utf8','tools/test_build_package.py'], {
    cwd:fileURLToPath(new URL('..',import.meta.url)), encoding:'utf8', timeout:120000,
  });
  assert.equal(run.status,0,run.stderr || String(run.error));
});
