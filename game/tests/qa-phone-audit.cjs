// 휴대폰 화면 점검용: 전편을 자동 진행하며 클릭마다 스크린샷과 레이아웃 문제(버튼 줄바꿈, 표 가로 스크롤, 대화 상자 넘침)를 기록합니다.
// 사용: W=760 H=360 OUT=tests/audit node tests/qa-phone-audit.cjs
const {chromium}=require('playwright');
const {pathToFileURL}=require('url'),path=require('path'),fs=require('fs'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});const page=await browser.newPage({viewport:{width:Number(process.env.W||760),height:Number(process.env.H||360)}});page.setDefaultTimeout(8000);
 const errors=[],network=[],done=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
 const click=async(a,d={})=>{let s=`button[data-action="${a}"]`;for(const[k,v]of Object.entries(d))s+=`[data-${k}="${v}"]`;await page.locator(s+':visible').last().click();await page.waitForTimeout(120);await audit(a+(d.id?'-'+d.id:'')+(d.val!==undefined?'-'+d.val:''));};
 const audit=async label=>{SEQ++;const tag=String(SEQ).padStart(3,'0')+'-'+label.replace(/[^\w-]/g,'_');
  const found=await page.evaluate(()=>{const out=[];const vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return null;const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none')return null;return r;};
   const inDialog=!!document.querySelector('dialog[open]');const root=inDialog?document.querySelector('dialog[open]'):document.getElementById('game');
   for(const b of root.querySelectorAll('button')){const r=vis(b);if(!r)continue;const txt=(b.textContent||'').trim();const lh=parseFloat(getComputedStyle(b).lineHeight)||20;
    if(txt.length<=10&&r.height>lh*2.4+10)out.push({type:'button-wrapped',text:txt.slice(0,30),h:Math.round(r.height)});
    if(r.right>innerWidth+1||r.left<-1)out.push({type:'button-offscreen-x',text:txt.slice(0,30)});
    if(!inDialog&&(r.bottom>innerHeight+1))out.push({type:'button-offscreen-y',text:txt.slice(0,30)});}
   if(document.documentElement.scrollWidth>innerWidth+1)out.push({type:'page-hscroll'});
   const d=document.getElementById('dialogueBox');if(d&&!d.hidden&&d.scrollHeight>d.clientHeight+2)out.push({type:'dialogue-scroll',text:(d.querySelector('.dialogue-text')?.textContent||'').slice(0,40),over:d.scrollHeight-d.clientHeight});
   const c=document.getElementById('storyChoices');if(c&&!c.hidden&&c.scrollHeight>c.clientHeight+2)out.push({type:'choices-scroll',over:c.scrollHeight-c.clientHeight,n:c.children.length});
   const act=document.getElementById('actors');if(act){const ar=act.getBoundingClientRect();for(const a of act.querySelectorAll('.stage-actor')){const r=a.getBoundingClientRect();if(r.top<ar.top-1)out.push({type:'actor-head-crop',who:a.dataset.person,by:Math.round(ar.top-r.top)});}}
   const wb=document.querySelector('dialog[open] .work-body');if(wb){for(const t of wb.querySelectorAll('.table-scroll, .data-table')){if(t.scrollWidth>t.clientWidth+2)out.push({type:'table-hscroll',over:t.scrollWidth-t.clientWidth});}
    for(const el of wb.querySelectorAll('td,th,.choice-card,.segment button')){const r=vis(el);if(!r)continue;if(r.width<40&&(el.textContent||'').trim().length>2)out.push({type:'narrow-cell',text:(el.textContent||'').trim().slice(0,20),w:Math.round(r.width)});}}
   return out;});
  if(found.length)ISSUES.push({seq:tag,issues:found});
  await page.screenshot({path:path.join(OUT,tag+'.png')});};
 const pick=async(k,v)=>click('task-pick',{key:k,val:v});const picks=async o=>{for(const[k,v]of Object.entries(o))await pick(k,v);};const OUT=process.env.OUT||path.join(__dirname,'audit');fs.mkdirSync(OUT,{recursive:true});let SEQ=0;const ISSUES=[];const shot=async n=>page.screenshot({path:path.join(OUT,'s-'+n+'.png')});
 const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(S)));
 await page.goto(pathToFileURL(path.join(__dirname,'../dist-v4/index.html')).href);
 await shot('title');assert.equal(await page.locator('input,textarea,select').count(),0);
 for(const [w,h]of [[1920,1080],[1003,631],[760,360],[390,630]]){}
 await click('setup');await page.fill('#nickname','한결');await click('begin');await shot('story');
 async function solve(id){
  console.log('TASK',id);await click('open-task',{id});assert.equal(await page.locator('input,textarea,select').count(),0);
  if(id==='audit'){await click('task-submit');assert(await page.locator('.field-error').count()>0);await picks({owner0:0,owner1:1,owner2:2,owner3:2,mathPeriod:0,englishPeriod:1,next:0});await click('task-submit');}
  if(id==='prepare'){for(let i=0;i<3;i++)await click('task-prepare-step',{val:i});await pick('plan',1);await click('task-submit');}
  if(id==='routes'){
   await picks({base:48,attendance:32,achievement:40});await click('task-route-criteria');
   const routes=[0,1,2,0,2,0,1,2];for(let i=0;i<8;i++){await click('task-route-student',{val:i});await click('task-pick',{key:'route',student:i,val:i===0?1:routes[i]});await click('task-pick',{key:'reason',student:i,val:i===1?1:0});}
   await click('task-route-review');assert(!(await page.locator('#workBody').innerText()).includes('경로 7/8'));await click('task-route-submit');assert.equal((await state()).tasks.routes.report.filter(r=>r.route&&r.reason).length,6);
   await click('task-route-retry');await click('task-pick',{key:'route',student:0,val:0});await click('task-route-student',{val:1});await click('task-pick',{key:'reason',student:1,val:0});await click('task-route-review');await click('task-route-submit');await click('task-route-confirm');await shot('routes');
  }
  if(id==='roster'){await picks({row0:1,row1:1,row2:1,row3:0,row4:0,row5:1,missing:5,duplicate:0});await click('task-submit');}
  if(id==='exception'||id==='parent'){const answers=await page.evaluate(id=>TASK_CALLS[id].map(x=>x.good),id);await click('task-call-choice',{val:(answers[0]+1)%3});assert.equal((await state()).tasks[id].step||0,0);for(const val of answers)await click('task-call-choice',{val});await shot(id);}
  if(id==='import'){for(let c=0;c<3;c++){await click('task-course',{val:c});await click('task-import-load');}}
  if(id==='shortage'){await picks({total:9,raon:0,nine:6,twelve:8});await click('task-submit');}
  if(id==='evidence'){await picks({actual0:6,actual1:5,reason0:0,reason1:0});await click('task-submit');}
  if(id==='hours'){
   for(let c=0;c<3;c++){await click('task-course',{val:c});await click('task-query');for(const i of [[0,1],[2,4],[3]][c]){await click('task-number-open',{val:i});await click('task-hours-value',{record:i,val:i===1?5:i===3?9:6});}await click('task-hours-save');}await shot('hours');
  }
  if(id==='zero'){for(let i=0;i<2;i++){await pick('zeroChoice',0);await click('task-zero-next');}assert((await page.locator('#workBody').innerText()).includes('학생부 해당 과목까지 반영 확인'));}
  if(id==='finalAudit'){for(const[row,col]of [[0,3],[1,1],[1,2],[1,3]])await click('task-audit-cell',{row,col});await picks({mathOwner:0,englishOwner:0});await click('task-submit');}
  if(id==='flow'){for(const val of [0,0,1,2,2]){await pick('role',val);await click('task-flow-step');}assert.equal((await state()).tasks.flow.count,5);assert(!(await state()).tasks.flow.done);await shot('pending');await click('task-flow-nextday');await pick('role',2);await click('task-flow-step');}
  if(id==='schoolMemo'){for(let i=0;i<3;i++)await picks({['data'+i]:0,['who'+i]:0,['when'+i]:0});await click('task-memo-save');}
  assert((await state()).tasks[id].done,id+' unfinished');done.push(id);await click('task-return');
 }
 for(let guard=0;guard<180;guard++){
  const s=await state(),c=await page.evaluate(()=>currentScene());
  if(!s.pending&&c.kind==='ending'){await click('ending');break;}
  if(!s.pending&&c.kind==='task'&&!s.tasks[c.task]?.done){await solve(c.task);continue;}
  if(!s.pending&&c.kind==='choice'&&s.choices[c.id]===undefined){await shot('choice');await click('story-choice',{index:0});continue;}
  if(!s.pending&&c.kind==='chapterEnd'){await click('chapter-end');await click('gift-pick',{id:{chapter1:'plant',chapter2:'tea',chapter3:'frame'}[s.chapter]});await shot('reward-'+s.chapter);await click('next-chapter');continue;}
  await click('next');
 }
 const final=await state();assert.equal(Object.keys(final.rewards.gifts).length,3);assert(final.rewards.rapport['03']>0);assert(final.finished);assert.equal(done.length,13);assert.equal(final.badges.length,3);assert(final.flags.together_plan);assert(final.stats.every(x=>x<100));await shot('ending');
 const photoPromise=page.waitForEvent('download');await click('keepsake');const photo=await photoPromise;await photo.saveAs(path.join(OUT,'keepsake.png'));await click('download');await click('close-info');await page.reload();await click('continue');assert((await state()).finished);
 await click('menu');await click('practice');await click('practice-task',{id:'hours'});await click('task-query');await click('task-number-open',{val:0});await click('task-hours-value',{record:0,val:0});assert.equal((await state()).tasks.hours.values[0],0);await click('close-task');await click('exit-practice');assert.deepEqual((await state()).stats,final.stats);assert.deepEqual((await state()).tasks,final.tasks);
 await click('menu');await click('large');await click('close-info');await shot('small-large');assert.equal(await page.locator('input,textarea,select').count(),0);
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(OUT,'issues.json'),JSON.stringify(ISSUES,null,2));console.log('ISSUES',ISSUES.length);await browser.close();console.log('PASS',done.length);
})().catch(e=>{console.error(e);process.exit(1)});
