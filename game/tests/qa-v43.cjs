// 전편 자동 플레이 검사 (v4.3, 무대 위 대화형 실습).
// 사용: node tests/qa-v43.cjs            — 1280×800에서 전편 진행, 오류·흐름 검증
//       W=760 H=360 OUT=tests/audit node tests/qa-v43.cjs — 휴대폰 가로에서 진행하며 클릭마다 스크린샷과 레이아웃 문제 기록
const {chromium}=require('playwright');
const {pathToFileURL}=require('url'),path=require('path'),fs=require('fs'),assert=require('assert');
(async()=>{
 const W=Number(process.env.W||1280),H=Number(process.env.H||800),OUT=process.env.OUT?path.resolve(process.env.OUT):null;if(OUT)fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});const page=await browser.newPage({viewport:{width:W,height:H}});page.setDefaultTimeout(8000);
 const errors=[],network=[],issues=[];let seq=0;page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
 const audit=async label=>{if(!OUT)return;seq++;const tag=String(seq).padStart(3,'0')+'-'+label.replace(/[^\w가-힣-]/g,'_').slice(0,40);
  const found=await page.evaluate(()=>{const out=[];const r=e=>e.getBoundingClientRect();
   for(const b of document.querySelectorAll('#game button')){const bb=r(b);if(!bb.width||!bb.height)continue;const txt=(b.textContent||'').trim();if(txt.length<=10&&!b.closest('#gameNav')&&bb.height>60)out.push('button-wrapped:'+txt);if(bb.right>innerWidth+1||bb.bottom>innerHeight+1)out.push('button-offscreen:'+txt);}
   const d=document.getElementById('dialogueBox');if(d&&!d.hidden&&d.scrollHeight>d.clientHeight+2)out.push('dialogue-scroll:'+(d.scrollHeight-d.clientHeight));
   const c=document.getElementById('storyChoices');if(c&&!c.hidden&&c.scrollHeight>c.clientHeight+2)out.push('choices-scroll:'+(c.scrollHeight-c.clientHeight));
   if(document.querySelector('dialog[open]'))out.push('dialog-open');if(document.documentElement.scrollWidth>innerWidth+1)out.push('page-hscroll');return out;});
  if(found.length)issues.push({tag,found});await page.screenshot({path:path.join(OUT,tag+'.png')});};
 const click=async(sel,label)=>{await page.locator(sel+':visible').last().click();await page.waitForTimeout(60);await audit(label||sel);};
 const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(S)));
 await page.goto(pathToFileURL(path.join(__dirname,'../dist-v4/index.html')).href);await page.waitForTimeout(200);await audit('title');
 assert.equal(await page.locator('input,textarea,select').count(),0);
 await click('button[data-action="setup"]','setup');assert.equal(await page.inputValue('#nickname'),'재영');await click('button[data-action="begin"]','begin');
 assert.equal((await state()).name,'재영');
 const done=[],rapportLog=[];let wrongOnce=false;
 for(let guard=0;guard<900;guard++){
  const v=await page.evaluate(()=>({line:!!document.querySelector('#dialogueBox [data-action="line-next"]'),next:!!document.querySelector('#dialogueBox [data-action="next"]'),start:document.querySelector('#dialogueBox [data-action="task-start"]')?.dataset.id,choice:document.querySelectorAll('#storyChoices [data-action="story-choice"]').length,answer:document.querySelectorAll('#storyChoices [data-action="task-answer"]').length,cont:!!document.querySelector('[data-action="task-continue"]'),chapterEnd:!!document.querySelector('[data-action="chapter-end"]'),reward:!!document.querySelector('[data-action="reward-next"]'),gift:document.querySelectorAll('[data-action="gift-pick"]').length,ending:!!document.querySelector('[data-action="ending"]'),endingTitle:!!document.querySelector('[data-action="ending-title"]'),task:activeTaskId(),phase:activeTaskId()?S.tasks[activeTaskId()].phase:'',dialog:!!document.querySelector('dialog[open]')}));
  assert(!v.dialog,'a dialog opened during the story: '+JSON.stringify(v));
  if(v.line){await click('#dialogueBox [data-action="line-next"]','line');continue;}
  if(v.answer){const info=await page.evaluate(()=>{const id=activeTaskId(),t=S.tasks[id],st=taskSteps(id)[t.step];return {id,step:t.step,answer:st.answer,friend:TASK_FRIEND[id],before:S.rewards?.rapport?.[TASK_FRIEND[id]]||0};});
   let pick=info.answer??0;if(!wrongOnce&&info.answer!==null&&info.answer!==undefined){pick=(info.answer+1)%2;wrongOnce=true;}
   await click(`#storyChoices [data-action="task-answer"][data-val="${pick}"]`,`answer-${info.id}-${info.step}`);
   const after=await page.evaluate(f=>S.rewards?.rapport?.[f]||0,info.friend);rapportLog.push({task:info.id,step:info.step,correct:pick===info.answer,before:info.before,after});
   if(info.answer!==null&&info.answer!==undefined){if(pick===info.answer)assert(after===Math.min(12,info.before+1),'rapport +1 expected');else assert(after===Math.max(0,info.before-1),'rapport -1 expected');}
   continue;}
  if(v.cont){const t=v.task;await click('[data-action="task-continue"]','continue');const s=await state();if(t&&s.tasks[t]?.done&&!done.includes(t))done.push(t);continue;}
  if(v.start){await click('#dialogueBox [data-action="task-start"]','start-'+v.start);continue;}
  if(v.choice){await click('#storyChoices [data-action="story-choice"]','story-choice');continue;}
  if(v.gift){const id=await page.evaluate(()=>document.querySelector('[data-action="gift-pick"]').dataset.id);await click(`[data-action="gift-pick"][data-id="${id}"]`,'gift');continue;}
  if(v.reward){await click('[data-action="reward-next"]','reward-next');continue;}
  if(v.chapterEnd){await click('[data-action="chapter-end"]','chapter-end');continue;}
  if(v.ending){await click('[data-action="ending"]','ending');continue;}
  if(v.endingTitle){break;}
  if(v.next){await click('#dialogueBox [data-action="next"]','next');continue;}
  throw new Error('stuck: '+JSON.stringify(v));
 }
 const final=await state();
 assert.equal(done.length,13,'tasks done: '+done.join(','));assert(final.finished);assert.equal(final.badges.length,3);assert.equal(Object.keys(final.rewards.gifts).length,3);assert(final.endingFlow);
 assert(rapportLog.some(r=>!r.correct),'one wrong answer should have been tried');
 // review record is small and opens as info
 await page.evaluate(()=>{delete S.endingFlow;S.chapter='chapter1';S.scene=STORY.chapter1.findIndex(s=>s.task==='audit');renderStory();});await page.waitForTimeout(100);
 while(await page.locator('#dialogueBox [data-action="line-next"]').count())await click('#dialogueBox [data-action="line-next"]','line');
 await click('[data-action="review-task"]','review');assert(await page.locator('#infoDialog').evaluate(d=>d.open));assert((await page.locator('#infoDialog').innerText()).includes('내 답'));await click('#infoDialog [data-action="close-info"]','close-review');
 // reload keeps the finished state; practice does not change rapport or tasks
 await page.reload();await page.waitForTimeout(200);await click('[data-action="continue"]','continue');
 const before=await state();await click('[data-action="menu"]','menu');await click('[data-action="practice"]','practice');await click('[data-action="practice-task"][data-id="shortage"]','practice-shortage');
 for(let i=0;i<40;i++){const v=await page.evaluate(()=>({line:!!document.querySelector('[data-action="line-next"]'),answer:document.querySelectorAll('[data-action="task-answer"]').length,cont:!!document.querySelector('[data-action="task-continue"]'),practice:S.practiceTask}));if(!v.practice)break;if(v.line){await click('[data-action="line-next"]','p-line');continue;}if(v.answer){await click('[data-action="task-answer"][data-val="0"]','p-answer');continue;}if(v.cont){await click('[data-action="task-continue"]','p-continue');continue;}break;}
 const afterP=await state();assert.deepEqual(afterP.rewards.rapport,before.rewards.rapport,'practice changed rapport');assert.deepEqual(afterP.tasks.shortage.answers,before.tasks.shortage.answers,'practice changed task record');assert(!afterP.practiceTask);
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 if(OUT)fs.writeFileSync(path.join(OUT,'issues.json'),JSON.stringify(issues,null,1));
 fs.writeFileSync(path.join(__dirname,'qa-v43-results.json'),JSON.stringify({viewport:[W,H],done,rapport:final.rewards.rapport,wrongTried:rapportLog.filter(r=>!r.correct).length,issues:issues.length,errors},null,2));
 await browser.close();console.log('PASS',done.length,'tasks · issues',issues.length);
})().catch(e=>{console.error(e);process.exit(1)});
