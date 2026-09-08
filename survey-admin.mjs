import {esc,types,validateSchema,csv,printHTML} from "./survey-core.mjs";
const db=window.incheonSupabase;
const flags=window.NURIM_FEATURES||{survey:true,charts:true,programAddress:true};
let sessionGeneration=0,bindingRequest=0,activeQuestion=0,surveyRole="manager",centerChoice="",managerChoice="";
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
const binding=document.createElement("section");binding.id="nurimSurveyBindingPanel";binding.className="adminGoogleFormBox";binding.innerHTML='<h3>누림 설문 연결</h3><p>우리가 만든 설문을 신청서로 사용합니다. 설문 관리에서 신청용으로 배포한 설문을 선택하세요.</p><label>신청 설문 <select id="nurimSurveyBinding"><option value="">신청 설문을 선택하세요</option></select></label><p id="nurimProgramAddress"></p>';
document.querySelector('#programApplicationStep .wizardStepTitle').after(binding);
const legacyBoxes=[...document.querySelectorAll('#programApplicationStep > .adminConsentBox,#programApplicationStep > .adminGoogleFormBox,#programApplicationStep > .adminFileBox')].filter(x=>x!==binding);legacyBoxes.forEach(x=>x.classList.add('legacyApplicationSettings'));
binding.insertAdjacentHTML('beforeend','<div class="bindingActions"><button type="button" id="openSurveyBuilder">설문 만들기·관리</button><button type="button" id="reloadSurveyChoices">목록 새로고침</button></div><p id="surveyBindingStatus" role="status"></p>');
document.querySelector('#openSurveyBuilder').onclick=()=>switchAdminTab('surveyManage');document.querySelector('#reloadSurveyChoices').onclick=()=>refreshBinding();
const select=binding.querySelector("select");let bindingWanted="";
async function refreshBinding(){
 const request=++bindingRequest,value=bindingWanted;select.disabled=true;
 try{const response=await api("list",{scope:"manage"});surveyRole=response.role||"manager";const next=response.surveys;if(request!==bindingRequest)return;list=next;select.innerHTML='<option value="">신청 설문을 선택하세요</option>'+list.filter(s=>s.published_revision&&(!editingId||!programs.find(p=>p.id===editingId)?.managerId||s.owner_id===programs.find(p=>p.id===editingId)?.managerId)).map(s=>'<option value="'+s.id+'">'+esc((surveyRole==='super'?(s.center_name||'미지정')+' · '+(s.owner_name||'담당자')+' · ':'')+s.title)+'</option>').join("");
 if(value&&!list.some(s=>s.id===value)){const o=new Option("현재 연결된 설문 (다른 담당자 관리)",value);select.append(o);}
 select.value=value;select.disabled=false;document.querySelector("#surveyBindingStatus").textContent=list.some(s=>s.published_revision)?"선택한 설문이 프로그램 신청 화면에 표시됩니다.":"아직 신청용으로 배포한 설문이 없습니다. 설문을 만든 뒤 신청용 배포를 해 주세요.";
 }catch(e){if(request!==bindingRequest)return;select.innerHTML='<option value="'+esc(value)+'">설문 목록을 불러오지 못했습니다</option>';select.value=value;}
}
const oldFill=fillProgram;fillProgram=function(p){oldFill(p);bindingWanted=p.surveyId||"";refreshBinding();binding.querySelector("#nurimProgramAddress").textContent=p.publicNumber?"프로그램 주소: "+location.origin+programPath(p):"저장하면 프로그램 주소가 자동 생성됩니다.";};
const oldReset=resetProgramForm;resetProgramForm=function(){oldReset();bindingWanted="";select.value="";};
select.onchange=()=>{bindingWanted=select.value;const item=list.find(s=>s.id===bindingWanted);document.querySelector('#surveyBindingStatus').textContent=item?'신청서: '+item.title+(surveyRole==='super'?' · 담당자: '+(item.owner_name||'미지정'):''):'';};
document.querySelector('[data-tab="programCreate"]').addEventListener("click",()=>refreshBinding());
window.NurimSurvey={api,selected:()=>bindingWanted,selection:()=>list.find(s=>s.id===bindingWanted),refreshBinding};
document.querySelector("#goApplicationSettings").addEventListener("click",refreshBinding);
document.addEventListener("submit",event=>{if(event.target.id!=="programForm")return;const existing=editingId&&programs.find(p=>p.id===editingId);if(!bindingWanted&&!existing){event.preventDefault();event.stopImmediatePropagation();alert("신청에 사용할 설문을 선택해 주세요.");setProgramRegistrationStep("application");select.focus();return;}if(bindingWanted){const chosen=list.find(s=>s.id===bindingWanted);if(chosen&&surveyRole==="super"&&chosen.center_name&&document.querySelector("#centerName").value.trim()!==chosen.center_name){event.preventDefault();event.stopImmediatePropagation();alert("프로그램 복지관과 설문 소속 기관이 다릅니다. 같은 기관의 설문을 선택해 주세요.");return;}["#googleFormUrl","#googleFormTokenEntry","#googleFormResponseSheetId"].forEach(id=>{const el=document.querySelector(id);if(el)el.value="";});document.querySelector("#formEnabled").checked=false;}},true);
async function refresh(){
 const {data:{session}}=await db.auth.getSession();
 if(!session)throw Error("로그인이 필요합니다.");
 if(loadedUser!==session.user.id){loadedUser=session.user.id;current=null;saved=null;dirty=false;centerChoice="";managerChoice="";}
 const result=await api("list",{scope:"manage"});list=result.surveys;surveyRole=result.role||"manager";
 if(!current)renderList();
 refreshBinding();
}
function renderList(){
 current=null;dirty=false;
 const centers=[...new Set(list.map(s=>s.center_name||'기관 미지정'))].sort();
 const managers=[...new Map(list.filter(s=>!centerChoice||(s.center_name||'기관 미지정')===centerChoice).map(s=>[s.owner_id,s.owner_name||'담당자'])).entries()];
 const rows=list.filter(s=>(!centerChoice||(s.center_name||'기관 미지정')===centerChoice)&&(!managerChoice||s.owner_id===managerChoice));
 section.innerHTML='<h3>'+(surveyRole==='super'?'기관별 설문 관리':'내 설문 목록')+'</h3><p>설문을 선택해 문항·배포·응답을 함께 관리합니다. 복사는 응답을 가져오지 않습니다.</p><div class="formActions"><button data-action="new">새 설문 만들기</button><button data-action="health">연결 점검</button></div>'+(surveyRole==='super'?'<div class="surveyFilters"><label>기관<select id="surveyCenterFilter"><option value="">전체 기관</option>'+centers.map(c=>'<option'+(c===centerChoice?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label><label>담당자<select id="surveyManagerFilter"><option value="">전체 담당자</option>'+managers.map(([id,name])=>'<option value="'+id+'"'+(id===managerChoice?' selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label></div>':'')+'<p>'+rows.length+'개 설문</p><div class="surveyList">'+(rows.length?rows.map(s=>'<article class="row"><strong>'+esc(s.title)+'</strong><p>'+esc(s.center_name||'기관 미지정')+' · '+esc(s.owner_name||'담당자')+'</p><p>수정 '+s.revision+'회 · '+(s.published_revision?'신청용 배포 완료':'저장만 완료')+'</p><button data-action="load" data-id="'+s.id+'">열기</button><button data-action="copy" data-id="'+s.id+'">복사</button></article>').join(''):'<p>설문이 없습니다.</p>')+'</div>';
 section.querySelector('#surveyCenterFilter')?.addEventListener('change',e=>{centerChoice=e.target.value;managerChoice='';renderList();});
 section.querySelector('#surveyManagerFilter')?.addEventListener('change',e=>{managerChoice=e.target.value;renderList();});
}
function seed(){return {title:"새 프로그램 신청서",description:"",questions:[]};}
async function load(id,copy=false,rev){
 const d=await api("load",{surveyId:id,revision:rev});
 current=copy?{id:null,revision:0}:d.survey;revision=copy?0:d.version.revision;saved=structuredClone(d.version.schema);if(copy)saved.title+=" (복사)";
 dirty=copy;activeQuestion=0;renderEditor(d.versions);
}
function renderEditor(history=[]){
 section.innerHTML='<div class="formActions"><button data-action="list">설문 목록</button><strong>'+esc(saved.title)+'</strong><span id="surveySaveState">'+(dirty?"저장 전":"저장본 "+revision)+'</span></div><div class="surveyContext"><label>설문 제목<input id="surveyTitle" maxlength="200" value="'+esc(saved.title)+'"></label><label>설문 안내<textarea id="surveyDescription">'+esc(saved.description)+'</textarea></label></div><div class="surveyEditorLayout"><div id="surveyQuestions"></div><aside class="surveySideTools" aria-label="문항 도구"><button data-action="add">＋ 문항 추가</button><button data-action="addPage">＋ 페이지 추가</button><button data-action="copyQuestion">문항 복사</button><button data-action="collapse">모두 접기</button><button data-action="save">저장</button></aside></div><div class="formActions"><button data-action="save" class="primary">수정 내용 저장</button><button data-action="preview">신청 화면 미리보기</button><button data-action="print">빈 설문지 인쇄 / PDF</button><button data-action="html">빈 설문지 HTML</button></div><div class="formActions"><button data-action="publish">신청용 배포 / 업데이트</button><button data-action="responses">응답·그래프·CSV</button></div><p>저장은 문항 이력을 남깁니다. Google 배포 후 연결된 프로그램에 새 문항이 적용됩니다. 기존 응답은 작성 당시 문항으로 유지됩니다.</p><details><summary>이전 수정 이력 ('+history.length+')</summary>'+history.map(v=>'<p>수정 '+v.revision+' · '+esc(v.saved_name)+' · '+new Date(v.saved_at).toLocaleString("ko-KR")+' <button data-action="history" data-revision="'+v.revision+'">문항 보기</button></p>').join("")+'</details><div id="surveyResults"></div>';
 renderQuestions();
}
function renderQuestions(){
 section.querySelector('#surveyQuestions').innerHTML=(saved.questions.length?'':'<p class="notice">빈 설문입니다. 문항 추가로 직접 구성하세요. 개인정보 동의도 동의 여부 유형으로 추가할 수 있습니다. 이름·생년월일·연락처는 신청 기본정보로 별도 표시됩니다.</p>')+saved.questions.map((q,i)=>'<details class="surveyQuestion" data-index="'+i+'"'+(i===activeQuestion?' open':'')+'><summary><span>'+(i+1)+'</span><strong class="questionTitle">'+esc(q.label||'새 문항')+'</strong><span class="questionType">'+(q.pageBreakBefore?'새 페이지 · ':'')+esc(types[q.type])+(q.required?' · 필수':'')+'</span></summary><div class="questionEditorBody"><div class="questionHeaderFields"><label>질문<input data-field="label" value="'+esc(q.label)+'"></label><label>유형<select data-field="type">'+Object.entries(types).map(([v,l])=>'<option value="'+v+'"'+(q.type===v?' selected':'')+'>'+l+'</option>').join('')+'</select></label></div><details class="questionHelp"><summary>설명·미동의 안내'+(q.help?' (작성됨)':' 추가')+'</summary><label>설명<textarea data-field="help">'+esc(q.help)+'</textarea></label></details><div class="questionToggles"><label><input type="checkbox" data-field="pageBreakBefore"'+(q.pageBreakBefore?' checked':'')+'>여기서 새 페이지 시작</label><label><input type="checkbox" data-field="required"'+(q.required?' checked':'')+'>응답 필수</label>'+(q.type==='consent'?'<label><input type="checkbox" data-field="blockRefusal"'+(q.blockRefusal?' checked':'')+'>미동의 시 접수 제한</label>':'')+'</div>'+(['radio','checkbox','select','rank'].includes(q.type)?'<div class="surveyOptions">'+q.options.map((o,n)=>'<div class="surveyOption"><label>선택지 '+(n+1)+'<textarea rows="1" data-option="'+n+'">'+esc(o)+'</textarea></label><button data-action="removeOption" data-index="'+i+'" data-option="'+n+'">삭제</button></div>').join('')+'<button data-action="addOption" data-index="'+i+'">선택지 추가</button></div>':'')+'<div class="formActions"><button data-action="up" data-index="'+i+'">위로</button><button data-action="down" data-index="'+i+'">아래로</button><button data-action="remove" data-index="'+i+'">문항 삭제</button></div></div></details>').join('');
}
section.addEventListener('toggle',e=>{if(!e.target.matches('.surveyQuestion')||!e.target.open)return;activeQuestion=Number(e.target.dataset.index);section.querySelectorAll('.surveyQuestion[open]').forEach(el=>{if(el!==e.target)el.open=false;});},true);
function read(){
 if(!saved)return;
 saved.title=section.querySelector("#surveyTitle").value.trim();saved.description=section.querySelector("#surveyDescription").value;
 section.querySelectorAll(".surveyQuestion").forEach(el=>{const q=saved.questions[Number(el.dataset.index)];el.querySelectorAll("[data-field]").forEach(f=>q[f.dataset.field]=f.type==="checkbox"?f.checked:f.value);el.querySelectorAll("textarea[data-option]").forEach(f=>q.options[Number(f.dataset.option)]=f.value);});
}
section.addEventListener("input",e=>{if(e.target.dataset.field==="label")e.target.closest(".surveyQuestion").querySelector(".questionTitle").textContent=e.target.value||"새 문항";dirty=true;const state=section.querySelector("#surveySaveState");if(state)state.textContent="저장하지 않은 수정";});
section.addEventListener("change",e=>{if(e.target.dataset.field==="type"){read();renderQuestions();}});
section.addEventListener("click",async e=>{
 const button=e.target.closest("button[data-action]");if(!button)return;
 const action=button.dataset.action,i=button.dataset.index===undefined?activeQuestion:Number(button.dataset.index);button.disabled=true;
 try{
  if(action==="new"){if(dirty&&!confirm("저장하지 않은 수정을 닫을까요?"))return;activeQuestion=0;current={id:null,revision:0};revision=0;saved=seed();dirty=true;renderEditor();return;}
  if(action==="load"||action==="copy"){await load(button.dataset.id,action==="copy");return;}
  if(action==="list"){if(dirty&&!confirm("저장하지 않은 수정을 닫을까요?"))return;current=null;await refresh();return;}
  if(action==="health"){await api("health");alert("연결이 잘 됐습니다.");return;}
  read();
  if(action==="collapse"){activeQuestion=-1;renderQuestions();return;}
  if(action==="copyQuestion"){if(i<0||!saved.questions[i])throw Error("복사할 문항을 먼저 선택해 주세요.");const q=structuredClone(saved.questions[i]);q.id="q_"+crypto.randomUUID().replaceAll("-","");saved.questions.splice(i+1,0,q);activeQuestion=i+1;dirty=true;renderQuestions();return;}
  if(["add","addPage","remove","up","down","addOption","removeOption"].includes(action)){
   if(action==="addPage")saved.questions.splice(Math.min(saved.questions.length,Math.max(0,activeQuestion+1)),0,{id:"page_"+crypto.randomUUID().replaceAll("-",""),type:"notice",label:"다음 페이지",help:"",required:false,blockRefusal:false,pageBreakBefore:true,options:[]});
   if(action==="add")saved.questions.splice(Math.max(0,activeQuestion+1),0,{id:"q_"+crypto.randomUUID().replaceAll("-",""),type:"text",label:"새 문항",help:"",required:false,blockRefusal:false,options:["선택지 1"]});
   if(action==="remove")saved.questions.splice(i,1);
   if(action==="up"&&i>0)[saved.questions[i-1],saved.questions[i]]=[saved.questions[i],saved.questions[i-1]];
   if(action==="down"&&i<saved.questions.length-1)[saved.questions[i+1],saved.questions[i]]=[saved.questions[i],saved.questions[i+1]];
   if(action==="addOption")saved.questions[i].options.push("새 선택지");
   if(action==="removeOption")saved.questions[i].options.splice(Number(button.dataset.option),1);
   activeQuestion=["add","addPage"].includes(action)?Math.min(saved.questions.length-1,Math.max(0,activeQuestion+1)):action==="up"?Math.max(0,i-1):action==="down"?Math.min(saved.questions.length-1,i+1):Math.min(i,saved.questions.length-1);dirty=true;renderQuestions();const state=section.querySelector("#surveySaveState");if(state)state.textContent="저장하지 않은 수정";return;
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
db.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT"){sessionGeneration++;bindingRequest++;bindingWanted="";select.value="";current=null;saved=null;list=[];viewRows=[];dirty=false;centerChoice="";managerChoice="";surveyRole="manager";section.innerHTML="";}});
