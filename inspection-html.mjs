// Host provides an already-rendered page, exact artifact hash and interaction state.
import {inspectionFingerprint} from './inspection.mjs';

export async function captureInspection(page, plan, {artifactSha256,state,timeoutMs=1500}={}) {
  plan=structuredClone(plan);
  const planHash=inspectionFingerprint(plan);
  if(!Number.isInteger(timeoutMs) || timeoutMs<50 || timeoutMs>10000) throw Error('Invalid bounded settle timeout');
  const payload=await page.evaluate(async({checks,timeoutMs})=>{
    let timer;
    const ready=await Promise.race([document.fonts.ready.then(()=>true),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),timeoutMs);})]);
    clearTimeout(timer);
    const signature=()=>JSON.stringify(checks.map(c=>{try{const el=document.querySelector(c.selector);const r=el?.getBoundingClientRect();return r?[r.x,r.y,r.width,r.height,el.scrollWidth,el.scrollHeight]:null;}catch{return null;}}));
    const first=signature(); await new Promise(resolve=>setTimeout(resolve,50));
    const second=signature(); await new Promise(resolve=>setTimeout(resolve,50));
    const settled=ready && first===second && second===signature() && !document.getAnimations().some(a=>a.playState==='running');
    const observations={};
    for(const c of checks) {
      let facts={unknown:'unsupported-instrument'};
      try {
        const nodes=document.querySelectorAll(c.selector);
        if(nodes.length!==1) throw Error('Selector must identify one element');
        const el=nodes[0],s=getComputedStyle(el),r=el.getBoundingClientRect();
        if(!(el instanceof HTMLElement) || !r.width || !r.height || s.visibility!=='visible') throw Error('Nonvisible or unsupported target');
        for(let p=el;p;p=p.parentElement) {
          const ps=getComputedStyle(p);
          if(ps.transform!=='none' || (ps.zoom!=='normal' && Number(ps.zoom)!==1) || Number(ps.opacity)!==1) throw Error('Unsupported paint or transform');
        }
        if(c.kind==='scroll-containment') facts={scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};
        if(c.kind==='font-face-loaded') {
          const family=String(c.expected??'').replaceAll('"','').replaceAll("'",'');
          const faces=[...document.fonts].filter(f=>f.family.replaceAll('"','').replaceAll("'",'')===family);
          facts=faces.length?{declared:s.fontFamily.split(',')[0].trim().replaceAll('"','').replaceAll("'",'')===family,loaded:faces.every(f=>f.status==='loaded')}:{unknown:'No inspectable FontFace declaration; system fallback is not certified'};
        }
        if(c.kind==='focus-target') facts={focused:document.activeElement===el,enabled:!el.matches(':disabled') && el.getAttribute('aria-disabled')!=='true'};
        if(c.kind==='focus-outline') facts=s.boxShadow!=='none'?{unknown:'Shadow-based indicator needs paint review'}:{focused:document.activeElement===el,outlinePresent:parseFloat(s.outlineWidth)>0 && !['none','hidden'].includes(s.outlineStyle) && s.outlineColor!=='transparent' && !/rgba\([^)]*,\s*0\)/.test(s.outlineColor)};
        if(c.kind==='center-hit-target') {const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);facts={centerHitsTarget:Boolean(hit && (hit===el || el.contains(hit)))};}
      } catch(error) {facts={unknown:error.message};}
      observations[c.id]={source:'rendered',facts};
    }
    return {settled,observations,width:innerWidth,height:innerHeight,theme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'};
  },{checks:plan.checks,timeoutMs});
  const browser=page.context().browser();
  return {planHash,artifactSha256,environment:{medium:'html',width:payload.width,height:payload.height,theme:payload.theme,state},
    renderer:{name:browser?.browserType().name()??'unknown',version:browser?.version()??'unknown'},settled:payload.settled,observations:payload.observations};
}
