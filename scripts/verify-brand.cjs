const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
(async()=>{let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=process.env.NURIM_TEST_URL||'http://127.0.0.1:'+server.address().port;browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto(origin);await page.locator('.brandLogo img').waitFor();
 const data=await page.locator('script[type="application/ld+json"]').textContent();if(JSON.parse(data).name!=='인천 누림지도')throw Error('Missing site name');
 const checks=await page.evaluate(()=>({icon:document.querySelector('link[rel="icon"]').href,logo:document.querySelector('.brandLogo img').naturalWidth,site:document.querySelector('meta[property="og:site_name"]').content}));if(!checks.logo)throw Error('Logo not loaded');
 for(const p of ['/favicon.png','/favicon.ico','/assets/nurim-icon.png','/assets/nurim-touch-icon.png','/assets/site.webmanifest']){const r=await page.request.get(origin+p);if(!r.ok())throw Error('Asset failed: '+p);}
 fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/v95-header.png',clip:{x:0,y:0,width:1280,height:330}});console.log(JSON.stringify(checks));
 }finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
