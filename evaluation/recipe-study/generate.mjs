import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {contrast} from '../../engine.mjs';

export const root = new URL('./', import.meta.url);
export const palettes = [
  ['Paper and Carmine','#FFFFFF','#202020','#AF173B','#F0F2F2'],
  ['Forest and Lemon','#F8FCF9','#16362B','#357346','#F2E64B'],
  ['Ink and Electric Yellow','#181818','#FAFAFA','#F4E84A','#303030'],
  ['Marine and Coral','#F7FCFF','#113C50','#B73545','#E5F3F8'],
  ['Plum and Mint','#FCF9FF','#3D2346','#805099','#CDF3DF'],
  ['Cobalt and Chalk','#FFFFFF','#132349','#164AC6','#E8EFFC'],
  ['Burgundy and Rose','#FFF8FA','#48232E','#9D244E','#F7DBE5'],
  ['Graphite and Aqua','#F7FBFC','#233338','#006C78','#C9F0ED'],
  ['Monochrome Signal','#FFFFFF','#111111','#494949','#E8E8E8'],
  ['Apricot and Cypress','#FFF9F3','#293C32','#A84218','#E4EFE7'],
];
export const fonts = [
  ['Archivo','Inter','grotesque heading with neutral interface text'],
  ['EB Garamond','Work Sans','literary serif heading with restrained sans text'],
  ['Young Serif','Inter','rounded expressive serif heading with neutral text'],
  ['League Gothic','Libre Baskerville','condensed display heading with reading serif'],
  ['Poppins','Roboto','geometric heading with functional sans text'],
  ['Oswald','Work Sans','condensed heading with open sans text'],
  ['Libre Baskerville','Inter','traditional serif heading with compact interface text'],
  ['Cooper Hewitt','EB Garamond','institutional sans heading with literary body'],
  ['Bagnard','Cotham Sans','characterful display serif with understated body'],
  ['Work Sans','Work Sans','single-family hierarchy through weight and size'],
];
export const arrangements = [
  ['reading-column','typographic editorial','Single reading column, left aligned headings, marginal metadata, thin section rules.','Reading and reference'],
  ['comparison-grid','precise utilitarian','Aligned comparison rows, sticky labels, compact toolbar, no hero.','Repeated scanning and comparison'],
  ['catalog-grid','product-first','Three-column product grid, consistent image ratios, filter rail, one-column mobile.','Discover and compare objects'],
  ['image-led','immersive editorial','Full-width relevant image with heading overlay, visible next section, no text/media split hero.','Inspect a place or object'],
  ['index-and-detail','archival','Narrow index beside an unframed detail pane; index becomes a menu on mobile.','Navigate a substantial collection'],
  ['asymmetric-feature','expressive magazine','One dominant feature with smaller supporting entries, staggered hierarchy, linear mobile reading order.','Discover stories'],
  ['timeline','documentary','Chronological entries with dates on a shared rail, compact media, explicit sequence.','Understand progression'],
  ['modular-directory','systematic','Repeated item tiles with shared metadata alignment, category headings, search and filters.','Find an item'],
  ['poster-and-program','event-driven','Large event title, date and venue, then an unframed program table and direct booking action.','Choose and attend an event'],
  ['workspace','work-focused','Persistent navigation, dense results table, selected-item inspector, restrained headings.','Complete repeated operational tasks'],
];
export const contexts = [
  ['editorial','An independent publication; readers discover stories and read long articles.'],
  ['commerce','A specialist shop; shoppers inspect objects, compare details and buy.'],
  ['culture','A cultural venue; visitors browse works, plan visits and find events.'],
  ['information','A public information service; people find reliable guidance quickly.'],
  ['software','A software product; users scan records and complete repeated tasks.'],
];

export function makeCandidates() {
  const records=[];
  for(let p=0;p<10;p++) for(let f=0;f<10;f++) for(let a=0;a<10;a++) {
    const i=records.length, [name,background,text,accent,surface]=palettes[p];
    const [heading,body,fontCharacter]=fonts[f];
    const [arrangement,style,structure,affordance]=arrangements[a];
    const [context,brief]=contexts[(p+f+a)%5];
    const numeric={bodyPx:[14,16,18,20][(p+f+a)%4],headingPx:[28,36,48,64,80][(p+2*f+a)%5],lineHeight:[1.3,1.45,1.6,1.75][(p+f+2*a)%4],measureCh:[40,48,56,60][(p+2*f+a)%4],gapPx:[8,16,24,32,48][(p+f+3*a)%5],maxWidthPx:[960,1120,1280,1440][(p+f+a)%4],radiusPx:[0,2,4,8][(p+f+a)%4],letterSpacing:0};
    const ratios={body:contrast(text,background),surface:contrast(text,surface),accent:contrast(accent,background)};
    const accentText=contrast('#FFFFFF',accent)>=contrast('#111111',accent)?'#FFFFFF':'#111111';
    ratios.onAccent=contrast(accentText,accent);
    const clauses=[`Build for this brief: ${brief}`,`Use ${name}: page ${background}, text ${text}, accent ${accent}, secondary surface ${surface}, text on accent ${accentText}.`,`Set headings in ${heading} and reading text in ${body}; ${fontCharacter}.`,`Composition: ${structure}`,`Use body ${numeric.bodyPx}px, heading ${numeric.headingPx}px, line height ${numeric.lineHeight}, reading measure at most ${numeric.measureCh}ch, gap ${numeric.gapPx}px, content width at most ${numeric.maxWidthPx}px and item radius ${numeric.radiusPx}px.`,`Keep letter spacing zero. At 390px use a single reading order, preserve required text and provide access to every control. Use real subject imagery when needed, not ornamental blobs. Check rendered text contrast and overflow; never call this recipe proven beautiful.`];
    const promptVariant=['brief-first','composition-first','tokens-first'][i%3];
    const order=promptVariant==='brief-first'?[0,1,2,3,4,5]:promptVariant==='composition-first'?[3,0,2,1,4,5]:[1,4,2,0,3,5];
    records.push({id:`R${String(i+1).padStart(4,'0')}`,factors:{palette:p,fontPair:f,arrangement:a},context,brief,palette:{name,background,text,accent,surface,accentText},fonts:{heading,body,fontCharacter,licenseStatus:'Catalog-listed; verify actual files, weights and notices before shipping'},style,arrangement,structure,affordance,numeric,promptVariant,prompt:order.map(j=>clauses[j]).join(' '),checks:{kind:'Declared token arithmetic only; not rendered observations',ratios,bodyContrastPass:ratios.body>=4.5&&ratios.surface>=4.5,accentTextPass:ratios.onAccent>=4.5,accentAsSmallTextAllowed:ratios.accent>=4.5,renderedStatus:'not-run',fontLoading:'not-run'}});
  }
  return records;
}
if(typeof process!=='undefined' && process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
const candidates=makeCandidates();
await mkdir(new URL('requests/',root),{recursive:true});
await mkdir(new URL('responses/',root),{recursive:true});
const payload=JSON.stringify(candidates,null,2)+'\n';
try { const existing=await readFile(new URL('candidates.json',root),'utf8'); if(existing!==payload) throw new Error('Frozen candidate manifest differs; create a new study version.'); }
catch(e) {if(e.code!=='ENOENT') throw e; await writeFile(new URL('candidates.json',root),payload);}
const manifest={study:'recipe-study-2026-10-07',count:candidates.length,candidateSha256:createHash('sha256').update(payload).digest('hex'),design:'Full 10 palette x 10 font-pair x 10 arrangement product. Context, numeric settings and prompt ordering rotate deterministically and are confounded; no causal attribution.',createdBeforeCorpus:true};
await writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({...manifest,tokenContrastFailures:candidates.filter(c=>!c.checks.bodyContrastPass||!c.checks.accentTextPass).length}));
}
