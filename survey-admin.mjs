import {esc,types,validateSchema,csv,printHTML} from "./survey-core.mjs";
const db=window.incheonSupabase;
const flags=window.NURIM_FEATURES||{survey:true,charts:true,programAddress:true};
let sessionGeneration=0,bindingRequest=0;
let list=[],current=null,revision=0,saved=null,dirty=false,loadedUser=null,viewRows=[];
async function api(action,body={}){const generation=sessionGeneration;const {data:{session}}=await db.auth.getSession();const r=await fetch(window.INCHEON_SUPABASE.url+"/functions/v1/nurim-survey",{method:"POST",headers:{"Content-Type":"application/json",apikey:window.INCHEON_SUPABASE.publishableKey,Authorization:"Bearer "+window.NURIM_SURVEY_ANON_KEY,...(session?{"x-nurim-user-token":session.access_token}:{})},body:JSON.stringify({action,...body})});const d=await r.json();if(generation!==sessionGeneration)throw Error("로그인 상태가 변경되었습니다.");if(!r.ok||!d.ok)throw Error(d.error||"처리하지 못했습니다.");return d;}
function download(text,name,type){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([text],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function print(s,r){const w=window.open("","_blank");if(!w)return alert("인쇄 미리보기를 열도록 팝업을 허용해 주세요.");w.document.write(printHTML(s,r));w.document.close();}
const section=document.createElement("section");section.id="surveyManage";section.className="hidden";document.querySelector("#adminPanel").append(section);
const tab=document.createElement("button");tab.type="button";tab.dataset.tab="surveyManage";tab.textContent="설문 관리";document.querySelector("#adminPanel .tabs").append(tab);
const originalTab=switchAdminTab;
switchAdminTab=function(id){if(dirty&&id!=="surveyManage"&&!confirm("저장하지 않은 설문 수정이 있습니다. 다른 메뉴로 이동할까요?"))return;originalTab(id);section.classList.toggle("hidden",id!=="surveyManage");if(id==="surveyManage")refresh().catch(showError);};
tab.hidden=flags.survey===false;tab.onclick=()=>switchAdminTab("surveyManage");
function showError(e){alert(e.message||String(e));}
const binding=document.createElement("section");binding.className="adminGoogleFormBox";binding.innerHTML='<h3>누림 설문 연결</h3><p>설문 관리에서 저장하고 Google에 배포한 설문을 선택하세요. 연결하면 이 프로그램의 신청 화면으로 사용됩니다.</p><label>신청 설문 <select id="nurimSurveyBinding"><option value="">기존 신청 방식 사용</option></select></label><p id="nurimProgramAddress"></p>';
document.querySelector('#programApplicationStep .formActions').before(binding);
const select=binding.querySelector("select");let bindingWanted="";
async function refreshBinding(){
 const request=++bindingRequest,value=bindingWanted;select.disabled=true;
 try{const next=(await api("list")).surveys;if(request!==bindingRequest)return;list=next;select.innerHTML='<option value="">기존 신청 방식 사용</option>'+list.filter(s=>s.published_revision).map(s=>'<option value="'+s.id+'">'+esc(s.title)+'</option>').join("");
 if(value&&!list.some(s=>s.id===value)){const o=new Option("현재 연결된 설문 (다른 담당자 관리)",value);select.append(o);}
 select.value=value;select.disabled=false;
 }catch(e){if(request!==bindingRequest)return;select.innerHTML='<option value="'+esc(value)+'">설문 목록을 불러오지 못했습니다</option>';select.value=value;}
}
const oldFill=fillProgram;fillProgram=function(p){oldFill(p);bindingWanted=p.surveyId||"";refreshBinding();binding.querySelector("p:last-child").textContent=p.publicNumber?"프로그램 주소: "+location.origin+programPath(p):"저장하면 프로그램 주소가 자동 생성됩니다.";};
const oldReset=resetProgramForm;resetProgramForm=function(){oldReset();bindingWanted="";select.value="";};
select.onchange=()=>{bindingWanted=select.value;};
document.querySelector('[data-tab="programCreate"]').addEventListener("click",()=>refreshBinding());
window.NurimSurvey={api,selected:()=>bindingWanted,refreshBinding};
async function refresh(){
 const {data:{session}}=await db.auth.getSession();
 if(!session)throw Error("로그인이 필요합니다.");
 if(loadedUser!==session.user.id){loadedUser=session.user.id;current=null;saved=null;dirty=false;}
 list=(await api("list")).surveys;
 if(!current)renderList();
 refreshBinding();
}
function renderList(){
 current=null;dirty=false;section.innerHTML='<h3>내 설문 목록</h3><p>내 계정으로 만든 설문을 관리합니다. 복사하면 응답을 가져오지 않고 새 설문을 만듭니다.</p><div class="formActions"><button data-action="new">새 설문 만들기</button><button data-action="health">Google 연결 점검</button></div><div class="surveyList">'+(list.length?list.map(s=>'<article class="row"><strong>'+esc(s.title)+'</strong><p>수정 '+s.revision+'회 · '+(s.published_revision?'신청용 배포 완료':'아직 배포하지 않음')+' · '+new Date(s.updated_at).toLocaleString("ko-KR")+'</p><button data-action="load" data-id="'+s.id+'">열기</button><button data-action="copy" data-id="'+s.id+'">복사</button></article>').join(""):'<p>만든 설문이 없습니다.</p>')+'</div>';
}
function seed(){
 const questions=typeof cloneDefaultConsentItems==="function"?cloneDefaultConsentItems().flatMap(c=>c.rows?.length?c.rows.map(r=>({id:"consent_"+r.id,type:"consent",label:r.label,help:c.text,required:true,blockRefusal:false,options:[]})):[{id:"consent_"+c.id,type:"consent",label:c.title,help:c.text,required:true,blockRefusal:false,options:[]}]):[];
 return {title:"새 프로그램 신청서",description:"내용을 확인하고 신청해 주세요.",questions};
}
async function load(id,copy=false,rev){
 const d=await api("load",{surveyId:id,revision:rev});
 current=copy?{id:null,revision:0}:d.survey;revision=copy?0:d.version.revision;saved=structuredClone(d.version.schema);if(copy)saved.title+=" (복사)";
 dirty=copy;renderEditor(d.versions);
}
function renderEditor(history=[]){
 section.innerHTML='<div class="formActions"><button data-action="list">설문 목록</button><strong>'+esc(saved.title)+'</strong><span id="surveySaveState">'+(dirty?"저장 전":"저장본 "+revision)+'</span></div><div class="surveyContext"><label>설문 제목<input id="surveyTitle" maxlength="200" value="'+esc(saved.title)+'"></label><label>설문 안내<textarea id="surveyDescription">'+esc(saved.description)+'</textarea></label></div><div id="surveyQuestions"></div><div class="formActions"><button data-action="add">문항 추가</button><button data-action="save" class="primary">수정 내용 저장</button><button data-action="preview">신청 화면 미리보기</button><button data-action="print">빈 설문지 인쇄 / PDF</button><button data-action="html">빈 설문지 HTML</button></div><div class="formActions"><button data-action="publish">저장본 Google 배포 / 업데이트</button><button data-action="responses">응답·그래프·CSV</button></div><p>저장은 문항 이력을 남깁니다. Google 배포 후 연결된 프로그램에 새 문항이 적용됩니다. 기존 응답은 작성 당시 문항으로 유지됩니다.</p><details><summary>이전 수정 이력 ('+history.length+')</summary>'+history.map(v=>'<p>수정 '+v.revision+' · '+esc(v.saved_name)+' · '+new Date(v.saved_at).toLocaleString("ko-KR")+' <button data-action="history" data-revision="'+v.revision+'">문항 보기</button></p>').join("")+'</details><div id="surveyResults"></div>';
 renderQuestions();
}
function renderQuestions(){
 section.querySelector("#surveyQuestions").innerHTML=saved.questions.map((q,i)=>'<fieldset class="surveyQuestion" data-index="'+i+'"><legend>문항 '+(i+1)+'</legend><label>유형<select data-field="type">'+Object.entries(types).map(([v,l])=>'<option value="'+v+'"'+(q.type===v?" selected":"")+'>'+l+'</option>').join("")+'</select></label><label>질문<input data-field="label" value="'+esc(q.label)+'"></label><label>설명·미동의 안내<textarea data-field="help">'+esc(q.help)+'</textarea></label><label><input type="checkbox" data-field="required"'+(q.required?" checked":"")+'>응답 필수</label>'+(q.type==="consent"?'<label><input type="checkbox" data-field="blockRefusal"'+(q.blockRefusal?" checked":"")+'>미동의 시 접수 제한 (위 설명에 이유 필수)</label>':"")+(['radio','checkbox','select','rank'].includes(q.type)?'<div class="surveyOptions">'+q.options.map((o,n)=>'<label>선택지 '+(n+1)+'<textarea data-option="'+n+'">'+esc(o)+'</textarea><button data-action="removeOption" data-index="'+i+'" data-option="'+n+'">선택지 삭제</button></label>').join("")+'<button data-action="addOption" data-index="'+i+'">선택지 추가</button></div>':"")+'<div class="formActions"><button data-action="up" data-index="'+i+'">위로</button><button data-action="down" data-index="'+i+'">아래로</button><button data-action="remove" data-index="'+i+'">문항 삭제</button></div></fieldset>').join("");
}
function read(){
 if(!saved)return;
 saved.title=section.querySelector("#surveyTitle").value.trim();saved.description=section.querySelector("#surveyDescription").value;
 section.querySelectorAll(".surveyQuestion").forEach(el=>{const q=saved.questions[Number(el.dataset.index)];el.querySelectorAll("[data-field]").forEach(f=>q[f.dataset.field]=f.type==="checkbox"?f.checked:f.value);el.querySelectorAll("textarea[data-option]").forEach(f=>q.options[Number(f.dataset.option)]=f.value);});
}
section.addEventListener("input",()=>{dirty=true;const state=section.querySelector("#surveySaveState");if(state)state.textContent="저장하지 않은 수정";});
section.addEventListener("change",e=>{if(e.target.dataset.field==="type"){read();renderQuestions();}});
section.addEventListener("click",async e=>{
 const button=e.target.closest("button[data-action]");if(!button)return;
 const action=button.dataset.action,i=Number(button.dataset.index);button.disabled=true;
 try{
  if(action==="new"){current={id:null,revision:0};revision=0;saved=seed();dirty=true;renderEditor();return;}
  if(action==="load"||action==="copy"){await load(button.dataset.id,action==="copy");return;}
  if(action==="list"){if(dirty&&!confirm("저장하지 않은 수정을 닫을까요?"))return;current=null;await refresh();return;}
  if(action==="health"){await api("health");alert("Google Drive 연결과 Apps Script v78 응답을 확인했습니다.");return;}
  read();
  if(["add","remove","up","down","addOption","removeOption"].includes(action)){
   if(action==="add")saved.questions.push({id:"q_"+crypto.randomUUID().replaceAll("-",""),type:"text",label:"새 문항",help:"",required:false,blockRefusal:false,options:["선택지 1"]});
   if(action==="remove")saved.questions.splice(i,1);
   if(action==="up"&&i>0)[saved.questions[i-1],saved.questions[i]]=[saved.questions[i],saved.questions[i-1]];
   if(action==="down"&&i<saved.questions.length-1)[saved.questions[i+1],saved.questions[i]]=[saved.questions[i],saved.questions[i+1]];
   if(action==="addOption")saved.questions[i].options.push("새 선택지");
   if(action==="removeOption")saved.questions[i].options.splice(Number(button.dataset.option),1);
   dirty=true;renderQuestions();return;
  }
  if(action==="save"){validateSchema(saved);const d=await api("save",{id:current.id,revision:current.revision||0,schema:saved});await load(d.survey.id);await refreshBinding();return;}
  if(action==="preview"){validateSchema(saved);showSurveyFrame(null,saved);return;}
  if(action==="print"){validateSchema(saved);print(saved);return;}
  if(action==="html"){validateSchema(saved);download(printHTML(saved),saved.title+".html","text/html;charset=utf-8");return;}
  if(!current.id||dirty)throw Error("수정 내용을 먼저 저장해 주세요.");
  if(action==="history"){const d=await api("load",{surveyId:current.id,revision:Number(button.dataset.revision)});print(d.version.schema);return;}
  if(action==="publish"){if(!confirm("이 저장본을 Google에 배포하고 연결된 프로그램에 적용할까요?"))return;await api("publish",{surveyId:current.id,revision:current.revision});alert("Google Drive에 빈 설문지 PDF와 응답 탭을 준비했습니다.");await load(current.id);await refreshBinding();return;}
  if(action==="responses"){await responses(current.revision);return;}
  if(action==="responseVersion"){await responses(Number(button.dataset.revision));return;}
  if(action==="csv"){download(csv(viewRows.schema,viewRows.rows),saved.title+"_응답.csv","text/csv;charset=utf-8");return;}
  if(action==="printResponse"){print(viewRows.schema,viewRows.rows[Number(button.dataset.row)]);return;}
 }catch(e){showError(e);}finally{button.disabled=false;}
});
async function responses(rev){
 const d=await api("load",{surveyId:current.id});let offset=0,rows=[],r;
 do{r=await api("responses",{surveyId:current.id,revision:rev,offset});rows.push(...r.rows);offset=r.nextOffset;}while(offset!==null);
 viewRows={schema:r.schema,rows};
 const charts=flags.charts?r.schema.questions.filter(q=>["radio","checkbox","select","consent","rank"].includes(q.type)).map(q=>{
 const values=q.type==="consent"?["agree","disagree"]:q.options;
 return '<section class="surveyChart"><h4>'+esc(q.label)+'</h4>'+values.map(v=>{const n=rows.filter(r=>Array.isArray(r.answers[q.id])?r.answers[q.id].includes(v):r.answers[q.id]===v).length;return '<p>'+esc(v==="agree"?"동의":v==="disagree"?"미동의":v)+' · '+n+'명 <meter min="0" max="'+Math.max(1,rows.length)+'" value="'+n+'"></meter></p>';}).join("")+'</section>';
 }).join(""):"";
 section.querySelector("#surveyResults").innerHTML='<h3>응답 '+rows.length+'건 · 수정 '+rev+' 문항</h3><div class="formActions">'+d.versions.map(v=>'<button data-action="responseVersion" data-revision="'+v.revision+'">수정 '+v.revision+' 응답</button>').join("")+'</div><p>복수선택·우선순위 그래프는 항목별 선택 인원입니다. 상세 순위는 CSV에서 확인합니다.</p><button data-action="csv">이 문항 버전 응답 CSV</button><a href="'+esc(r.sheetUrl)+'" target="_blank" rel="noopener">Google 응답 시트</a><a href="'+esc(r.folderUrl)+'" target="_blank" rel="noopener">Google Drive · 전체 신청명단 CSV</a>'+charts+rows.map((r,i)=>'<p>'+esc(r.name)+' · '+esc(r.program_title)+' <button data-action="printResponse" data-row="'+i+'">신청서 출력</button></p>').join("");
}
const dialog=document.createElement("dialog");dialog.id="nurimSurveyDialog";dialog.innerHTML='<div class="dialogTitle"><h2>프로그램 신청서</h2><button type="button">닫기</button></div><iframe title="프로그램 신청 설문"></iframe>';document.body.append(dialog);
dialog.querySelector("button").onclick=()=>dialog.close();
function showSurveyFrame(p,schema){
 const frame=dialog.querySelector("iframe");frame.src="/survey.html"+(p?"?program="+encodeURIComponent(p.id):"?preview=1");
 frame.onload=()=>{if(schema)frame.contentWindow.postMessage({type:"nurim-preview",schema},location.origin);};
 dialog.showModal();
}
function programPath(p){return "/"+p.publicNumber+"/"+p.publicYear+"/"+encodeURIComponent(p.publicCenter||p.centerName);}
let changingHistory=false,openedFromPath=false,suppressedCloses=0;
const originalOpen=openApply;
openApply=function(p){
 if(flags.programAddress&&p.publicNumber&&!changingHistory){history.pushState({nurimProgram:p.id},"",programPath(p));openedFromPath=true;}
 if(p.surveyId)showSurveyFrame(p);else originalOpen(p);
};
function closed(){if(suppressedCloses){suppressedCloses--;return;}if(changingHistory)return;if(openedFromPath){openedFromPath=false;history.back();}else if(/^\/\d+\/\d{4}\//.test(location.pathname))history.replaceState({},"","/");}
dialog.addEventListener("close",()=>{if(!dialog.open)dialog.querySelector("iframe").src="about:blank";closed();});
document.querySelector("#applyDialog").addEventListener("close",closed);
function resolvePath(){
 const match=location.pathname.match(/^\/(\d+)\/(\d{4})\/([^/]+)\/?$/);if(!match)return;
 let requestedCenter;try{requestedCenter=decodeURIComponent(match[3]);}catch{return;}
 const p=programs.find(p=>String(p.publicNumber)===match[1]&&String(p.publicYear)===match[2]&&p.publicCenter===requestedCenter);
 if(p&&!dialog.open&&!document.querySelector("#applyDialog").open){changingHistory=true;openApply(p);changingHistory=false;}
}
window.addEventListener("popstate",()=>{changingHistory=true;[dialog,document.querySelector("#applyDialog")].forEach(d=>{if(d.open){suppressedCloses++;d.close();}});changingHistory=false;openedFromPath=false;resolvePath();});
const oldRender=renderAll;renderAll=function(){oldRender();resolvePath();};resolvePath();
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue="";}});
db.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT"){sessionGeneration++;bindingRequest++;bindingWanted="";select.value="";current=null;saved=null;list=[];viewRows=[];dirty=false;section.innerHTML="";}});
