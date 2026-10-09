import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {captureInspection} from '../../inspection-html.mjs';
import {verifyInspection} from '../../inspection.mjs';
import {resolvePython} from '../../tools/python.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');

export async function renderedCases({output=null}={}) {
  const {chromium}=await import(process.env.GDC_PLAYWRIGHT_MODULE || 'playwright');
  const font=await readFile(new URL('../../site/fonts/InterVariable.woff2',import.meta.url));
  const browser=await chromium.launch({headless:true}),rows=[];
  try {
    for(const width of [390,1280]) for(const variant of ['normal','missing-font','long-localized','overlay','hidden-focus','expanded','error','loading','animated','shadow-focus']) {
      const state=['expanded','error','loading'].includes(variant)?variant:'default';
      const fontUrl=variant==='missing-font'?'data:font/woff2;base64,AAAA':`data:font/woff2;base64,${font.toString('base64')}`;
      const content=variant==='long-localized'?'Long localized content Wiederholungszeichen '.repeat(30):'Original synthetic content';
      const html=`<!doctype html><html lang="en"><meta charset="utf-8"><style>@font-face{font-family:FixtureFont;src:url(${fontUrl})}body{margin:20px;color:#111;background:white}#copy{font:16px FixtureFont;width:250px;height:60px;overflow:hidden}button{position:relative;width:150px;height:44px;outline:3px solid #14592d;outline-offset:2px}button:focus{outline:${variant==='hidden-focus'?'none':'3px solid #14592d'};box-shadow:${variant==='shadow-focus'?'0 0 0 3px red':'none'}}.overlay{position:absolute;inset:0;z-index:2;background:#fff}#wrapper{position:relative;width:150px}@keyframes pulse{from{opacity:1}to{opacity:.7}}${variant==='animated'?'#copy{animation:pulse 1s infinite alternate}':''}</style><main><h1>Instrument Fixture</h1><div id="copy">${content}</div><div id="wrapper"><button id="target" ${variant==='loading'?'disabled':''} aria-expanded="${state==='expanded'}">${state==='loading'?'Loading':'Continue'}</button>${variant==='overlay'?'<div class="overlay">Overlay</div>':''}</div>${state==='expanded'?'<p>Expanded content</p>':state==='error'?'<p role="alert">Original error message</p>':''}</main></html>`;
      const context=await browser.newContext({viewport:{width,height:844},colorScheme:'light'});
      try {
        await context.route('**/*',route=>route.abort());
        const page=await context.newPage();await page.setContent(html);await page.keyboard.press('Tab');
        const artifactSha256=hash(html),plan={schemaVersion:1,artifactSha256,environment:{medium:'html',width,height:844,theme:'light',state},renderer:{name:'chromium',version:browser.version()},checks:[
          {id:'font',kind:'font-face-loaded',selector:'#copy',expected:'FixtureFont'},
          {id:'clip',kind:'scroll-containment',selector:'#copy'},
          {id:'focus',kind:'focus-target',selector:'#target'},
          {id:'outline',kind:'focus-outline',selector:'#target'},
          {id:'hit',kind:'center-hit-target',selector:'#target'}]};
        const snapshot=await captureInspection(page,plan,{artifactSha256,state}),report=verifyInspection(plan,snapshot);
        const expected={font:'pass',clip:'pass',focus:'pass',outline:'pass',hit:'pass'};
        if(variant==='missing-font') expected.font='fail';
        if(variant==='long-localized') expected.clip='fail';
        if(variant==='overlay') expected.hit='fail';
        if(variant==='hidden-focus') expected.outline='fail';
        if(variant==='loading') {expected.focus='fail';expected.outline='fail';}
        if(variant==='shadow-focus') expected.outline='unknown';
        if(variant==='animated') for(const k of Object.keys(expected)) expected[k]='unknown';
        for(const r of report.results) assert.equal(r.status,expected[r.id],`${variant}/${width}/${r.id}`);
        let screenshot=null;
        if(output) {await mkdir(output,{recursive:true});screenshot=`${variant}-${width}.png`;await page.screenshot({path:fileURLToPath(new URL(screenshot,output)),fullPage:true});}
        rows.push({variant,width,plan,snapshot,report,expected,screenshot});
      } finally {await context.close();}
    }
    const run=spawnSync(resolvePython(),['-X','utf8','-c',"import json,sys; from inspection import verify_inspection; print(json.dumps([verify_inspection(x['plan'],x['snapshot']) for x in json.load(sys.stdin)]))"],{cwd:fileURLToPath(new URL('../../',import.meta.url)),input:JSON.stringify(rows),encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),rows.map(r=>r.report));
    return {renderer:{name:'chromium',version:browser.version()},fontSha256:hash(font),rows};
  } finally {await browser.close();}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  if(!process.argv.includes('--allow-working-tree')) throw Error('Explicit --allow-working-tree required for this experimental harness');
  const output=new URL(`../../dist/inspection-${Date.now()}/`,import.meta.url);
  const report=await renderedCases({output});
  await writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');console.log(fileURLToPath(output));
}
