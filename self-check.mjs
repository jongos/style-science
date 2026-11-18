// Declared token/CSS checks without rendered observations or vision. Apache-2.0.
import {contrast} from './engine.mjs';
import {importTokens} from './tokens.mjs';

const object=x=>x && typeof x==='object' && !Array.isArray(x);
const scalar=x=>typeof x==='string' && x.length>0 && !/[\uD800-\uDFFF]/u.test(x);
const hex6=x=>typeof x==='string' && /^#[\da-f]{6}$/i.test(x);

const defaultPolicy={
  spacingGridPx:4,
  minDistinctFontSizes:3,
  contrastBody:4.5,
  contrastLarge:3,
  largeTextPx:24,
};

function parsePx(value) {
  if(typeof value!=='string') return null;
  const m=/^([\d.]+)px$/i.exec(value.trim());
  return m?Number(m[1]):null;
}

function parseRem(value, rootPx=16) {
  if(typeof value!=='string') return null;
  const m=/^([\d.]+)rem$/i.exec(value.trim());
  return m?Number(m[1])*rootPx:null;
}

export function collectFontSizesPx(css, rootPx=16) {
  if(typeof css!=='string' || !css.trim()) return [];
  const out=new Set();
  for (const m of css.matchAll(/font-size\s*:\s*([^;}{]+)/gi)) {
    const token=m[1].trim().split(/\s+/)[0];
    const px=parsePx(token) ?? parseRem(token,rootPx);
    if(px && Number.isFinite(px)) out.add(Math.round(px*1000)/1000);
  }
  return [...out].sort((a,b)=>a-b);
}

export function collectSpacingPx(css) {
  if(typeof css!=='string' || !css.trim()) return [];
  const out=[];
  const props=/(?:margin|padding|gap|row-gap|column-gap)(?:-[a-z]+)?\s*:\s*([^;}{]+)/gi;
  for (const m of css.matchAll(props)) {
    for (const part of m[1].split(/\s+/)) {
      const px=parsePx(part);
      if(px!==null) out.push(px);
    }
  }
  return out;
}

function statusFrom(results) {
  if(results.some(r=>r.status==='fail')) return 'fail';
  if(results.some(r=>r.status==='unknown')) return 'unknown';
  if(results.length) return 'pass';
  return 'unknown';
}

export function runDesignSelfCheck(input={}) {
  if(!object(input)) throw Error('Input must be an object');
  const policy={...defaultPolicy,...object(input.policy)?input.policy:{}};
  const results=[];
  const candidates=[];

  if(input.tokens!==undefined) {
    const report=importTokens(input.tokens);
    results.push({
      id:'tokens-import',
      kind:'declared',
      status:report.status==='supported'?'pass':report.status==='invalid'?'fail':'unknown',
      detail:report.status,
      diagnostics:report.diagnostics.length,
    });
    const dimensions=report.tokens.filter(t=>t.type==='dimension');
    const pxVals=dimensions.map(t=>t.type==='dimension' && object(t.value) && t.value.unit==='px'?t.value.value:null).filter(Number.isFinite);
    const remVals=dimensions.map(t=>t.type==='dimension' && object(t.value) && t.value.unit==='rem'?t.value.value:null).filter(Number.isFinite);
    const grid=Number.isFinite(policy.spacingGridPx)?policy.spacingGridPx:4;
    const off=pxVals.filter(v=>Math.abs(v%grid)>0.001);
    if(pxVals.length) {
      candidates.push({
        id:'token-spacing-grid',
        kind:'candidate',
        status:off.length?'fail':'pass',
        measured:{onGrid:pxVals.length-off.length,offGrid:off.length,gridPx:grid,examples:off.slice(0,5)},
        scope:'Declared px dimensions only; not a complete spacing audit',
      });
    } else if(remVals.length) {
      candidates.push({
        id:'token-spacing-grid',
        kind:'candidate',
        status:'unknown',
        detail:'Only rem dimensions present; no px grid test',
      });
    }
  }

  const pairs=Array.isArray(input.contrastPairs)?input.contrastPairs:[];
  if(!pairs.length) {
    results.push({id:'contrast-pairs',kind:'declared',status:'unknown',detail:'No contrastPairs supplied'});
  } else {
    for (let i=0;i<pairs.length;i++) {
      const pair=pairs[i];
      const id=scalar(pair?.id)?pair.id:`pair-${i+1}`;
      if(!hex6(pair?.foreground) || !hex6(pair?.background)) {
        results.push({id,kind:'declared',check:'contrast',status:'unknown',detail:'Opaque #rrggbb required'});
        continue;
      }
      const ratio=contrast(pair.foreground,pair.background);
      const large=pair.largeText===true || (Number.isFinite(pair.fontSizePx) && pair.fontSizePx>=policy.largeTextPx);
      const min=Number.isFinite(pair.minRatio)?pair.minRatio:large?policy.contrastLarge:policy.contrastBody;
      results.push({
        id,
        kind:'declared',
        check:'contrast',
        status:ratio>=min?'pass':'fail',
        ratio:Math.round(ratio*100)/100,
        required:min,
        foreground:pair.foreground.toLowerCase(),
        background:pair.background.toLowerCase(),
      });
    }
  }

  if(typeof input.css==='string' && input.css.trim()) {
    const css=input.css;
    const focusVisible=/:focus-visible\b/.test(css);
    const focusStyled=/:focus\b[^}{]*\{[^}]*\b(outline|box-shadow)\b/is.test(css);
    results.push({
      id:'css-focus',
      kind:'declared',
      status:focusVisible || focusStyled?'pass':'fail',
      detail:focusVisible?':focus-visible present':focusStyled?':focus styles present':'No focus-visible or focus outline/box-shadow found',
    });
    const reduced=/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i.test(css);
    results.push({
      id:'css-reduced-motion',
      kind:'declared',
      status:reduced?'pass':'fail',
      detail:reduced?'prefers-reduced-motion block present':'No reduced-motion media query',
    });
    const sizes=collectFontSizesPx(css);
    if(sizes.length) {
      const minSteps=Number.isFinite(policy.minDistinctFontSizes)?policy.minDistinctFontSizes:3;
      candidates.push({
        id:'css-type-scale',
        kind:'candidate',
        status:sizes.length>=minSteps?'pass':'fail',
        measured:{distinctSizes:sizes.length,sizes},
        scope:'font-size declarations in supplied CSS only',
      });
    } else {
      candidates.push({id:'css-type-scale',kind:'candidate',status:'unknown',detail:'No font-size values found'});
    }
    const spacing=collectSpacingPx(css);
    const grid=Number.isFinite(policy.spacingGridPx)?policy.spacingGridPx:4;
    const off=spacing.filter(v=>Math.abs(v%grid)>0.001);
    if(spacing.length) {
      candidates.push({
        id:'css-spacing-grid',
        kind:'candidate',
        status:off.length?'fail':'pass',
        measured:{values:spacing.length,offGrid:off.length,gridPx:grid,examples:off.slice(0,5)},
        scope:'margin/padding/gap px values in supplied CSS only',
      });
    }
    const varColors=/var\s*\(--[^)]+\)/.test(css);
    const nakedHex=/(?<!var\()[#][\da-f]{3,8}\b/gi;
    const hexOutsideRoot=(()=>{
      const chunks=css.split(/\{[^}]*\}/g);
      return chunks.some(chunk=>nakedHex.test(chunk));
    })();
    candidates.push({
      id:'css-token-indirection',
      kind:'candidate',
      status:varColors && !hexOutsideRoot?'pass':varColors?'unknown':'unknown',
      measured:{usesCustomProperties:varColors,hexOutsideDeclarations:hexOutsideRoot},
      scope:'Heuristic only; inline styles and preprocessors may bypass this',
    });
  } else if(input.css!==undefined) {
    results.push({id:'css-source',kind:'declared',status:'unknown',detail:'Empty or non-string css'});
  }

  const declared=results.filter(r=>r.kind==='declared');
  return {
    schemaVersion:1,
    status:statusFrom(declared),
    results,
    candidates,
    qualityClaim:false,
    scope:'Declared tokens and CSS text only; not layout, imagery, branding fit or rendered accessibility certification',
  };
}