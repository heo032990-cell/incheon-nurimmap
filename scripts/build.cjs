const fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
if(!out.startsWith(root+path.sep)||path.basename(out)!=='dist')throw Error('Invalid build directory');
for(const f of fs.readdirSync(root).filter(f=>/\.(js|mjs)$/.test(f)))cp.execFileSync(process.execPath,['--check',path.join(root,f)]);
new vm.Script(fs.readFileSync(path.join(root,'backend','google-apps-script.gs'),'utf8'));
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const file of fs.readdirSync(root,{withFileTypes:true})){
 if(file.isFile()&&(/\.(html|css|js|mjs|png|ico)$/.test(file.name)||['_headers','_redirects','robots.txt','sitemap.xml'].includes(file.name)))fs.copyFileSync(path.join(root,file.name),path.join(out,file.name));
}
for(const dir of ['assets','manual'])fs.cpSync(path.join(root,dir),path.join(out,dir),{recursive:true});
console.log('Static release prepared; syntax checked; backend, tests and backups excluded.');


fs.copyFileSync(path.join(out,"index.html"),path.join(out,"admin.html"));

