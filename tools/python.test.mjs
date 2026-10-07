import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePython } from './python.mjs';

test('Python discovery supports python3-only hosts', () => {
  const calls = [];
  const chosen = resolvePython({}, command => {
    calls.push(command);
    return command === 'python3' ? {status: 0} : {status: null, error: {message: 'ENOENT'}};
  });
  assert.equal(chosen, 'python3');
  assert.deepEqual(calls, ['python', 'python3']);
});
test('explicit Python override is authoritative, including failure', () => {
  const calls = [];
  assert.throws(() => resolvePython({GDC_PYTHON: 'custom path/python'}, command => {
    calls.push(command); return {status: 1};
  }), /Python 3.10\+ is required/);
  assert.deepEqual(calls, ['custom path/python']);
  assert.equal(resolvePython({GDC_PYTHON: 'custom'}, () => ({status: 0})), 'custom');
});
test('missing or old interpreters fail clearly rather than skip parity', () => {
  assert.throws(() => resolvePython({}, () => ({status: 1})), /set GDC_PYTHON/);
});
