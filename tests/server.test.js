const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../backend/Code.gs'),'utf8');
const schemas=JSON.parse(fs.readFileSync(path.join(__dirname,'schema.json'),'utf8'));
const ssmap=new Map(),props=new Map();let last=null;let chartCount=0;
function colNum(str){return [...str].reduce((v,c)=>v*26+c.charCodeAt(0)-64,0)}
class Range {
 constructor(sh,r,c,n=1,m=1){this.sh=sh;this.r=r;this.c=c;this.n=n;this.m=m}
 getValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>this.sh.cells[this.r+i-1]?.[this.c+j-1]??''))}
 getValue(){return this.getValues()[0][0]}
 setValues(arr){assert.equal(arr.length,this.n);for(let i=0;i<this.n;i++){assert.equal(arr[i].length,this.m);for(let j=0;j<this.m;j++){const row=this.r+i-1,col=this.c+j-1;if(!this.sh.cells[row])this.sh.cells[row]=[];this.sh.cells[row][col]=arr[i][j]}}return this}
 setValue(v){const row=this.r-1,col=this.c-1;if(!this.sh.cells[row])this.sh.cells[row]=[];this.sh.cells[row][col]=v;return this}setFormula(v){return this.setValue(v)}
 offset(r,c,n,m){return new Range(this.sh,this.r+r,this.c+c,n||this.n,m||this.m)}
 createTextFinder(t){const rg=this;return {matchEntireCell(){return this},findNext(){for(let r=rg.r;r<rg.r+rg.n;r++)for(let c=rg.c;c<rg.c+rg.m;c++)if(String(rg.sh.cells[r-1]?.[c-1])===String(t))return {getRow(){return r}};return null}}}
 setBackground(){return this}setFontColor(){return this}setFontWeight(){return this}setFontSize(){return this}setVerticalAlignment(){return this}setWrap(){return this}setNumberFormat(){return this}setBorder(){return this}merge(){return this}breakApart(){return this}getA1Notation(){return `${this.r},${this.c}`}
}
class Sheet{
 constructor(name){this.name=name;this.cells=[];this.charts=[]}
 getRange(x,y,n,m){if(typeof x==='string'){const z=x.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);if(!z){const a=x.match(/^([A-Z]+):([A-Z]+)$/);if(a)return new Range(this,1,colNum(a[1]),100,colNum(a[2])-colNum(a[1])+1);throw Error('range '+x)}const r=Number(z[2]),c=colNum(z[1]);return new Range(this,r,c,z[4]?Number(z[4])-r+1:1,z[3]?colNum(z[3])-c+1:1)}return new Range(this,x,y,n||1,m||1)}
 getDataRange(){return new Range(this,1,1,Math.max(this.getLastRow(),1),Math.max(this.getLastColumn(),1))}
 getLastRow(){for(let i=this.cells.length-1;i>=0;i--)if(this.cells[i]?.some(v=>v!==undefined&&v!==''))return i+1;return 0}
 getLastColumn(){let n=0;for(const a of this.cells){if(a)for(let j=a.length-1;j>=0;j--)if(a[j]!==undefined&&a[j]!==''){n=Math.max(n,j+1);break}}return n}
 appendRow(row){this.cells[this.getLastRow()]=row.slice();return this}getName(){return this.name}setName(v){this.name=v;return this}
 clear(){this.cells=[];return this}setFrozenRows(){return this}setColumnWidth(){return this}setColumnWidths(){return this}setHiddenGridlines(){return this}setRowHeights(){return this}
 getCharts(){return this.charts}removeChart(c){this.charts=this.charts.filter(x=>x!==c)}insertChart(ch){this.charts.push(ch)}newChart(){return {asBarChart(){return this},addRange(){return this},setNumHeaders(){return this},setOption(){return this},setPosition(){return this},build(){chartCount++;return {chart:chartCount}}}}
}
class Book{
 constructor(id){this.id=id;this.sheets=[new Sheet('Sheet1')]}
 getId(){return this.id}getUrl(){return `https://example.invalid/sheets/${this.id}`}
 getSheets(){return this.sheets}getSheetByName(name){return this.sheets.find(x=>x.name===name)||null}
 insertSheet(name){const s=new Sheet(name);this.sheets.push(s);return s}
 setActiveSheet(){return this}
}
const SpreadsheetApp={create(){const ss=new Book('test-'+(ssmap.size+1));ssmap.set(ss.id,ss);last=ss;return ss},openById(id){if(!ssmap.has(id))throw Error('not found');return ssmap.get(id)},BorderStyle:{SOLID:'SOLID'},flush(){}};
const PropertiesService={getScriptProperties(){return{getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v)}}};
const LockService={getScriptLock(){return{waitLock(){},releaseLock(){}}}};
let uuid=0;const Utilities={getUuid(){return '12345678-abc'+(++uuid)+'-defg-hijk-1234567890abcdef'}};
const HtmlService={createHtmlOutput(html){return {html,setTitle(){return this},addMetaTag(){return this}}}};
const ctx={SpreadsheetApp,PropertiesService,LockService,Utilities,HtmlService,console};vm.createContext(ctx);vm.runInContext(s,ctx);
const setup=vm.runInContext('setup_',ctx),submit=vm.runInContext('submitSurvey',ctx),build=vm.runInContext('buildFlags_',ctx),schema=vm.runInContext('QUESTION_SCHEMA',ctx);
const url1=setup(); assert.equal(last.sheets.length,5); assert.equal(last.getSheetByName('ダッシュボード').getCharts().length,2);
const url2=setup();assert.equal(url1,url2);assert.equal(last.sheets.length,5);
function sample(role){let a={};const all=schemas.questions;const keys=[...schemas.common,...(role===0||role===2?schemas.borrow.filter(q=>q!=='Q8'):[]),...(role===1||role===2?schemas.lend:[]),...schemas.final];for(const id of keys){let q=all[id];if(id==='Q4'){a[id]=q.choices[role];continue}if(q.optional)continue;if(q.type==='single'){a[id]=q.choices[0]}else if(q.type==='multi'){a[id]={list:[q.choices[0]]}}else if(q.type==='matrix'){a[id]=Object.fromEntries(q.rows.map((_,i)=>[i,3]))}else if(q.type==='rating'){a[id]=3}else if(q.type==='text'){a[id]=''}else throw Error('unhandled '+id)}return a}
for(let ri=0;ri<4;ri++){
 const a=sample(ri);const id=`unique-request-${'ABCDE'[ri]}123456789012345678`;const p={version:'2026.10-r9',requestId:id,answers:a};
 let res=submit(p);assert.equal(res.ok,true);assert.equal(res.duplicate,false);
 res=submit(p);assert.equal(res.ok,true);assert.equal(res.duplicate,true);
}
assert.equal(last.getSheetByName('回答').getLastRow(),5);
assert.equal(last.getSheetByName('回答').getLastColumn(),vm.runInContext('META_COLUMNS.length',ctx));
assert.equal(last.getSheetByName('回答').getRange(2,1,4,1).getValues().length,4);
assert.equal(vm.runInContext('RESPONSE_COLUMNS.length',ctx),39);
const base=sample(0), roleL=sample(1);
// Invalid schema responses
let rejected=0;function shouldReject(payload){try{submit(payload)}catch(e){rejected++;return}throw Error('expected rejection')}
shouldReject({version:'2026.10-r9',requestId:'id-invalid-ABCD-123456',answers:{Q4:'invalid'}});
const big=sample(0);big.Q10={list:schemas.questions.Q10.choices.slice(0,4)};
shouldReject({version:'2026.10-r9',requestId:'bad-multi-ABCD-12345678',answers:big});
const bad=sample(0); delete bad.Q25;
shouldReject({version:'2026.10-r9',requestId:'bad-missing-ABCD-12345678',answers:bad});
const bad2=sample(1);bad2.Q8={list:['その他'],other:'wrong route'};
shouldReject({version:'2026.10-r9',requestId:'bad-route-ABCD-12345678',answers:bad2});
const bad3=sample(0);bad3.Q9={0:2,1:3};
shouldReject({version:'2026.10-r9',requestId:'bad-matrix-ABCD-12345678',answers:bad3});
const good=sample(0);good.Q7='検討したが利用しなかった';good.Q8={list:['料金が高かった']};const r=submit({version:'2026.10-r9',requestId:'good-branch-ABCD-12345678',answers:good});assert.equal(r.ok,true);
assert.equal(last.getSheetByName('回答').getLastRow(),6);
setup();assert.equal(last.getSheetByName('回答').getLastRow(),6,'setup must not delete existing answers');
assert.equal(last.getSheetByName('ダッシュボード').getCharts().length,2);
console.log('SERVER PASS: setup repeated twice, answered 4 routes, dedup 4, invalid 5, Q8 branch, re-setup, dashboards and 39-column schema; rejected=',rejected);

// Public POST endpoint and receipt UI checks; no user-submitted HTML reflected.
const doPost=vm.runInContext('doPost',ctx);
const goodPost={version:'2026.10-r9',requestId:'post-route-unique-123456789',answers:sample(3)};
const postReceipt=doPost({parameter:{payload:JSON.stringify(goodPost)}});
assert(postReceipt.html.includes('回答を受け付けました'));
assert(postReceipt.html.includes('受付番号'));
assert.equal(last.getSheetByName('回答').getLastRow(),7);
const dup=doPost({parameter:{payload:JSON.stringify(goodPost)}});
assert(dup.html.includes('回答を受け付けました'));
assert.equal(last.getSheetByName('回答').getLastRow(),7,'POST retry must not create a duplicate');
const missing=doPost({parameter:{payload:'not JSON'}});
assert(missing.html.includes('回答を保存できませんでした'));
assert(!missing.html.includes('not JSON'),'No user payload echoed');
console.log('POST PASS: saved receipt, retry dedup, malformed input masked');
