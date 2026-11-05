// 현직 교사처럼: 함수 호출 없이 화면의 버튼만 클릭. 말풍선이 가리키는 대로 따라간다.
const { chromium } = require('playwright');
const path=require('path');const SP=process.env.OUT||require('os').tmpdir();
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:+(process.env.VW||1500),height:+(process.env.VH||860)}});
  const errs=[],log=[];p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')+(process.env.HASH?'#'+process.env.HASH:''));await p.evaluate(()=>localStorage.clear());await p.reload();
  await p.click('#b-login');await p.waitForTimeout(200);
  // 드래그 테스트
  const av=await p.$('#botAv');const bb=await av.boundingBox();
  await p.mouse.move(bb.x+40,bb.y+40);await p.mouse.down();await p.mouse.move(bb.x-600,bb.y-300,{steps:12});await p.mouse.up();await p.waitForTimeout(100);
  const pos=await p.evaluate(()=>({left:document.getElementById('bot').style.left,top:document.getElementById('bot').style.top,saved:localStorage.getItem('neis-bot-pos')}));
  log.push('드래그 후 위치: '+JSON.stringify(pos));
  await p.screenshot({path:SP+'/t_drag.png'});
  // 클릭만으로 드래그가 되지 않고 말풍선이 펼쳐지는지(대화 기능은 없음)
  await p.click('#botAv',{force:true,position:{x:42,y:60}});await p.waitForTimeout(100);log.push('클릭 시 말풍선 펼침: '+await p.evaluate(()=>!document.getElementById('botPeek').classList.contains('mini')));
  await p.click('#botAv',{force:true,position:{x:42,y:60}});await p.waitForTimeout(100);
  await p.evaluate(()=>botHome());
  let guard=0,lastSig='',stall=0,shots=0;const seen=new Set();
  while(guard++<260){
    const bubble=(await p.textContent('#botPeek')).replace(/\s+/g,' ').trim();
    // STOPAT=n 이면 n단계 화면에 도착했을 때 스크린샷을 찍고 멈춘다
    if(process.env.STOPAT){const st=await p.evaluate(()=>{const n=nextAction();return n?n.step:99;});if(st>=+process.env.STOPAT&&!(await p.$('#botPeek button:has-text("데려다줘")'))&&!(await p.evaluate(()=>document.getElementById('scrim').classList.contains('on')))){await p.screenshot({path:SP+'/stop.png'});log.push('STOP at '+st);break;}}
    const sig=bubble+'|'+await p.evaluate(()=>view.menu+'/'+(cond.tab||'')+'/'+(cond.atab||''));
    if(sig===lastSig){stall++;if(stall>8){log.push('STALL: '+bubble);break;}}else{stall=0;}lastSig=sig;
    if(!seen.has(bubble.slice(0,60))){seen.add(bubble.slice(0,60));if(shots<40){shots++;}}
    if(bubble.includes('다 끝났어요')){log.push('완료! 총 반복 '+guard);break;}
    // 확인창이 떠 있으면 교사는 [확인]을 누른다
    if(await p.evaluate(()=>document.getElementById('scrim').classList.contains('on'))){const pn=await p.$('#pop .btn.next');if(pn){await pn.click({force:true});await p.waitForTimeout(80);continue;}const ok=await p.$('#b-modal-ok');if(ok){await ok.click({force:true});}else{await p.click('#mFoot .btn',{force:true});}await p.waitForTimeout(80);continue;}
    // 말풍선에 [데려다줘]가 있으면 누른다
    const go=await p.$('#botPeek button:has-text("데려다줘")');
    if(go){await go.click({force:true});await p.waitForTimeout(80);continue;}
    // 주황색으로 깜빡이는 버튼(.btn.next)을 누른다
    const nxt=await p.$('.btn.next');
    if(nxt){const txt=(await nxt.textContent()).trim();const dis=await nxt.isDisabled();if(dis){log.push('DISABLED next btn: '+txt+' @ '+bubble);break;}await nxt.click({force:true});await p.waitForTimeout(80);continue;}
    // 점선으로 표시된 칸이 있으면 입력한다 (참여시수 / 예외)
    const cells=await p.$$('td.next-cell');
    if(cells.length){const first=cells[0];const inp=await first.$('input[type=number]');const sel=await first.$('select');
      if(inp){for(const c of cells){const i=await c.$('input[type=number]');if(i){await i.fill(String([8,7,9,5][Math.floor(Math.random()*4)]));await i.dispatchEvent('change');await p.waitForTimeout(40);break;}}continue;}
      if(sel){await sel.selectOption({index:1});await sel.dispatchEvent('change');await p.waitForTimeout(60);continue;}
    }
    // 점선 조회조건이 있으면 그 값은 [데려다줘]가 맞춰 줬다고 가정, 라디오 선택 항목
    const radio=await p.$('table.grid input[type=radio]:not(:checked)');
    if(bubble.includes('학생 선택')&&radio){await radio.click();await p.waitForTimeout(80);continue;}
    log.push('NO ACTION: '+bubble+' @ '+await p.evaluate(()=>view.menu+'/'+(cond.tab||'')));break;
  }
  log.push('steps: '+JSON.stringify(await p.evaluate(()=>steps().map(s=>s.ok()))));
  await p.screenshot({path:SP+'/t_end.png'});
  console.log(log.join('\n'));console.log('ERRORS',errs.slice(0,10));
  await b.close();
})();
