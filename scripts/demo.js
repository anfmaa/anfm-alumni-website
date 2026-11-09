// Local demonstration only. Never used by the Vercel API.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
const root=process.cwd(), tables={Members:[{id:'demo-mentor',name:'Demo Career Mentor',email:'mentor@example.test',status:'approved',batch:'2010',interests:'Computing, teaching, research',mentoring:true,version:1}],Posts:[],Audit:[],Reports:[],Claims:[],Appointments:[],Notifications:[],Legacy:[{id:'ANF-DEMO-001',name:'Demo Alumni',phone:'00000000000',batch:'2012',father:'Demo Parent',profession:'Teacher',owner:''}]};
const ctx=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='ADMIN_EMAILS'?'admin@example.test':''})},Utilities:{getUuid:()=>crypto.randomUUID()},Date,JSON});
vm.runInContext(fs.readFileSync('database/Code.js','utf8'),ctx);
ctx.rows=n=>structuredClone(tables[n]);ctx.put=(n,r)=>{const i=tables[n].findIndex(x=>x.id===r.id);if(i<0)tables[n].push(structuredClone(r));else tables[n][i]=structuredClone(r);};
const port=Number(process.env.PORT||(process.argv.includes('--port')?process.argv[process.argv.indexOf('--port')+1]:3000));
const host=process.argv.includes('--host')?process.argv[process.argv.indexOf('--host')+1]:'127.0.0.1';
http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/api/community'){
  res.setHeader('Content-Type','application/json');
  if(req.method==='GET')return res.end(JSON.stringify({configured:true,demo:true}));
  if(req.method!=='POST'){res.statusCode=405;return res.end('{}');}
  if(req.headers.origin!==`http://localhost:${port}`&&req.headers.origin!==`http://127.0.0.1:${port}` && !(host==='0.0.0.0' && req.headers.origin===`http://terminal.local:${port}`)){res.statusCode=403;return res.end(JSON.stringify({error:'Local demo origin required'}));}
  try{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>24000)throw Error('Request too large');}const body=JSON.parse(raw);let actor=null;const bearer=req.headers.authorization;if(bearer==='Bearer demo-member')actor={id:'demo-member',email:'member@example.test',name:'Demo Google Member'};if(bearer==='Bearer demo-mentor')actor={id:'demo-mentor',email:'mentor@example.test'};if(bearer==='Bearer demo-admin')actor={id:'demo-admin',email:'admin@example.test'};return res.end(JSON.stringify(ctx.dispatch(body.action,body.data||{},actor)));}catch(e){res.statusCode=400;return res.end(JSON.stringify({error:e.message}));}
 }
 const relative=pathname==='/'?'index.html':pathname.slice(1);
 if(relative!=='index.html'&&!/^assets\/[a-zA-Z0-9._-]+$/.test(relative)){res.statusCode=404;return res.end('Not found');}
 const file=path.join(root,relative);if(!fs.existsSync(file)){res.statusCode=404;return res.end('Not found');}
 res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
}).listen(port,host,()=>console.log(`ANFMAA synthetic demo: http://localhost:${port}`));
