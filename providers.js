export function normalize(input) {
 if(typeof input !== 'string') throw new Error('Enter a handle, not a URL.');
 const handle=input.trim().replace(/^@/,'');
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/.test(handle)) throw new Error('Use 1-100 letters, numbers, dots, underscores or hyphens. No URLs or spaces.');
 return handle;
}
export const sources = ['github','bluesky','gitlab','devto'];
const safeLink = value => {try {const u=new URL(value); return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
async function get(url, fetcher) {
 const r=await fetcher(url,{headers:{'User-Agent':'Trace-Public-Profile/1.0','Accept':'application/json'},signal:AbortSignal.timeout(8000),redirect:'error'});
 if(r.status===404) return {state:'not_found'};
 if(r.status===429||r.status===403) return {state:'unavailable',reason:'Source rate limit or access restriction. Try later or open the source.'};
 if(!r.ok) return {state:'unavailable',reason:`Source returned HTTP ${r.status}.`};
 return {state:'found',data:await r.json()};
}
export async function lookup(platform,handle,fetcher=fetch) {
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
export function manualLinks(handle) {
 if(handle.includes('.')) return [];
 return [['X','https://x.com/'],['Instagram','https://www.instagram.com/'],['TikTok','https://www.tiktok.com/@'],['YouTube','https://www.youtube.com/@']].map(([platform,base])=>({platform,url:base+encodeURIComponent(handle),state:'manual',reason:'Candidate link only. Not checked; the handle may not exist or may belong to someone else.'}));
}
