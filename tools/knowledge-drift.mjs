import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export async function compareKnowledge(sourceRoot, entries) {
  const root = path.resolve(sourceRoot);
  const results = [];
  for (const entry of entries) {
    if (!entry.source.startsWith('Dazzler references/')) throw Error('Unsupported source mapping');
    const source = path.resolve(root, entry.source.slice('Dazzler '.length));
    const relative = path.relative(root, source);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw Error('Source escapes root');
    try {
      const sha256 = createHash('sha256').update(await readFile(source)).digest('hex');
      results.push({id:entry.id,status:sha256===entry.sha256?'match':'different',snapshotSha256:entry.sha256,sourceSha256:sha256});
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      results.push({id:entry.id,status:'missing',snapshotSha256:entry.sha256});
    }
  }
  return results;
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  if(process.argv.length!==3) throw Error('Usage: node tools/knowledge-drift.mjs <directory containing Dazzler references/>');
  const inventory=JSON.parse(await readFile(new URL('../knowledge/inventory.json',import.meta.url),'utf8'));
  const results=await compareKnowledge(process.argv[2],inventory.entries);
  console.log(JSON.stringify({mode:'read-only-byte-comparison',results},null,2));
  process.exitCode=results.every(r=>r.status==='match')?0:1;
}
