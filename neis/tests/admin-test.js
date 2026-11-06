// 관리자 로그인 → 모든 메뉴 → 시뮬레이션 테스트(단계 이동·자동 점검·자동 시연) 확인
const { chromium } = require('playwright');const path=require('path');const SP=process.env.OUT||require('os').tmpdir();
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:+(process.env.VW||1536),height:+(process.env.VH||864)}});
  const errs=[],out=[],bad=[];p.on('pageerror',e=>errs.push(e.message));const ok=(c,m)=>{(c?out:bad).push((c?'PASS ':'FAIL ')+m);};
  await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.evaluate(()=>localStorage.clear());await p.reload();
  await p.click('#b-admshow');await p.fill('#lgAdmCode','0000');await p.click('#b-admlogin');await p.waitForTimeout(100);
  ok(await p.evaluate(()=>document.getElementById('scrim').classList.contains('on')&&!me),'틀린 코드는 거절');await p.click('#mFoot .btn');
  await p.fill('#lgAdmCode','1234');await p.press('#lgAdmCode','Enter');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>isAdmin&&view.menu==='gd-sim'&&cond.role==='관리자'),'관리자 로그인 → 시뮬레이션 테스트 화면');
  const tabs=await p.$$eval('#roles button',bs=>bs.map(b=>b.textContent));ok(tabs.includes('관리자'),'관리자 탭: '+tabs.join(','));
  await p.screenshot({path:SP+'/adm_sim.png'});
  await p.click('#roles button.adm');await p.waitForTimeout(150);const cols=await p.$$eval('#mega .col h4',h=>h.map(x=>x.textContent));ok(cols.length===6,'전체메뉴 분류: '+cols.join(','));
  await p.screenshot({path:SP+'/adm_mega.png'});
  const live=await p.evaluate(()=>{const all=[];for(const t in MENUS)for(const g of MENUS[t])for(const i of g.items)if(typeof i==='object')all.push(i.id);return {all:all.length,hidden:all.filter(hiddenMenu)};});
  ok(live.hidden.length===0,`관리자에게 숨긴 화면 없음 (${live.all}개)`);
  // 모든 화면 열어 보기
  const fails=await p.evaluate(()=>{const f=[];for(const t in MENUS)for(const g of MENUS[t])for(const i of g.items)if(typeof i==='object'){try{go(t,i.id);if(!document.getElementById('main').innerHTML.trim())f.push(i.id);}catch(e){f.push(i.id+':'+e.message);}}return f;});
  ok(!fails.length,'모든 화면 열림 '+fails.join(','));
  await p.evaluate(()=>{megaOpen(false);go('guide','gd-sim');});
  // 단계로 바로 가기
  await p.click('#b-simjump6');await p.click('#b-modal-ok');await p.waitForFunction(()=>!sim,null,{timeout:60000});
  ok(await p.evaluate(()=>nextAction().step===6&&view.menu==='msb-manage'),'6단계로 바로 가기 → '+await p.evaluate(()=>nextAction().step+' '+view.menu+'/'+cond.tab));
  await p.screenshot({path:SP+'/adm_jump6.png'});
  // 자동 점검
  await p.evaluate(()=>go('guide','gd-sim'));await p.click('#b-simcheck');await p.click('#b-modal-ok');
  await p.waitForFunction(()=>cond.simResult,null,{timeout:120000});
  const R=await p.evaluate(()=>cond.simResult.vers.map(v=>v.m+':'+v.ok+':'+v.n+':'+v.st.join('')));ok(await p.evaluate(()=>cond.simResult.vers.every(v=>v.ok)),'자동 점검 '+R.join(' | '));
  ok(await p.evaluate(()=>mode==='basic'&&nextAction().step===3),'점검 뒤 처음 상태(기본 3단계)');
  await p.click('#mFoot .btn');await p.screenshot({path:SP+'/adm_check.png'});
  // 자동 시연(빠르게) 중간에 멈춤
  await p.evaluate(()=>{cond.simSpeed='fast';});await p.click('#b-simdemo');await p.click('#b-modal-ok');await p.waitForTimeout(2500);
  ok(await p.evaluate(()=>document.getElementById('simBar').classList.contains('on')),'시연 중 막대 표시: '+await p.textContent('#simTxt'));
  await p.screenshot({path:SP+'/adm_demo.png'});
  await p.click('#simBar button');ok(await p.evaluate(()=>!sim),'[멈춤]');
  // 로그아웃 → 일반 로그인엔 관리자 탭 없음
  await p.evaluate(()=>logout());await p.click('#b-login');await p.waitForTimeout(150);
  ok(!(await p.$$eval('#roles button',bs=>bs.map(b=>b.textContent))).includes('관리자')&&await p.evaluate(()=>!isAdmin&&hiddenMenu('gd-sim')),'일반 로그인엔 관리자 탭·시뮬레이션 없음');
  console.log(out.concat(bad).join('\n'));console.log('ERRORS',errs);console.log(bad.length?`${bad.length} FAIL`:'ALL PASS');await b.close();})();
