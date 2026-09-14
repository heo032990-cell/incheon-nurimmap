const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const origin=process.env.NURIM_TEST_URL||'https://incheon-nurimmap.netlify.app';
const scripts=['app.js','enhancements.js','accessibility.js','survey-form.mjs'];
for(const file of scripts){const r=await fetch(origin+'/'+file+'?v=100');assert(r.ok,file);assert.equal((await r.text()).replace(/\r\n/g,'\n').trim(),fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n').trim(),file);}
for(const file of ['favicon.png','assets/nurim-icon.png']){const r=await fetch(origin+'/'+file);assert(r.ok,file);assert(Buffer.from(await r.arrayBuffer()).equals(fs.readFileSync(file)),file);}
const r=await fetch(origin+'/');assert(r.ok);const html=await r.text();assert(html.includes('accessibility.js?v=100'));assert(html.includes('app.js?v=100'));assert(html.includes('<title>인천 누림지도</title>'));assert(!/id="resultSummary"[^>]*aria-live/.test(html));
console.log('PASS: production scripts, preserved favicon/share icon, v99 page title, v100 cache references and single result announcement source.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
