export function normalize(input) {
 if(typeof input !== 'string') throw new Error('Enter a handle, not a URL.');
 const handle=input.trim().replace(/^@/,'');
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/.test(handle)) throw new Error('Use 1-100 letters, numbers, dots, underscores or hyphens. No URLs or spaces.');
 return handle;
}
export const sources = ['github','bluesky','gitlab','devto','x','instagram','facebook','reddit','youtube','tiktok','telegram','threads'];
const safeLink = value => {try {const u=new URL(value); return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
async function get(url, fetcher) {
 const r=await fetcher(url,{headers:{'User-Agent':'Trace-Public-Profile/1.0','Accept':'application/json'},signal:AbortSignal.timeout(8000),redirect:'error'});
 if(r.status===404) return {state:'not_found'};
 if(r.status===429||r.status===403) return {state:'unavailable',reason:'Source rate limit or access restriction. Try later or open the source.'};
 if(!r.ok) return {state:'unavailable',reason:`Source returned HTTP ${r.status}.`};
 return {state:'found',data:await r.json()};
}
export async function lookup(platform,handle,fetcher=fetch) {
 if(['x','instagram','facebook','reddit','youtube','tiktok','telegram','threads'].includes(platform)) return socialLookup(platform,handle,fetcher);
 let endpoint,profileUrl,actor=handle;
 if(platform==='github') {
  if(!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(handle)) return {platform,handle,checkedAt:new Date().toISOString(),state:'not_applicable',reason:'GitHub handles use letters, numbers and hyphens, up to 39 characters.'};
  endpoint=`https://api.github.com/users/${encodeURIComponent(handle)}`;profileUrl=`https://github.com/${encodeURIComponent(handle)}`;
 } else if(platform==='bluesky') {
  actor=handle.includes('.')?handle:`${handle}.bsky.social`;
  endpoint=`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`;profileUrl=`https://bsky.app/profile/${encodeURIComponent(actor)}`;
 } else if(platform==='gitlab') {endpoint=`https://gitlab.com/api/v4/users?username=${encodeURIComponent(handle)}`;profileUrl=`https://gitlab.com/${encodeURIComponent(handle)}`;
 } else if(platform==='devto') {endpoint=`https://dev.to/api/users/by_username?url=${encodeURIComponent(handle)}`;profileUrl=`https://dev.to/${encodeURIComponent(handle)}`;
 } else throw new Error('Unsupported source');
 const result={platform,handle:actor,source:endpoint,url:profileUrl,checkedAt:new Date().toISOString()};
 try {
  const response=await get(endpoint,fetcher);
  // Bluesky reports unresolved handles as HTTP 400, which is not proof of absence.
  if(response.state!=='found') return {...result,...response};
  let d=response.data;
  if(platform==='gitlab') {d=d.find(user=>user.username?.toLowerCase()===handle.toLowerCase());if(!d)return {...result,state:'not_found'};}
  const common={...result,state:'found',name:d.name||d.displayName||d.login||d.username||actor,bio:d.bio||d.description||'',avatar:safeLink(d.avatar_url||d.avatar||d.profile_image),url:safeLink(d.html_url||d.web_url)||profileUrl};
  if(platform==='github') return {...common,stats:{Followers:d.followers,Following:d.following,'Public repos':d.public_repos},joined:d.created_at,links:[safeLink(d.blog),d.twitter_username?`https://x.com/${encodeURIComponent(d.twitter_username)}`:null].filter(Boolean),location:d.location||null};
  if(platform==='bluesky') return {...common,stats:{Followers:d.followersCount,Following:d.followsCount,Posts:d.postsCount},joined:d.createdAt,links:[],location:null};
  if(platform==='devto') return {...common,stats:{},joined:d.joined_at,links:[safeLink(d.website_url),d.github_username?`https://github.com/${encodeURIComponent(d.github_username)}`:null,d.twitter_username?`https://x.com/${encodeURIComponent(d.twitter_username)}`:null].filter(Boolean),location:d.location||null};
  return {...common,stats:{},joined:d.created_at,links:[safeLink(d.website_url)].filter(Boolean),location:null};
 } catch(e) {return {...result,state:'unavailable',reason:e.name==='TimeoutError'?'Source timed out after 8 seconds.':'Source could not be reached or returned an unexpected response.'};}
}
export function manualLinks(handle) {return [];}
const socialRoots={x:'https://x.com/',instagram:'https://www.instagram.com/',facebook:'https://www.facebook.com/',reddit:'https://www.reddit.com/user/',youtube:'https://www.youtube.com/@',tiktok:'https://www.tiktok.com/@',telegram:'https://t.me/',threads:'https://www.threads.net/@'};
function decode(text=''){return text.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/<[^>]*>/g,'').trim();}
function metadata(html,key){for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const attrs={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gis))attrs[m[1].toLowerCase()]=m[3];if(attrs.property===key||attrs.name===key)return decode(attrs.content);}return '';}
function publicLinks(text){return [...new Set((text.match(/https?:\/\/[^\s<>"']+/g)||[]).map(safeLink).filter(Boolean))].slice(0,8);}
export async function socialLookup(platform,handle,fetcher=fetch){
 const url=socialRoots[platform]+encodeURIComponent(handle),base={platform,handle,url,source:url,checkedAt:new Date().toISOString()};
 if(platform==='x'&&!/^[a-z0-9_]{1,15}$/i.test(handle))return {...base,state:'not_applicable',reason:'X handles use up to 15 letters, numbers or underscores.'};
 if(platform==='telegram'&&!/^[a-z][a-z0-9_]{4,31}$/i.test(handle))return {...base,state:'not_applicable',reason:'Telegram handles use 5-32 letters, numbers or underscores and begin with a letter.'};
 try{
  const endpoint=platform==='reddit'?url+'/about.json':url;
  const r=await fetcher(endpoint,{headers:{'User-Agent':'Trace-Public-Profile/1.0','Accept':platform==='reddit'?'application/json':'text/html'},signal:AbortSignal.timeout(8000),redirect:'error'});
  if([401,403,429].includes(r.status))return {...base,state:'blocked',reason:'This public source restricted the request. No login or bypass attempted.'};
  if(r.status===404)return {...base,state:'not_found',reason:'Public profile URL returned HTTP 404.'};
  if(!r.ok)return {...base,state:'unavailable',reason:`Public source returned HTTP ${r.status}.`};
  if(platform==='reddit'){
   const j=await r.json(),d=j.data;
   if(!d?.name||d.name.toLowerCase()!==handle.toLowerCase())return {...base,state:'limited',reason:'No exact public profile record could be verified.'};
   return {...base,source:endpoint,state:'found',name:d.subreddit?.title||d.name,bio:d.subreddit?.public_description||'',stats:{'Post karma':d.link_karma,'Comment karma':d.comment_karma},joined:new Date(d.created_utc*1000).toISOString(),links:publicLinks(d.subreddit?.public_description||''),location:null};
  }
  const reader=r.body.getReader();let html='',bytes=0;const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>400000){await reader.cancel();break;}html+=decoder.decode(value,{stream:true});}
  const name=metadata(html,'og:title'),bio=metadata(html,'og:description')||metadata(html,'description'),canonical=metadata(html,'og:url');
  const isLogin=/^(log in|login|sign up|facebook|instagram|x|twitter|youtube|tiktok|threads)$/i.test(name)||/log in to (facebook|instagram)|sign in to x/i.test(name+' '+bio);
  const marker=html.includes('tgme_page_title')&&platform==='telegram';
  const exact=canonical&&canonical.replace(/\/$/,'').toLowerCase()===url.replace(/\/$/,'').toLowerCase();
  if(!name||isLogin||(!exact&&!marker))return {...base,state:'limited',reason:'Public response did not expose a verifiable profile. Open the candidate link manually; existence and ownership are unverified.'};
  if(platform==='telegram'&&!html.includes('tgme_page_extra'))return {...base,state:'limited',reason:'Telegram exposed a contact link only, not a public profile record.'};
  return {...base,state:'limited',profileReadable:true,name,bio,avatar:safeLink(metadata(html,'og:image')),stats:{},links:publicLinks(bio),location:null,reason:'Only publicly exposed page metadata is readable. Counts, posts and identity are not verified.'};
 }catch{return {...base,state:'unavailable',reason:'Public request timed out, redirected, or could not be read. No login or bypass attempted.'};}
}
export function declaredLinks(results){return results.flatMap(r=>(r.links||[]).map(url=>({from:r.platform,fromHandle:r.handle,url,source:r.source,evidence:'Self-linked in the public profile',confidence:'Declared link, not verified ownership'})));}
