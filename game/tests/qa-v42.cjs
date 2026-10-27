const {chromium}=require('playwright');
const {pathToFileURL}=require('url'),path=require('path'),fs=require('fs'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});const page=await browser.newPage({viewport:{width:1366,height:768}});page.setDefaultTimeout(8000);
 const errors=[],network=[],done=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
 const click=async(a,d={})=>{let s=`button[data-action="${a}"]`;for(const[k,v]of Object.entries(d))s+=`[data-${k}="${v}"]`;await page.locator(s+':visible').last().click();};
 const pick=async(k,v)=>click('task-pick',{key:k,val:v});const picks=async o=>{for(const[k,v]of Object.entries(o))await pick(k,v);};const shot=async n=>page.screenshot({path:path.join(__dirname,'v42-'+n+'.png')});
 const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(S)));
 await page.goto(pathToFileURL(path.join(__dirname,'../dist-v4/index.html')).href);
 await shot('title');assert.equal(await page.locator('input,textarea,select').count(),0);
 for(const [w,h]of [[1920,1080],[1003,631],[760,360],[390,630]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(100);await shot(`title-${w}`);const b=await page.locator('.stage-actor').boundingBox(),a=await page.locator('#actors').boundingBox();assert(b.y>=a.y-1,`head crop ${w}`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.setViewportSize({width:1366,height:768});await click('setup');await page.fill('#nickname','한결');await click('begin');await shot('story');
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
 const photoPromise=page.waitForEvent('download');await click('keepsake');const photo=await photoPromise;await photo.saveAs(path.join(__dirname,'v42-keepsake.png'));await click('download');await click('close-info');await page.reload();await click('continue');assert((await state()).finished);
 await click('menu');await click('practice');await click('practice-task',{id:'hours'});await click('task-query');await click('task-number-open',{val:0});await click('task-hours-value',{record:0,val:0});assert.equal((await state()).tasks.hours.values[0],0);await click('close-task');await click('exit-practice');assert.deepEqual((await state()).stats,final.stats);assert.deepEqual((await state()).tasks,final.tasks);
 await click('menu');await click('large');await click('close-info');await page.setViewportSize({width:760,height:360});await shot('small-large');assert.equal(await page.locator('input,textarea,select').count(),0);
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(__dirname,'qa-v42-results.json'),JSON.stringify({done,stats:final.stats,badges:final.badges,errors,network,finished:final.finished},null,2));await browser.close();console.log('PASS',done.length);
})().catch(e=>{console.error(e);process.exit(1)});
