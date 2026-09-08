import assert from 'node:assert/strict';
import {validateSchema,validateAnswers,validDate,csv,printHTML} from '../survey-core.mjs';
const q={id:'q1',type:'rank',label:'희망 순위',help:'',required:true,options:['오전','오후']};
const s={title:'시험',description:'',questions:[q]};
const b={name:'테스트',birth:'2000-02-29',phone:'010-0000-0000'};
assert(validDate(b.birth));assert(!validDate('2001-02-29'));
validateSchema(s);validateAnswers(s,b,{q1:['오후','오전']});
assert.throws(()=>validateAnswers(s,b,{q1:['오전','오전']}));
assert.throws(()=>validateAnswers(s,b,{q1:['외부값']}));
assert.throws(()=>validateAnswers(s,b,{q1:[]}));
const consent={...q,type:'consent',blockRefusal:false};const sc={...s,questions:[consent]};
validateAnswers(sc,b,{q1:'disagree'});assert.throws(()=>validateSchema({...s,questions:[{...consent,blockRefusal:true}]}));
const payload=validateAnswers(s,b,{q1:['오후'],arbitrary:'not stored'});assert(!('arbitrary' in payload));
const text=csv(s,[{id:'1',name:'=HYPERLINK("bad")',birth:b.birth,answers:{q1:['오후']}}]);assert(text.includes("'=HYPERLINK"));
assert(printHTML({...s,title:'<script>x</script>'}).includes('&lt;script&gt;'));assert(printHTML(s).includes('______년 ___월 ___일'));
console.log('11 response, date, consent, export safety assertions passed');

