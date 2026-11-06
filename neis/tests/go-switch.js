// [데려다줘] 스위치: 처음엔 꺼짐, 한 번에 클릭 하나 안내, 막히면 켜기 권유, 켜면 버튼, 관리자 끄기 고정, 마친 뒤 직접 찾아간 단계
const { chromium } = require('playwright');const path=require('path');const SP=process.env.OUT||require('os').tmpdir();
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:+(process.env.VW||1536),height:+(process.env.VH||864)}});
  const errs=[],out=[],bad=[];p.on('pageerror',e=>errs.push(e.message));const ok=(c,m)=>{(c?out:bad).push((c?'PASS ':'FAIL ')+m);};
  const F='file://'+path.resolve(__dirname,'../index.html');const peek=async()=>(await p.textContent('#botPeek')).replace(/\s+/g,' ').trim();
  await p.goto(F);await p.evaluate(()=>localStorage.clear());await p.reload();await p.click('#b-login');await p.waitForTimeout(200);
  let t=await peek();ok(!(await p.$('#botPeek .pk-go'))&&/OFF/.test(t),'처음엔 꺼짐·버튼 없음: '+t);
  ok(/① 위쪽 \[교과담임\] 탭/.test(t),'① 탭 안내');
  await p.click('#roles button.next');await p.waitForTimeout(150);t=await peek();ok(/② 전체메뉴의 성적 칸에서 \[성적처리\]/.test(t),'② 전체메뉴 안내: '+t);
  await p.click('#mega a.next');await p.waitForTimeout(150);t=await peek();ok(/③ 왼쪽 메뉴에서 \[최소성취수준보장지도\(추가학습\)이수관리\]/.test(t),'③ 왼쪽 메뉴 안내');
  ok(await p.evaluate(()=>!!document.querySelector('.tree .it.next')),'③ 왼쪽 메뉴 항목 주황 표시');
  // 엉뚱한 메뉴 2번 → 켜기 권유
  await p.evaluate(()=>{const b=[...document.querySelectorAll('.tree .it')].find(x=>/조회\(교과담당\)/.test(x.textContent));b.click();});await p.waitForTimeout(100);
  ok(await p.evaluate(()=>!stuck.nudge),'엉뚱한 메뉴 1번은 아직 권유 없음');
  await p.evaluate(()=>{const b=[...document.querySelectorAll('.tree .it')].find(x=>/성적산출관리/.test(x.textContent));b.click();});await p.waitForTimeout(150);
  t=await peek();ok(/못 찾겠어요/.test(t)&&!!(await p.$('#goTog.nudge')),'엉뚱한 메뉴 2번 → 켜기 권유');
  await p.screenshot({path:SP+'/go_nudge.png'});
  // 스위치 켜기 → 데려다줘 → 사용 기록
  await p.click('#goTog');await p.waitForTimeout(150);ok(!!(await p.$('#botPeek .pk-go'))&&/ON/.test(await peek()),'켜면 [데려다줘] 버튼');
  await p.screenshot({path:SP+'/go_on.png'});
  await p.click('#botPeek .pk-go');await p.waitForTimeout(150);ok(await p.evaluate(()=>view.menu==='msb-manage'&&S.goUsed&&S.goUsed[3]===1),'[데려다줘]로 이동·3단계 사용 기록');
  ok(!(await p.$('#goTog')),'화면에 도착하면 스위치 숨김');await p.evaluate(()=>go('guide','gd-steps'));await p.waitForTimeout(100);await p.click('#goTog');await p.waitForTimeout(100);ok(await p.evaluate(()=>!goOn()),'다시 끄기');
  // 1분 진행 없음 → 권유 (시간을 앞당겨 확인)
  await p.evaluate(()=>{go('guide','gd-steps');});await p.waitForTimeout(100);await p.evaluate(()=>{stuck.nudge=false;stuck.t0=Date.now()-61000;});await p.waitForTimeout(3500);
  ok(await p.evaluate(()=>stuck.nudge)&&!!(await p.$('#goTog.nudge')),'1분 진행 없음 → 켜기 권유');
  // 꺼진 상태에서 🔔 단계 누르면 이동하지 않음
  await p.click('#rail-bell');await p.click('#flow-4');await p.waitForTimeout(100);ok(await p.evaluate(()=>view.menu==='gd-steps'),'꺼짐: 🔔 단계 눌러도 이동 안 함 ('+await p.textContent('#toast')+')');
  // 관리자 끄기 고정
  await p.evaluate(()=>logout());await p.click('#b-admshow');await p.fill('#lgAdmCode',process.env.ADMCODE||'');await p.click('#b-admlogin');await p.waitForTimeout(200);
  if(await p.evaluate(()=>isAdmin)){await p.click('#r-golock1');await p.waitForTimeout(100);await p.screenshot({path:SP+'/go_admin.png'});
    await p.evaluate(()=>logout());await p.click('#b-login');await p.waitForTimeout(200);t=await peek();
    ok(/🔒/.test(t)&&!(await p.$('#goTog')),'끄기 고정: 연수자 스위치 잠김');await p.screenshot({path:SP+'/go_lock.png'});
    ok(await p.evaluate(()=>{setGo(true);return !goOn();}),'끄기 고정: 켜지지 않음');
    await p.evaluate(()=>localStorage.removeItem('neis-go-lock'));}else out.push('SKIP 관리자 (ADMCODE 없음)');
  // 끝까지 마치면 직접 찾아간 단계
  await p.evaluate(()=>new Promise(r=>simStart({target:9,delay:0,label:'t',done:()=>r()})));await p.waitForTimeout(200);t=await peek();
  ok(/직접 찾아간 단계 \d \/ 6/.test(t),'마친 뒤: '+t.slice(0,60));
  console.log(out.concat(bad).join('\n'));console.log('ERRORS',errs);console.log(bad.length?`${bad.length} FAIL`:'ALL PASS');await b.close();})();
