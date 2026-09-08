import {esc,validateAnswers} from "./survey-core.mjs";
const params=new URLSearchParams(location.search),preview=params.has("preview");
const ticketKey='nurim-survey-ticket:'+params.get('program');
let ticket=null;try{ticket=JSON.parse(sessionStorage.getItem(ticketKey)||'null');}catch{}
let data,id=ticket?.id||crypto.randomUUID(),token=ticket?.token||crypto.randomUUID(),busy=false;
const root=document.querySelector("main");
async function call(action,body={}){const r=await fetch(window.INCHEON_SUPABASE.url+"/functions/v1/nurim-survey",{method:"POST",headers:{"Content-Type":"application/json",apikey:window.INCHEON_SUPABASE.publishableKey,Authorization:"Bearer "+window.NURIM_SURVEY_ANON_KEY},body:JSON.stringify({action,...body})});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||"처리하지 못했습니다.");return d;}
function field(q){
 const req=q.required?" required":"",name="answer_"+q.id;
 const choices=q.type==="consent"?[["agree","동의"],["disagree","미동의"]]:(q.options||[]).map(v=>[v,v]);
 const opts='<option value="">선택</option>'+choices.map(([v,l])=>'<option value="'+esc(v)+'">'+esc(l)+'</option>').join("");
 let html;
 if(q.type==="notice")html="";
 else if(q.type==="textarea")html='<textarea name="'+name+'"'+req+' maxlength="10000"></textarea>';
 else if(q.type==="select")html='<select name="'+name+'"'+req+'>'+opts+'</select>';
 else if(q.type==="rank")html=q.options.map((v,i)=>'<label>'+(i+1)+'순위<select name="'+name+'"'+(i===0?req:"")+'>'+opts+'</select></label>').join("");
 else if(["radio","checkbox","consent"].includes(q.type))html=choices.map(([v,l])=>'<label class="choice"><input type="'+(q.type==="checkbox"?"checkbox":"radio")+'" name="'+name+'" value="'+esc(v)+'"'+(q.type!=="checkbox"?req:"")+'> '+esc(l)+'</label>').join("");
 else html='<input name="'+name+'" type="'+(q.type==="date"?"date":"text")+'"'+req+' maxlength="10000">';
 return '<fieldset><legend>'+esc(q.label)+(q.required?' <span aria-label="필수">*</span>':"")+'</legend>'+(q.help?'<p>'+esc(q.help)+'</p>':"")+html+'</fieldset>';
}
function render(){
 const s=data.schema;
 root.innerHTML='<h1>'+esc(s.title)+'</h1>'+(data.program?'<p>'+esc(data.program.title)+'</p>':"")+'<p>'+esc(s.description)+'</p>'+(preview?'<p class="notice">미리보기입니다. 입력 내용은 전송되지 않습니다.</p>':"")+'<form><fieldset class="basic"><legend>신청자 기본정보</legend><label>이름 *<input name="name" autocomplete="name" required maxlength="80"></label><label>생년월일 *<input name="birth" id="surveyBirth" type="date" required></label><label>연락처 *<input name="phone" type="tel" autocomplete="tel" required maxlength="24"></label></fieldset>'+s.questions.map(field).join("")+'<p>상세 응답과 작성된 신청서는 기관의 Google Drive에 저장됩니다. 누림지도에는 이름·생년월일·연락처와 접수 관리정보가 기록됩니다.</p><p role="status" id="status"></p><button type="submit">'+(preview?"입력 내용 검증":"신청서 제출")+'</button></form>';
 root.querySelector("form").onsubmit=submit;
}
async function submit(e){
 e.preventDefault();if(busy)return;const f=e.target,basic={name:f.elements.namedItem("name").value.trim(),birth:f.elements.namedItem("birth").value,phone:f.elements.namedItem("phone").value.trim()},answers={};
 for(const q of data.schema.questions){
  const controls=[...f.querySelectorAll('[name="answer_'+q.id+'"]')];
  if(q.type==='notice')continue;
  if(q.type==='rank'){const values=controls.map(x=>x.value),gap=values.indexOf('');if(gap>=0&&values.slice(gap+1).some(Boolean)){f.querySelector('#status').textContent=q.label+': 1순위부터 빈칸 없이 선택해 주세요.';return;}}
  answers[q.id]=q.type==="checkbox"?controls.filter(x=>x.checked).map(x=>x.value):q.type==="rank"?controls.map(x=>x.value).filter(Boolean):["radio","consent"].includes(q.type)?controls.find(x=>x.checked)?.value||"":controls[0].value;
 }
 const status=f.querySelector("#status"),button=f.querySelector('button[type="submit"]');
 try{
  validateAnswers(data.schema,basic,answers);
  if(preview){status.textContent="입력 내용을 확인했습니다. 실제 저장은 하지 않았습니다.";return;}
  busy=true;button.disabled=true;status.textContent="Google Drive에 신청서를 저장하고 있습니다. 창을 닫지 마세요.";
  try{sessionStorage.setItem(ticketKey,JSON.stringify({id,token}));}catch{}
  const r=await call("submit",{programId:data.program.id,revision:data.revision,basic,answers,id,token});
  try{sessionStorage.removeItem(ticketKey);}catch{}
  root.innerHTML='<h1>신청이 완료되었습니다</h1><p>Google Drive에 신청서와 응답이 저장되었습니다.</p><p>접수번호: '+esc(r.id)+'</p><p>'+(r.status==="waitlist"?"대기 접수입니다.":r.status==="pending_selection"?"추첨·배점 선정 대기입니다.":"")+'</p>';
 }catch(err){status.textContent=err.message+" 전송이 지연되었다면 같은 내용으로 다시 제출해 주세요.";button.disabled=false;}finally{busy=false;}
}
window.addEventListener("message",e=>{if(preview&&e.origin===location.origin&&e.source===parent&&e.data?.type==="nurim-preview"){data={schema:e.data.schema};render();}});
if(!preview)call("public",{programId:params.get("program"),id,token}).then(d=>{data=d;render();}).catch(e=>{root.textContent=e.message;});
