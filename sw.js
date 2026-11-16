const CACHE='logbook-v4';
const SHELL=['./','index.html','style.css','app.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>{const old=k.filter(x=>x!==CACHE);return Promise.all(old.map(x=>caches.delete(x))).then(()=>old.length)}).then(n=>self.clients.claim().then(()=>n?self.clients.matchAll({type:'window'}).then(cs=>cs.forEach(c=>{try{c.navigate(c.url)}catch(e){}})):null)))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(e.request,{ignoreSearch:true});
    const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>hit);
    return hit||net;
  }));
});
