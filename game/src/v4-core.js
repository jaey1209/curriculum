'use strict';
const SAVE_KEY='jaeyoung-growth-v4.1';
const STAT_NAMES=['기준 이해','기록 확인','소통'];
const ORDER=['prologue','chapter1','chapter2','chapter3','epilogue'];
const NAMES=['하늘','새봄','다정','한결','가람','이음','온유','솔빛','보람','지음','여름','푸름'];
const TASK_TITLES={audit:'출결 기록 대조',prepare:'학기별 과목출결 마감',routes:'학생 8명 판정',roster:'수기 명단 검토',exception:'다온 아버지의 예외 문의',import:'모의 나이스 대상자 확인',parent:'나래 어머니와 통화',shortage:'운영 계획 대조',evidence:'참여 기록과 초안 대조',hours:'참여시수와 이수관리',zero:'대상자 0명 강의실',finalAudit:'반영 현황 대조',flow:'역할별 반영과 마감'};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function icon(name){return (ICONS[name]||ICONS['book-open']||'').replace('<svg','<svg class="icon" aria-hidden="true"');}
function btn(label,action,data={},cls='primary'){return `<button class="${esc(cls)}" data-action="${esc(action)}" ${Object.entries(data).map(([k,v])=>`data-${k.replace(/[A-Z]/g,x=>'-'+x.toLowerCase())}="${esc(v)}"`).join(' ')}>${label}</button>`;}
function fresh(){return {version:4,started:false,hero:'02',name:'하늘',chapter:'prologue',scene:0,view:'title',tasks:{},stats:[10,10,10],awarded:{},choices:{},flags:{},cards:[],badges:[],history:[],large:false,pending:null,finished:false};}
let S=fresh(),activeTask=null,practiceBackup=null,infoPage='',lastActor=null,toastTimer;
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(practiceBackup||S));}catch(e){toast('이 브라우저에서는 저장을 사용할 수 없어요. 성장 기록을 내려받아 주세요.');}}
function readSave(){try{const x=JSON.parse(localStorage.getItem(SAVE_KEY));if(x?.version===4&&ORDER.includes(x.chapter)&&Array.isArray(x.stats))return {...fresh(),...x};}catch(e){}return null;}
function displayName(id){return id==='player'?S.name+' 선생님':DISPLAY_NAMES[id]||PEOPLE[id]?.name||'학생';}
function pid(id){return id==='player'?S.hero:id;}
const STUDENT_IDS={나래:'11',라온:'12',다온:'13',마루:'14',가온:'15',누리:'16',다올:'17',여울:'18'};
function studentFace(name){return `<span class="student-face">${portrait(STUDENT_IDS[name],2,'face')}</span>`;}
function studentLabel(name){return `<span class="student-label">${studentFace(name)}<b>${esc(name)}</b></span>`;}
function currentScene(){return STORY[S.chapter]?.[S.scene]||STORY.prologue[0];}
function conditional(s){return {...s,text:s.conditionText?(S.flags[s.conditionText.flag]?s.conditionText.yes:s.conditionText.no):s.text,expression:s.conditionExpression?(S.flags[s.conditionExpression.flag]?s.conditionExpression.yes:s.conditionExpression.no):s.expression};}
function spriteData(id,ex=0,crop='bust'){
 id=pid(id);const p=PEOPLE[id];if(!p)return null;let key=p.key,index=Math.min(2,ex),extra=false;
 if(p.student){index=ex===5?2:ex===2?1:0;} // student atlases: 0 calm, 1 smile, 2 laugh
 else if(id==='03'&&ex===2&&crop!=='full'){key='mathGentle';index=0;extra=true;}
 else if(ex>=3&&p.expressionKey){key=p.expressionKey;index=ex-3;extra=true;}
 let frame=FRAMES[key];if(!frame)return null;
 let [x,y,x2,y2]=frame.boxes[index]||frame.boxes[0];let w=x2-x,h=y2-y;
 // Atlas bounds use left,top,right,bottom. Preserve the source aspect ratio. crop 'stage' keeps the whole frame (paintActors crops by figure bounds).
 const upper=p.student||extra;
 // Students share one face framing (manifest faceBox, relative to the frame box) so the 8 faces render at the same size.
 if(crop==='face'&&Array.isArray(p.faceBox)){const [l,t,r2,b2]=p.faceBox;return {key,x:x+l,y:y+t,w:r2-l,h:b2-t,sw:frame.size[0],sh:frame.size[1]};}
 if(p.headshot)return {key,x,y,w,h,sw:frame.size[0],sh:frame.size[1]};
 if(crop==='face') {let hh=h*(upper?.43:.245);let ww=Math.min(w,hh*.93);x+=(w-ww)/2;w=ww;h=hh;}
 else if(crop==='bust'&&!upper)h*=.58;
 return {key,x,y,w,h,sw:frame.size[0],sh:frame.size[1]};
}
function portrait(id,ex=0,crop='face'){
 const d=spriteData(id,ex,crop);if(!d)return `<div class="portrait student-placeholder">${icon('user-round')}<span>${esc(displayName(id))}</span></div>`;
 return `<div class="portrait" data-person="${esc(id)}" data-expression="${ex}" data-crop="${crop}" style="aspect-ratio:${d.w}/${d.h}"><span class="sprite" style="position:absolute;inset:0;transform:none"><img alt="${esc(displayName(id))}" src="${ASSETS[d.key]}" style="width:${d.sw/d.w*100}%;height:${d.sh/d.h*100}%;left:${-d.x/d.w*100}%;top:${-d.y/d.h*100}%"></span></div>`;
}
function paintActors(){
 const box=$('#actors');if(!box)return;const view=$('#game').dataset.view;
 let actors=[];if(view==='title')actors=[{id:'03',ex:2,pos:'right'}];
 else if(view==='setup')actors=[];
 else {const c=S.pending||conditional(currentScene());actors=[{id:'player',ex:c.who==='player'?c.expression:0,pos:c.who==='player'?'center':'left'}];if(c.who!=='player')actors.push({id:c.who,ex:c.expression,pos:'right'});}
 const key=JSON.stringify(actors);if(lastActor!==key){box.innerHTML=actors.map(a=>`<div class="stage-actor ${a.pos==='left'?'is-listening':''}" data-position="${a.pos}" data-person="${a.id}" data-expression="${a.ex}"></div>`).join('');lastActor=key;}
 const W=box.clientWidth,H=box.clientHeight;if(!W||!H)return;
 // Every actor is drawn to the same centimetre scale: a 190cm figure would fill 95% of the stage (92% on the title).
 // Each sheet's `figure` is the drawn body's top/bottom and `figureFrac` the share of the body it shows
 // (1 = full body, .6 = hair to upper thigh), so bust sheets and students no longer blow up to full height.
 const REF_CM=190,pxPerCm=(view==='title'?H*.92:H*.95)/REF_CM,portraitView=W<H*.9;
 const maxW=view==='title'?W*(portraitView?.72:.46):W*(actors.length===2?.46:.70);
 const items=[];let k=1;
 for(const el of box.children){const id=el.dataset.person,ex=Number(el.dataset.expression);const d=spriteData(id,ex,'stage');
  if(!d){el.innerHTML=portrait(id,ex);el.style.width='160px';el.style.height='240px';continue;}
  const fr=FRAMES[d.key],p=PEOPLE[pid(id)],cm=p?.heightCm||(p?.student?165:170);const top=fr.figure?fr.figure[0]:d.y,bottom=fr.figure?fr.figure[1]:d.y+d.h,frac=fr.figureFrac||1;
  // Title screen: the mentor's smile sheet is a bust, so simply fit it to the stage as before.
  const s=view==='title'?Math.min(H*.92/(bottom-top),maxW/d.w):pxPerCm*cm*frac/(bottom-top);k=Math.min(k,maxW/(d.w*s));items.push({el,d,top,bottom,frac,cm,s});}
 for(const it of items){const {el,d,top,bottom,frac,cm}=it,scale=it.s*k,hPx=(bottom-top)*scale;
  el.style.width=d.w*scale+'px';el.style.height=hPx+'px';
  // A partial figure stands with its unseen legs below the floor: its cut edge sits (1-frac) of the height up,
  // then is lowered to the dialogue box top so the edge stays hidden. On the title there is no box, so it rests on the floor.
  let lift=frac<1&&view!=='title'?Math.round((1-frac)*cm*pxPerCm*k):0;
  if(lift){const dlg=$('#dialogueBox');if(dlg&&!dlg.hidden){const boxTop=box.getBoundingClientRect().bottom-dlg.getBoundingClientRect().top;lift=Math.min(lift,Math.round(boxTop+4));}lift=Math.max(0,lift);}
  el.style.bottom=lift?lift+'px':'';
  el.innerHTML=`<img src="${ASSETS[d.key]}" alt="" style="width:${d.sw*scale}px;height:${d.sh*scale}px;left:${-d.x*scale}px;top:${-top*scale}px">`;
 }
}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function setView(view){S.view=view;$('#game').dataset.view=view;$('#titleScreen').hidden=view!=='title';$('#setupScreen').hidden=view!=='setup';$('#dialogueBox').hidden=!['story','ending'].includes(view);$('#storyChoices').hidden=true;$('#eventNotice').textContent='';lastActor=null;}
function setBackground(key){$('#sceneBackground').style.backgroundImage=`url("${ASSETS[key]||ASSETS.office}")`;}
function renderHeader(){
 const ch=CHAPTERS.find(x=>x.id===S.chapter),scene=currentScene();
 $('#chapterTime').innerHTML=S.view==='title'||S.view==='setup'?'재영고등학교 <small>최성보 성장일지</small>':`학기말 업무 일지 · ${ch?.label|| (S.chapter==='epilogue'?'에필로그':'프롤로그')}<small>${esc(scene.time)}</small>`;
 $('#identity').innerHTML=S.started?`${esc(S.name)} <small>${practiceBackup?'연습 중':'Lv. '+(1+S.badges.length)}</small>`:'';
 $('#growthStrip').innerHTML=STAT_NAMES.map((n,i)=>`<div>${n}<b>${S.stats[i]}</b><div class="bar"><span style="width:${Math.min(100,S.stats[i])}%"></span></div></div>`).join('');
 $('#gameNav').innerHTML=[['book-open','업무 일지','journal'],['message-circle','대화 기록','history'],['sprout','성장 기록','growth']].map(([ic,n,a])=>btn(icon(ic)+`<span>${n}</span>`,a,{},'')).join('');
 document.documentElement.classList.toggle('large-text',S.large);document.documentElement.dataset.font=S.large?'large':'normal';
 syncFullscreen();
}
function renderTitle(){setView('title');setBackground('school');$('#sceneLabel').textContent='';
 $('#titleScreen').innerHTML=`<div class="title-copy"><span class="eyebrow">재영고등학교</span><h1>나의 최성보<br>성장일지</h1><p>낯선 업무 앞에서도, 함께라면.<br>선배 교사 박수학과 한 학기의 끝을 걸어요.</p></div><div class="title-actions">${btn('처음부터 시작','setup')}${S.started?btn('이어하기','continue',{},'secondary'):''}</div><p class="title-meta">2026학년도 · 가상의 학교에서 배우는 업무 이야기</p><div class="maker-credit">NOWZERO · Developed by Jae-Young Lee<br>© 2026 Jae-Young Lee. All rights reserved.</div>`;renderHeader();requestAnimationFrame(paintActors);}
let namePage=0,setupHero='02',setupName='하늘';
function renderSetup(){setView('setup');setBackground('school');$('#setupScreen').innerHTML=`<div class="setup-panel"><h2>재영고에 오신 걸 환영해요.</h2><p>함께 학기말을 보낼 나의 모습과 호칭을 골라 주세요.</p><div class="setup-grid"><div class="avatar-grid">${['01','02'].map((id,i)=>btn(portrait(id,2,'bust')+`<b>${i?'여자':'남자'} 주인공</b>`,'hero',{id},'avatar-choice '+(id===setupHero?'is-selected':''))).join('')}</div><div><h3>선생님을 어떻게 부를까요?</h3><label for="nickname">닉네임</label><input id="nickname" type="text" maxlength="12" autocomplete="off" placeholder="닉네임을 입력해 주세요" value="${esc(setupName)}"><p class="helper-text">12자 이내로 입력해 주세요.</p><div class="setup-actions">${btn('돌아가기','title',{},'secondary')}${btn('출근하기','begin')}</div></div></div></div>`;renderHeader();requestAnimationFrame(paintActors);}
function recordScene(s){const k=s.id+(S.pending?'-reply':'');if(S.history.some(x=>x.id===k))return;S.history.push({id:k,who:displayName(s.who),text:s.text,time:s.time||currentScene().time});}
function renderStory(){$('#setupScreen').innerHTML='';setView(S.finished?'ending':'story');const s=S.pending?{...currentScene(),...S.pending}:conditional(currentScene());setBackground(s.bg);$('#sceneLabel').textContent=s.place;recordScene(s);
 $('#dialogueBox .speaker-face').innerHTML=portrait(s.who,s.expression,'face');$('#dialogueBox .speaker-name').textContent=displayName(s.who);$('#dialogueBox .speaker-role').textContent=PERSON_ROLES[s.who]||'';
 $('#dialogueBox .dialogue-text').textContent=s.text;$('#dialogueBox .dialogue-text').classList.toggle('emphasis',s.id==='p03-beginning');
 let action='next',label='다음 이야기';
 if(!S.pending){
  if(s.kind==='task'){action=S.tasks[s.task]?.done?'next':'open-task';label=S.tasks[s.task]?.done?'확인한 결과로 이야기 계속':s.button;}
  else if(s.kind==='choice'){if(S.choices[s.id]!==undefined){label='다음 이야기';}else{action='';$('#storyChoices').hidden=false;$('#storyChoices').innerHTML=s.choices.map((c,i)=>btn(esc(c.text),'story-choice',{index:i},'choice-card')).join('');}}
  else if(s.kind==='chapterEnd'){action='chapter-end';label=s.button;}
  else if(s.kind==='ending'){action='ending';label=s.button;}
  else if(s.kind==='calendar'){label=s.button||'다음 날짜로';$('#eventNotice').innerHTML=`<strong>${icon('calendar-days')} 시간이 흘러</strong>${esc(s.time)}`;}
 }
 $('#dialogueBox .dialogue-actions').innerHTML=action?btn(esc(label),action,s.task?{id:s.task}:{},'primary'): '<span class="helper-text">위에서 이야기를 이어갈 말을 골라 주세요.</span>';
 if(!S.pending&&s.kind==='task'&&S.tasks[s.task]?.done)$('#dialogueBox .dialogue-actions').insertAdjacentHTML('afterbegin',btn('기록 다시 보기','open-task',{id:s.task},'secondary'));
 renderHeader();save();requestAnimationFrame(paintActors);
}
function advance(){if(S.pending){S.pending=null;S.scene++;}else{const c=currentScene();if(c.kind==='choice'&&S.choices[c.id]===undefined)return;if(c.kind==='task'&&!S.tasks[c.task]?.done)return;if(c.kind==='chapterEnd'||c.kind==='ending')return;S.scene++;}if(S.scene>=STORY[S.chapter].length){S.chapter=ORDER[Math.min(4,ORDER.indexOf(S.chapter)+1)];S.scene=0;}renderStory();}
function chooseStory(index){const s=currentScene(),c=s.choices?.[index];if(!c||S.choices[s.id]!==undefined)return;S.choices[s.id]=index;if(c.flag)S.flags[c.flag]=true;awardStat(c.stat,c.amount);(c.bonus||[]).forEach(x=>awardStat(x.stat,x.amount));S.history.push({id:s.id+'-choice',who:S.name+' 선생님',text:c.text,time:s.time});S.pending={id:s.id,who:c.who||'player',expression:c.expression??2,text:c.response};renderStory();}
function awardStat(index,amount){if(Number.isInteger(index)&&amount>0)S.stats[index]=Math.min(100,S.stats[index]+amount);}
function endChapter(){const c=CHAPTERS.find(x=>x.id===S.chapter);if(!c)return;if(!S.badges.includes(c.badge))S.badges.push(c.badge);save();openInfo('한 장을 마쳤어요',`<div class="chapter-reward">${icon('award')}<h2>${esc(c.badge)}</h2><p>동료의 질문에서 출발해 자료를 확인하고,<br>다음 업무까지 연결했습니다.</p><div class="segment">${STAT_NAMES.map((n,i)=>`<span class="status-chip">${n} ${S.stats[i]}</span>`).join('')}</div><p class="helper-text">근거를 펼치거나 다시 확인해도 감점은 없어요.</p>${btn('다음 장으로','next-chapter')}</div>`);renderHeader();}
function nextChapter(){closeInfo();S.chapter=ORDER[ORDER.indexOf(S.chapter)+1]||'epilogue';S.scene=0;renderStory();}
function showTask(id,config){
 const d=$('#workDialog'),body=$('#workBody');const same=activeTask===id&&d.open;const sy=body.scrollTop,sx=body.scrollLeft;const scrolls=same?Array.from(body.querySelectorAll('.table-scroll')).map(x=>x.scrollLeft):[];const opened=same?Array.from(body.querySelectorAll('details')).map(x=>x.open):[];
 activeTask=id;d.className='kind-'+(config.kind||'document');d.dataset.task=id;
 d.querySelector('.work-header').innerHTML=`<div class="work-face">${portrait(config.person||'03',4)}</div><div><h2 id="workTitle">${esc(config.title||TASK_TITLES[id])}</h2><small>${practiceBackup?'자유 실습 · 본편 기록은 그대로 유지됩니다':'확인한 뒤 제출해 주세요'}</small></div><div class="work-tools">${btn(icon('x')+' 닫기','close-task',{},'')}</div>`;
 body.innerHTML=config.body||'';$('#workFooter').innerHTML=config.footer||'';
 if(false&&config.help)body.insertAdjacentHTML('afterbegin',`<details class="task-help"><summary>관련 근거 펼치기</summary>${config.help}</details>`);
 if(!d.open)d.showModal();if(same){body.scrollTop=sy;body.scrollLeft=sx;body.querySelectorAll('.table-scroll').forEach((x,i)=>x.scrollLeft=scrolls[i]||0);body.querySelectorAll('details').forEach((x,i)=>{if(opened[i]!==undefined)x.open=opened[i];});}else body.scrollTop=0;
}
function taskFeedback(message,type='error',errors=[]){let el=$('#workFooter .task-feedback');if(!el){el=document.createElement('div');$('#workFooter').prepend(el);}el.className='task-feedback '+(type==='success'?'good':type);el.setAttribute('role','status');el.innerHTML=`${esc(message)}${errors?.length?`<ul>${errors.map(e=>`<li>${esc(typeof e==='string'?e:e.message||e.text||'확인해 주세요')}</li>`).join('')}</ul>`:''}`;}
function finishTask(id,payload={}){S.tasks[id]??={};S.tasks[id].done=true;if(!S.awarded[id]){S.awarded[id]=true;const index=typeof payload.skill==='number'?payload.skill:STAT_NAMES.indexOf(payload.skill);awardStat(index<0?1:index,6);if(payload.rule)S.cards.push({id,title:TASK_TITLES[id],text:payload.rule});}save();renderHeader();$('#workFooter').innerHTML='';taskFeedback(payload.message||'확인한 내용이 기록되었습니다.','good');$('#workFooter').insertAdjacentHTML('beforeend',`<div class="footer-actions">${btn(practiceBackup?'연습 목록으로':'완료','task-return')}</div>`);}
function openTask(id){if(!TASK_TITLES[id])return;activeTask=null;renderTask(id);}
function closeTask(){const d=$('#workDialog');if(d.open)d.close();activeTask=null;if(!practiceBackup)renderStory();}
function openInfo(title,html,footer=''){const d=$('#infoDialog');d.querySelector('.work-header').innerHTML=`<div><h2 id="infoTitle">${esc(title)}</h2></div><div class="work-tools">${btn(icon('x')+' 닫기','close-info',{},'')}</div>`;d.querySelector('.work-body').innerHTML=html;d.querySelector('.work-body').scrollTop=0;d.querySelector('.work-footer').innerHTML=footer||btn('닫기','close-info',{},'secondary');if(!d.open)d.showModal();}
function closeInfo(){if($('#infoDialog').open)$('#infoDialog').close();infoPage='';}
function openJournal(){infoPage='journal';openInfo('학기말 업무 일지',`<p class="task-intro">${practiceBackup?'연습 중입니다. 본편의 능력치와 진행은 유지됩니다.':'각 질문을 해결하며 다음 주의 이야기를 열어 보세요.'}</p>${CHAPTERS.map(c=>`<section class="journal-chapter"><h3>${c.label} · ${c.title}</h3><p class="helper-text">${c.subtitle}</p>${STORY[c.id].filter(s=>s.task).map(s=>`<div class="journal-row"><span>${esc(TASK_TITLES[s.task])}</span>${S.tasks[s.task]?.done?btn('확인 기록','review-task',{id:s.task},'secondary'): `<span class="status-chip">${currentScene().task===s.task?'진행 중':'이야기에서 만나요'}</span>`}</div>`).join('')}</section>`).join('')}`);}
const RULES=[
 ['적용 기준','2026학년도 고1·2 일반 사례입니다. 공통 과목은 학업성취율 40% 이상과 과목 출석 기준을 함께 확인합니다. 선택 과목에는 학업성취율 기준을 적용하지 않습니다.','운영 자료 PDF 7~9·20쪽 · 학점 이수 QnA 6·17쪽'],
 ['서로 다른 세 숫자','실제 시간표의 수업 수 51과 학점 이수 기준을 계산하는 3학점 × 16 = 48은 다른 숫자입니다. 이 사례의 출석 기준은 48 × 2/3 = 32회입니다.','2026 학점 이수 안내 자료 · 운영 자료 PDF 7~9쪽'],
 ['지원 경로','공통 과목 성취율 미도달은 보충지도, 출석만 미도달은 추가학습입니다. 두 기준 모두 미도달한 학생에게 두 경로를 각각 의무 부과하지 않습니다.','운영 자료 PDF 7~9·20쪽 · 학점 이수 QnA 17쪽'],
 ['운영과 실제 참여','학점당 3시수 이상 운영 기준을 확인합니다. 3학점이면 최소 9시수입니다. 실제 운영 9시수의 2/3는 6시수, 실제 12시수 운영의 2/3는 8시수입니다. 부족한 정규 출석 시간만큼만 운영하는 방식이 아닙니다.','운영 자료 PDF 9·20·23쪽 · 학점 이수 QnA 18·28쪽'],
 ['기록과 결과','확인된 실제 참여만 기록합니다. 같은 차시의 중복 증빙을 두 번 세지 않습니다. 원점수를 40점으로 임의 변경하지 않으며, 지도 이수와 학점 처리 기준을 구분해 안내합니다.','학점 이수 QnA 17~18쪽 · 학교교육과정 도움자료집 PDF 32쪽'],
 ['예외와 학교 확인','진료 사실만으로 예외를 확정하지 않습니다. 해당 기준, 객관적 자료, 필요한 심의와 학교장 결정 등을 확인합니다. 이 게임의 예외·최종 이수 결과는 준비된 가상 학교 자료입니다.','학점 이수 QnA 12쪽'],
 ['마감은 여러 단계','대상자 0명인 강의실도 학점반영과 마감 상태를 확인합니다. 저장, 학점반영, 교과 마감, 학생부 자료반영, 마감정보 저장, 승인요청과 결재 완료 확인은 각각 구분합니다.','운영 자료 PDF 22~23쪽 · 서울 자료 Ⅳ장 PDF 82~83·91~95쪽 · QnA 28~29쪽']
];
function openReferences(tab='rules'){infoPage='references';const tabs=`<div class="segment reference-tabs">${[['rules','기준'],['workflow','업무 흐름'],['verdict','내 판정표'],['scope','적용 범위']].map(([id,n])=>btn(n,'ref-tab',{tab:id},id===tab?'is-selected':'')).join('')}</div>`;let body='';
 if(tab==='rules')body=RULES.map(([h,t,s])=>`<details class="rule-card" open><summary>${h}</summary><p>${t}</p><small>근거: ${s}</small></details>`).join('');
 if(tab==='workflow')body=`<h3>공통 과목 보충지도 흐름</h3><ol class="workflow-list">${['학기별 과목 출석률 마감 확인','학기말 성적 전체마감·승인 확인','대상자 가져오기 · 예외 적용 근거 확인','실제 참여시수와 이수 결과 대조','학점반영 · 교과 마감','담임의 학생부 자료반영 확인','업무 마감정보 저장 · 승인요청','결재 완료 결과까지 다시 확인'].map(x=>`<li>${x}</li>`).join('')}</ol><h3>출석만 미도달한 추가학습 경로</h3><p>서울 자료 Ⅳ장 83쪽은 과목 출석률 마감 후 대상자 가져오기로 이어집니다. 도표에서 성적 마감이 별도로 표시되지 않는다고 학교의 성적 처리가 불필요하다는 의미는 아닙니다.</p><p class="helper-text">두 흐름은 서울 자료 Ⅳ장 82~83쪽에 근거합니다. 현재 경기 나이스의 세부 버튼 활성 조건을 단정하는 화면이 아닙니다.</p>`;
 if(tab==='verdict')body=typeof renderVerdictReview==='function'?renderVerdictReview():'<p>학생 판정 실습에서 작성한 내용이 여기에 남습니다.</p>';
 if(tab==='scope')body=`<h3>교육용 모의 화면</h3><p>실제 나이스와 연결되지 않습니다. 학생·성적·참여 기록·학교 확정 결과·날짜는 모두 가상입니다. 날짜는 학교별 실제 일정과 다릅니다.</p><p>제공된 2026학년도 경기도 자료를 우선 적용하고, 서울 자료는 Ⅰ·Ⅱ·Ⅳ장만 참고합니다. 이전 학년도 화면의 수치를 2026 계산에 사용하지 않습니다.</p><p>화면의 단계 안내는 연수의 진행을 위한 것입니다. 실제 나이스의 버튼 활성 조건, 권한, 성적 결재 시점과 과목전체마감 관계는 해당 시점의 경기 지침과 매뉴얼로 다시 확인해야 합니다.</p><p>학교별 심의·확정 절차, 후속 지원, 별도 적용 대상과 서식은 임의로 새 규칙을 만들지 않습니다. 최신 비공개 공문까지 검증한 행정 매뉴얼은 아닙니다.</p><p>자료 대조 기준: 제공된 2026 자료. 실제 업무 전 최신 공문·학교 계획을 확인하세요.</p>`;
 openInfo('업무 책상 · 기준과 근거',tabs+body);}
function showHistory(){infoPage='history';openInfo('대화 기록',S.history.length?S.history.map(h=>`<article class="history-line"><small>${esc(h.time)}</small><h3>${esc(h.who)}</h3><p>${esc(h.text).replace(/\n/g,'<br>')}</p></article>`).join(''):'<p>이야기를 시작하면 대화가 여기에 남아요.</p>');}
function endingTitle(){const top=Math.max(...S.stats),ix=S.stats.map((v,i)=>v===top?i:-1).filter(i=>i>=0);return {title:ix.map(i=>ENDING_TITLES[i]).join(' · '),note:ix.length>1?'공동으로 높은 역량을 함께 표시했어요.':STAT_NAMES[ix[0]]+' 역량이 가장 많이 자랐어요.'};}
function growthHTML(){const e=endingTitle();return `<h3>${S.finished?esc(e.title):'함께 확인하며 자라는 중'}</h3><p>${S.finished?esc(e.note):'빠른 정답보다, 기준과 기록을 확인한 과정이 남아요.'}</p><div class="growth-values">${STAT_NAMES.map((n,i)=>`<div><span>${n}</span><strong>${S.stats[i]}</strong></div>`).join('')}</div><h3>완료한 장</h3><div class="segment">${S.badges.map(x=>`<span class="status-chip done">${icon('award')} ${esc(x)}</span>`).join('')||'<p>첫 장의 이야기를 이어가 보세요.</p>'}</div><h3>모은 업무 카드 ${S.cards.length}장</h3>${S.cards.map(c=>`<details class="rule-card"><summary>${esc(c.title)}</summary><p>${esc(c.text)}</p></details>`).join('')}<div class="growth-actions">${btn(icon('download')+' 성장 기록 내려받기','download')}${S.finished?btn('자유 실습','practice',{},'secondary'):''}</div>`;}
function showGrowth(){infoPage='growth';openInfo('나의 성장 기록',growthHTML());}
function showEnding(){S.finished=true;save();renderStory();openInfo('학기말, 함께 완성한 성장일지',`<div class="ending-letter"><p>낯선 용어보다 학생들의 이름이 남은 한 학기.<br>기록을 확인하고, 동료에게 설명하고, 다음 지원을 함께 찾았습니다.</p></div>${growthHTML()}<div class="segment">${btn('처음 화면으로','ending-title',{},'secondary')}${btn('처음부터 다시','restart',{},'secondary')}</div>`);}
function menu(){infoPage='menu';openInfo('메뉴',`<div class="menu-grid">${btn(icon('maximize')+` 전체화면 ${document.fullscreenElement?'ON':'OFF'}`,'fullscreen',{},'secondary')}${btn(icon('type')+` 큰 글씨 ${S.large?'ON':'OFF'}`,'large',{},'secondary')}${btn('계속하기','close-info',{},'secondary')}${btn('처음 화면','menu-title',{},'secondary')}${btn('표정 살펴보기','expressions',{},'secondary')}${btn('자유 실습','practice',{},'secondary')}${btn('성장 기록 내려받기','download',{},'secondary')}${btn('새로 시작','restart',{},'secondary')}</div><p class="helper-text">진행은 이 브라우저에 자동 저장됩니다. 다른 기기와 자동 동기화하지 않습니다. 소리·개인정보 입력·제한 시간은 없어요.</p>`);}
function expressions(){openInfo('상황에 따라 달라지는 표정',`<div class="segment">${Object.keys(PEOPLE).filter(x=>Number(x)<=10).map(id=>btn(displayName(id),'expression-person',{id},'secondary')).join('')}</div><div id="expressionGrid"></div>`);expressionPerson('03');}
function expressionPerson(id){$('#expressionGrid').innerHTML=['차분','걱정','미소','놀람','집중','환한 웃음'].map((n,i)=>`<div>${portrait(id,i,'bust')}<b>${n}</b></div>`).join('');}
function practiceMenu(){if(!S.started){toast('캐릭터를 선택하고 이야기를 시작한 뒤 연습할 수 있어요.');return;}if(!practiceBackup)practiceBackup=JSON.parse(JSON.stringify(S));infoPage='practice';openInfo('자유 실습',`<p>본편의 기록과 능력치는 그대로 두고 다시 확인할 수 있어요.</p><div class="practice-list">${Object.entries(TASK_TITLES).map(([id,n])=>btn(n,'practice-task',{id},'secondary')).join('')}</div>`,btn('본편으로 돌아가기','exit-practice'));renderHeader();}
function beginPractice(id){closeInfo();S.tasks[id]={};S.awarded[id]=true;openTask(id);}
function exitPractice(){if(practiceBackup){S=practiceBackup;practiceBackup=null;}closeInfo();if($('#workDialog').open)$('#workDialog').close();activeTask=null;renderStory();save();}
function downloadRecord(){const c=endingTitle();let txt=`재영고등학교 · 최성보 성장일지\n${S.name} 선생님\n2026학년도 교육용 모의 실습 · 가상의 학생과 기록\n\n${STAT_NAMES.map((n,i)=>n+': '+S.stats[i]).join(' / ')}\n${S.finished?'엔딩: '+c.title:'진행 중'}\n\n`;
 txt+='완료한 업무\n'+Object.keys(TASK_TITLES).filter(id=>S.tasks[id]?.done).map(id=>'· '+TASK_TITLES[id]).join('\n');txt+='\n\n업무 카드\n'+S.cards.map(x=>x.title+'\n'+x.text).join('\n\n');
 const review=document.createElement('div');review.innerHTML=typeof renderVerdictReview==='function'?renderVerdictReview():'';txt+='\n\n학생 판정표\n'+review.textContent;
 txt+='\n\n선택과 대화\n'+S.history.map(h=>h.time+' · '+h.who+'\n'+h.text).join('\n\n');
 txt+='\n\n실제 업무는 최신 공문·학교 계획·나이스 매뉴얼로 확인하세요.';
 const url=URL.createObjectURL(new Blob(['\ufeff'+txt],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='재영고_나의_성장일지.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('성장 기록을 내려받았습니다.');}
function syncFullscreen(){const on=!!document.fullscreenElement;$('#fullscreenButton').textContent='전체화면 '+(on?'ON':'OFF');$('#fullscreenButton').setAttribute('aria-pressed',String(on));}
async function toggleFullscreen(){try{if(document.fullscreenElement){await document.exitFullscreen();screen.orientation?.unlock?.();}else if(document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();try{await screen.orientation?.lock?.('landscape');}catch(e){}}else toast('이 브라우저는 전체화면을 지원하지 않아요. 화면 크기에 맞춰 그대로 플레이할 수 있어요.');}catch(e){toast('전체화면 전환이 지원되지 않았어요. 현재 화면에서도 플레이할 수 있어요.');}syncFullscreen();if(infoPage==='menu')menu();}
function restart(){openInfo('새 학기말을 시작할까요?','<p>지금까지의 진행은 새 이야기로 바뀝니다. 필요한 기록은 먼저 내려받아 주세요.</p>',btn('성장 기록 내려받기','download',{},'secondary')+btn('현재 이야기 유지','close-info',{},'secondary')+btn('새로 시작하기','confirm-restart'));}
function boot(){S=readSave()||fresh();renderTitle();document.addEventListener('fullscreenchange',()=>{syncFullscreen();requestAnimationFrame(paintActors);if(infoPage==='menu')menu();});new ResizeObserver(()=>requestAnimationFrame(paintActors)).observe($('#actors'));
 document.addEventListener('input',event=>{if(event.target.id==='nickname')setupName=event.target.value;});
 document.addEventListener('click',event=>{const b=event.target.closest('button[data-action]');if(!b)return;const a=b.dataset.action;if(a.startsWith('task-')&&a!=='task-return'){if(typeof taskAction==='function')taskAction(a,b);return;}
 switch(a){
 case 'setup':if(S.started)restart();else renderSetup();break;
 case 'hero':setupHero=b.dataset.id;renderSetup();break;
 case 'name':setupName=b.dataset.name;renderSetup();break;
 case 'more-names':namePage=1-namePage;renderSetup();break;
 case 'begin':setupName=($('#nickname')?.value||'').trim().slice(0,12)||'하늘';$('#nickname')?.blur();S=fresh();S.hero=setupHero;S.name=setupName;S.started=true;renderStory();break;
 case 'continue':closeInfo();renderStory();break;
 case 'title':renderTitle();break;
 case 'next':advance();break;
 case 'story-choice':chooseStory(Number(b.dataset.index));break;
 case 'chapter-end':endChapter();break;
 case 'next-chapter':nextChapter();break;
 case 'ending':showEnding();break;
 case 'open-task':openTask(b.dataset.id);break;
 case 'close-task':closeTask();if(practiceBackup)practiceMenu();break;
 case 'task-return':closeTask();if(practiceBackup)practiceMenu();break;
 case 'review-task':closeInfo();openTask(b.dataset.id);break;
 case 'menu':menu();break;
 case 'references':openReferences();break;
 case 'ref-tab':openReferences(b.dataset.tab);break;
 case 'journal':openJournal();break;
 case 'history':showHistory();break;
 case 'growth':showGrowth();break;
 case 'close-info':if(infoPage==='practice'&&practiceBackup)exitPractice();else closeInfo();break;
 case 'fullscreen':toggleFullscreen();break;
 case 'large':S.large=!S.large;save();renderHeader();menu();requestAnimationFrame(paintActors);break;
 case 'expressions':expressions();break;
 case 'expression-person':expressionPerson(b.dataset.id);break;
 case 'practice':practiceMenu();break;
 case 'practice-task':beginPractice(b.dataset.id);break;
 case 'exit-practice':exitPractice();break;
 case 'download':downloadRecord();break;
 case 'restart':restart();break;
 case 'confirm-restart':practiceBackup=null;S=fresh();save();closeInfo();if($('#workDialog').open)$('#workDialog').close();renderSetup();break;
 case 'ending-title':case 'menu-title':if(practiceBackup){S=practiceBackup;practiceBackup=null;}closeInfo();renderTitle();break;
 }
 });
 $('#dialogueBox .dialogue-text').addEventListener('click',()=>{if($('#dialogueBox [data-action="next"]'))advance();});
 document.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&!$('dialog[open]')&&!e.target.closest('button,input,textarea')&&$('#dialogueBox [data-action="next"]')){e.preventDefault();advance();}});
 $('#workDialog').addEventListener('cancel',e=>{e.preventDefault();closeTask();if(practiceBackup)practiceMenu();});$('#infoDialog').addEventListener('cancel',e=>{if(infoPage==='practice'&&practiceBackup){e.preventDefault();exitPractice();}else infoPage='';});
}
