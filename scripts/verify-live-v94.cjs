const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
(async()=>{
 const origin='https://incheon-nurimmap.netlify.app';
 const paths=['index.html','auth.js','program-taxonomy-v63.js','survey-admin.mjs','survey-form.mjs','survey-core.mjs','supabase-integration.js','survey.html'];
 for(const p of paths){const r=await fetch(origin+'/'+p);if(!r.ok)throw Error(p+': '+r.status);const content=await r.text();const local=fs.readFileSync(p,'utf8');const same=p.endsWith('.html')?JSON.stringify([...content.matchAll(/<script[^>]+src=[\"']([^\"']+)/g)].map(m=>m[1]))===JSON.stringify([...local.matchAll(/<script[^>]+src=[\"']([^\"']+)/g)].map(m=>m[1])):content===local;if(!same)throw Error('Content mismatch: '+p);}
 const sandbox={window:{}};for(const p of ['supabase-config.js','survey-public-key.js'])vm.runInNewContext(fs.readFileSync(p,'utf8'),sandbox);
 const config=sandbox.window.INCHEON_SUPABASE,key=sandbox.window.NURIM_SURVEY_ANON_KEY;
 const headers={apikey:config.publishableKey,Authorization:'Bearer '+key,'Content-Type':'application/json',Origin:origin};
 const url=config.url+'/functions/v1/nurim-survey';
 const publicRows=await fetch(config.url+'/rest/v1/programs?select=id&survey_id=not.is.null&published=eq.true&hidden_from_public=eq.false&limit=1',{headers});if(!publicRows.ok)throw Error('Public programs: '+publicRows.status);
 const rows=await publicRows.json();let publicStatus='no published survey';
 if(rows.length){const r=await fetch(url,{method:'POST',headers,body:JSON.stringify({action:'public',programId:rows[0].id})});const d=await r.json();if(!r.ok||!d.ok)throw Error('Public survey failed: '+r.status);publicStatus='OK';}
 const denied=await fetch(url,{method:'POST',headers,body:JSON.stringify({action:'list',scope:'manage'})});if(denied.status!==400&&denied.status!==401)throw Error('Anonymous management unexpectedly allowed');
 const noJwt=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"action":"list"}'});if(noJwt.status!==401)throw Error('JWT guard failed');
 console.log(JSON.stringify({productionAssetsMatch:paths.length,publicSurvey:publicStatus,anonymousManagement:denied.status,missingJwt:noJwt.status}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
