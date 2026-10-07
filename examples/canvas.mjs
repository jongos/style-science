import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {fingerprint} from '../engine.mjs';
import {compareCanvas} from '../canvas.mjs';

// Synthetic measurements demonstrate the API; no people or designs were tested.
export async function canvasExample() {
  const plan=JSON.parse(await readFile(new URL('./plan.json',import.meta.url),'utf8'));
  const spec={context:'synthetic-technician-lookup-v1',metrics:[
    {id:'lookup-time',unit:'seconds',instrument:'task-timer-v1',direction:'minimize',minimumEffect:1},
    {id:'error-rate',unit:'percent',instrument:'fault-selection-v1',direction:'minimize',minimumEffect:0.5},
  ]};
  const artifact=(id,time,errors)=>({id,revision:`${id}-v1`,snapshots:plan.environments.map(environment=>({environment,planHash:fingerprint(plan),measurements:{overflow:{scrollWidth:environment.width,clientWidth:environment.width},title:{visible:true,text:'GDC probe'},contrast:{foreground:'#000000',background:'#ffffff'},lock:{value:'rgb(0, 0, 0)'}}})),outcomes:plan.environments.flatMap(environment=>spec.metrics.map((m,i)=>({metric:m.id,environment:environment.id,context:spec.context,artifactRevision:`${id}-v1`,unit:m.unit,instrument:m.instrument,source:'measurement',lower:(i?errors:time)[0],upper:(i?errors:time)[1]})))});
  return {plan,spec,baseline:artifact('baseline',[10,12],[1,2]),candidate:artifact('compact',[7,8],[3,4])};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const x=await canvasExample();
  console.log(JSON.stringify({fixture:'synthetic-not-experimental-results',...compareCanvas(x.plan,x.baseline,x.candidate,x.spec)},null,2));
}
