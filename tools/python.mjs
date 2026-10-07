import { spawnSync } from 'node:child_process';

export function resolvePython(env = process.env, run = spawnSync) {
  const candidates = env.GDC_PYTHON ? [env.GDC_PYTHON] : ['python', 'python3'];
  const failures = [];
  for (const command of candidates) {
    const result = run(command, ['-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'], {
      encoding: 'utf8', timeout: 10000, windowsHide: true,
    });
    if (result.status === 0) return command;
    failures.push(`${command}: ${result.error?.message || result.stderr?.trim() || 'requires Python 3.10+'}`);
  }
  throw Error(`Python 3.10+ is required for conformance tests. Install python/python3 or set GDC_PYTHON to an executable path. ${failures.join('; ')}`);
}
