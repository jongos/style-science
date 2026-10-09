export const contexts=['editorial','commerce','culture','information','software'];
export const index={schemaVersion:1,entries:contexts.flatMap(context=>['expressive','restrained'].map((intent,i)=>({
  id:`synthetic-${context}-${intent}`,contexts:[context],intent,medium:'html',interactions:['reading','navigation'],
  text:`${context} compare find read original synthetic fixture`,fonts:{heading:'Inter',body:'Inter'},
  palette:{background:'#ffffff',text:'#111111',accent:i?'#185c37':'#a21b42'},
  arrangement:i?'rows':'columns',typography:i?'compact':'display',colorRelationship:i?'quiet':'contrasting',agreement:0,
})))};
export const brief=(context,intent='restrained')=>({schemaVersion:1,contexts:[context],task:'Find and compare',audience:'Readers',content:'Original fixture',intent,medium:'html',interactions:['reading'],constraints:{availableFonts:['Inter'],minimumContrast:4.5}});
