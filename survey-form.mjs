import {esc,validateAnswers,surveyPages} from "./survey-core.mjs";
const params=new URLSearchParams(location.search),preview=params.has("preview");
const ticketKey='nurim-survey-ticket:'+params.get('program');
let ticket=null;try{ticket=JSON.parse(sessionStorage.getItem(ticketKey)||'null');}catch{}
let pageIndex=0,pages=[];
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
 const s=data.schema;pageIndex=0;pages=preview?surveyPages(s):[[],...surveyPages(s)];
 root.innerHTML='<h1>'+esc(s.title)+'</h1>'+(data.program?'<p>'+esc(data.program.title)+'</p>':"")+'<p>'+esc(s.description)+'</p>'+(preview?'<p class="notice">미리보기입니다. 입력 내용은 전송되지 않습니다.</p>':"")+'<form novalidate><p id="pageProgress" role="status"></p><div class="surveyPage" data-page="0"><fieldset class="basic"'+(preview?' hidden':'')+'><legend>신청 기본정보 · 한 번만 입력</legend><label>이름 *<input name="name" autocomplete="name" required maxlength="80"></label><label>생년월일 *<input name="birth" id="surveyBirth" type="date" required></label><label>연락처 *<input name="phone" type="tel" autocomplete="tel" required maxlength="24"></label></fieldset>'+pages[0].map(field).join("")+'</div>'+pages.slice(1).map((qs,i)=>'<div class="surveyPage" data-page="'+(i+1)+'" hidden>'+qs.map(field).join('')+'</div>').join('')+'<p id="basicCarryNotice">'+(preview?'이 미리보기는 추가 설문 문항만 표시합니다. 실제 신청 시 첫 단계의 이름·생년월일·연락처가 신청서에 함께 반영됩니다.':'처음 입력한 이름·생년월일·연락처는 신청서와 신청명단에 함께 반영됩니다. 설문에서 다시 입력하지 않아도 됩니다.')+'</p><p>상세 응답과 작성된 신청서는 기관의 Google Drive에 저장됩니다. 누림지도에는 이름·생년월일·연락처와 접수 관리정보가 기록됩니다.</p><p role="status" id="status"></p><div class="pageNavigation"><button type="button" id="previousPage">이전</button><button type="button" id="nextPage">다음</button><button type="submit">'+(preview?"입력 내용 검증":"신청서 제출")+'</button></div></form>';
 root.querySelector("form").onsubmit=submit;
 root.querySelector("#previousPage").onclick=()=>{if(!busy){pageIndex--;showPage();}};
 root.querySelector("#nextPage").onclick=()=>{if(!busy&&checkPage()){pageIndex++;showPage();}};
 showPage(false);
}
function values(f,questions){
 const answers={};for(const q of questions){
  if(q.type==='notice')continue;
  const controls=[...f.querySelectorAll('[name="answer_'+q.id+'"]')];
  if(q.type==='rank'){const vals=controls.map(x=>x.value),gap=vals.indexOf('');if(gap>=0&&vals.slice(gap+1).some(Boolean))throw Error(q.label+': 1순위부터 빈칸 없이 선택해 주세요.');}
  answers[q.id]=q.type==='checkbox'?controls.filter(x=>x.checked).map(x=>x.value):q.type==='rank'?controls.map(x=>x.value).filter(Boolean):['radio','consent'].includes(q.type)?controls.find(x=>x.checked)?.value||'':controls[0].value;
 }return answers;
}
function basics(f){if(preview)return {name:'미리보기',birth:'2000-01-01',phone:'01000000000'};return {name:f.elements.namedItem('name').value.trim(),birth:f.elements.namedItem('birth').value,phone:f.elements.namedItem('phone').value.trim()};}
function showPage(focus=true){
 root.querySelectorAll('.surveyPage').forEach((el,i)=>{el.hidden=i!==pageIndex;});
 root.querySelector('#pageProgress').textContent=preview?(pageIndex+1)+' / '+pages.length+' 설문 페이지':pageIndex===0?'신청 기본정보':pageIndex+' / '+(pages.length-1)+' 설문 페이지';
 root.querySelector('#previousPage').hidden=pageIndex===0;
 root.querySelector('#nextPage').hidden=pageIndex===pages.length-1;
 root.querySelector('button[type="submit"]').hidden=pageIndex!==pages.length-1;
 root.querySelector('#status').textContent='';
 const panel=root.querySelector('[data-page="'+pageIndex+'"]');panel.tabIndex=-1;
 if(focus){panel.focus();window.scrollTo({top:0,behavior:'auto'});}
}
function checkPage(){
 const f=root.querySelector('form'),panel=f.querySelector('[data-page="'+pageIndex+'"]');
 try{
  for(const input of panel.querySelectorAll('input,select,textarea')){if(input.closest('[hidden]'))continue;if(!input.checkValidity()){input.reportValidity();return false;}}
  validateAnswers({...data.schema,questions:pages[pageIndex]},basics(f),values(f,pages[pageIndex]));return true;
 }catch(e){f.querySelector('#status').textContent=e.message;return false;}
}
async function submit(e){
 e.preventDefault();if(busy)return;
 if(pageIndex<pages.length-1){if(checkPage()){pageIndex++;showPage();}return;}
 if(!checkPage())return;
 const f=e.target,basic=basics(f);let answers;
 try{answers=values(f,data.schema.questions);}catch(err){f.querySelector('#status').textContent=err.message;return;}
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
