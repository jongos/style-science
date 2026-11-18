import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

async function shaFile(relative) {
  const bytes=await readFile(path.join(root,relative));
  return {sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};
}

export async function verifyUpstreamManifest(manifest, {remote=false, fetch=globalThis.fetch}={}) {
  if(!manifest?.entries?.length) throw Error('Invalid upstream manifest');
  const results=[];
  let drift=false;
  for (const entry of manifest.entries) {
    for (const artifact of entry.localArtifacts??[]) {
      if(!artifact.sha256 || !artifact.path) throw Error(`Entry ${entry.id}: invalid local artifact`);
      try {
        const {sha256}=await shaFile(artifact.path);
        const status=sha256===artifact.sha256?'match':'drift';
        if(status==='drift') drift=true;
        results.push({entry:entry.id,kind:'local',path:artifact.path,status,expectedSha256:artifact.sha256,actualSha256:sha256});
      } catch (error) {
        if(error.code==='ENOENT') {
          drift=true;
          results.push({entry:entry.id,kind:'local',path:artifact.path,status:'missing',expectedSha256:artifact.sha256});
        } else throw error;
      }
    }
    if(entry.provenanceFile) {
      const {sha256}=await shaFile(entry.provenanceFile);
      results.push({entry:entry.id,kind:'provenance-sidecar',path:entry.provenanceFile,status:'recorded',sha256});
    }
    if(remote) {
      for (const pin of entry.remotePins??[]) {
        if(!pin.url || !pin.sha256) throw Error(`Entry ${entry.id}: invalid remote pin`);
        let status='unknown',actualSha256=null,detail=null;
        try {
          const res=await fetch(pin.url,{headers:{'user-agent':'style-science/upstream-drift'}});
          if(!res.ok) throw Error(`HTTP ${res.status}`);
          const text=await res.text();
          actualSha256=createHash('sha256').update(text).digest('hex');
          status=actualSha256===pin.sha256?'match':'drift';
          if(status==='drift') drift=true;
        } catch (error) {
          status='unavailable';
          detail=error.message;
          drift=true;
        }
        results.push({entry:entry.id,kind:'remote',path:pin.path,url:pin.url,status,expectedSha256:pin.sha256,actualSha256,detail});
      }
    } else if((entry.remotePins??[]).length) {
      results.push({entry:entry.id,kind:'remote',status:'not-checked',count:entry.remotePins.length,note:'Pass --remote to compare pinned upstream bytes'});
    }
  }
  const summary={
    schemaVersion:1,
    mode:remote?'local-and-remote':'local-only',
    drift,
    qualityClaim:false,
    scope:'Recorded hashes and optional upstream fetches; drift signals review, not automatic merge',
    results,
  };
  return summary;
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const remote=process.argv.includes('--remote');
  const manifestPath=process.argv.slice(2).filter(a=>!a.startsWith('-'))[0]??'knowledge/upstream-manifest.json';
  const manifest=JSON.parse(await readFile(path.join(root,manifestPath),'utf8'));
  const report=await verifyUpstreamManifest(manifest,{remote});
  console.log(JSON.stringify(report,null,2));
  process.exitCode=report.drift?1:0;
}