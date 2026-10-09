import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=new URL('../',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function captureInventory() {
  const records=[];
  for(const directory of ['evaluation/jev-pass-2026-10-07/','evaluation/canvas-pass-2026-10-07/']) {
    for(const name of (await readdir(new URL(directory,root))).filter(x=>/^(response-|smoke-response)/.test(x)).sort()) {
      const responsePath=directory+name, bytes=await readFile(new URL(responsePath,root));
      const response=JSON.parse(bytes),requestName=name.replace(/^response-/,'batch-');
      const requestPath=name==='smoke-response.json'?null:directory+requestName;
      const request=requestPath?await readFile(new URL(requestPath,root)):null;
      records.push({responsePath,responseSha256:hash(bytes),requestPath,requestSha256:request?hash(request):null,
        capturedAt:null,captureTimestampStatus:'not-recorded',binding:'retrospective-file-pair-not-provider-attestation',
        resolvedModel:response.model??null,requestId:response.request_id??null,evaluationTimeMs:response.evaluation_time_ms??null,
        judgmentCount:Object.keys(response.answers??{}).length});
    }
  }
  return {schemaVersion:1,inventoryCreatedOn:'2026-10-07',permission:'customer-confirmed-in-this-project-on-2026-10-07',
    permissionScope:'use of retained TypeSafe evidence; not an independently verified legal determination',records};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  await writeFile(new URL('../evaluation/capture-provenance.json',import.meta.url),JSON.stringify(await captureInventory(),null,2)+'\n');
}
