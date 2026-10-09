import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export async function compareKnowledge(sourceRoot, entries, {snapshotRoot=new URL('../knowledge/',import.meta.url)}={}) {
  const root = path.resolve(sourceRoot);
  const results = [];
  for (const entry of entries) {
    if (!entry.source.startsWith('Dazzler references/')) throw Error('Unsupported source mapping');
    const source = path.resolve(root, entry.source.slice('Dazzler '.length));
    const relative = path.relative(root, source);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw Error('Source escapes root');
    try {
      const bytes=await readFile(source);
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      let status=sha256===entry.sha256?'match':'different';
      if(status==='different' && entry.file) {
        const base=snapshotRoot instanceof URL ? (await import('node:url')).fileURLToPath(snapshotRoot) : path.resolve(snapshotRoot);
        const target=path.resolve(base,entry.file);
        if(path.relative(base,target).startsWith('..') || path.isAbsolute(path.relative(base,target))) throw Error('Snapshot escapes root');
        const snapshot=await readFile(target).catch(error=>{throw Error(`Cannot read frozen snapshot: ${entry.file}`,{cause:error});});
        if(createHash('sha256').update(snapshot).digest('hex')!==entry.sha256) throw Error('Snapshot hash mismatch');
        try {
          const decoder=new TextDecoder('utf-8',{fatal:true});
          if(decoder.decode(bytes).replaceAll('\r\n','\n')===decoder.decode(snapshot).replaceAll('\r\n','\n')) status='eol-only';
        } catch(error) { if(!(error instanceof TypeError)) throw error; }
      }
      results.push({id:entry.id,status,snapshotSha256:entry.sha256,sourceSha256:sha256,publicUpstream:'unverified'});
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      results.push({id:entry.id,status:'missing',snapshotSha256:entry.sha256,publicUpstream:'unverified',note:'Not found in this compared tree; not proof of absence from all public revisions'});
    }
  }
  return results;
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  if(process.argv.length!==3) throw Error('Usage: node tools/knowledge-drift.mjs <directory containing Dazzler references/>');
  const inventory=JSON.parse(await readFile(new URL('../knowledge/inventory.json',import.meta.url),'utf8'));
  const results=await compareKnowledge(process.argv[2],inventory.entries);
  const {spawnSync}=await import('node:child_process');
  const revision=spawnSync('git',['-C',process.argv[2],'rev-parse','HEAD'],{encoding:'utf8'});
  const dirty=spawnSync('git',['-C',process.argv[2],'status','--porcelain'],{encoding:'utf8'});
  console.log(JSON.stringify({mode:'read-only-bytes-and-eol',comparedRevision:revision.status===0?revision.stdout.trim():null,comparedTreeDirty:dirty.status===0?Boolean(dirty.stdout.trim()):null,originalImportRevision:null,publicUpstream:'unverified',results},null,2));
  process.exitCode=results.every(r=>['match','eol-only'].includes(r.status))?0:1;
}
