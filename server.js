import express from 'express';
import {normalize,lookup,sources,manualLinks,declaredLinks} from './providers.js';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const app=express(),cache=new Map(),limits=new Map();
const root=path.dirname(fileURLToPath(import.meta.url));
app.disable('x-powered-by');
app.set('trust proxy',1);
app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Permissions-Policy':'geolocation=(), camera=(), microphone=()','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});next();});
app.use(express.json({limit:'2kb'}));
let globalCount=0,globalWindow=Date.now();
app.post('/api/lookup',async(req,res)=>{
 const now=Date.now();if(now-globalWindow>60000){globalCount=0;globalWindow=now;}
 const ip=req.ip,window=limits.get(ip)||{count:0,start:now};if(now-window.start>300000){window.count=0;window.start=now;}
 limits.set(ip,window);
 if(++window.count>10||++globalCount>60){res.set('Retry-After','300');return res.status(429).json({error:'Request limit reached. Please wait five minutes.'});}
 let handle;try{handle=normalize(req.body?.handle);}catch(e){return res.status(400).json({error:e.message});}
 const selected=req.body?.platforms??['github','bluesky','gitlab','devto'];
 if(!Array.isArray(selected)||!selected.length||selected.length>12||selected.some(p=>!sources.includes(p)))return res.status(400).json({error:'Choose at least one supported source.'});
 const platforms=[...new Set(selected)],key=handle.toLowerCase()+':'+platforms.sort().join(',');
 const cached=cache.get(key);if(cached&&now-cached.at<600000)return res.json({...cached.data,cached:true});
 const results=await Promise.all(platforms.map(p=>lookup(p,handle)));
 const data={handle,checkedAt:new Date().toISOString(),results,manual:manualLinks(handle),connections:declaredLinks(results),cached:false,notice:'An existing profile is not proof of identity. Same-handle profiles are not linked people. Public profile fields are self-reported.'};
 if(cache.size>=200)cache.delete(cache.keys().next().value);
 cache.set(key,{at:now,data});res.set('Cache-Control','no-store');return res.json(data);
});
app.get('/health',(_,res)=>res.json({status:'ok'}));
for(const [route,file] of [['/','index.html'],['/style.css','style.css'],['/app.js','app.js']])app.get(route,(_,res)=>res.sendFile(path.join(root,file)));
app.use((err,req,res,next)=>res.status(400).json({error:'Invalid request.'}));
const cleanup=setInterval(()=>{const now=Date.now();for(const[k,v]of limits)if(now-v.start>300000)limits.delete(k);for(const[k,v]of cache)if(now-v.at>600000)cache.delete(k);},60000);cleanup.unref();
app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Trace is ready'));
