/* 품 — 오프라인 캐시. 파일을 고치면 VERSION을 올려 주세요. */
const VERSION='poom-v9';
const FILES=['./','index.html','engine.js','scenarios/jeju.js','scenarios/oki.js','scenarios/tw.js','manifest.webmanifest','icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
/* 캐시를 먼저 보여 주고, 뒤에서 새 파일을 받아 다음 방문 때 반영 */
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(caches.open(VERSION).then(c=>c.match(e.request).then(hit=>{
  const net=fetch(e.request).then(r=>{if(r&&r.ok&&new URL(e.request.url).origin===location.origin)c.put(e.request,r.clone());return r}).catch(()=>hit);
  return hit||net})))});
