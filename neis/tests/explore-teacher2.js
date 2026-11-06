// 현직 교사 관점 탐색 테스트 2: 🔔·데려다줘로 이동, 되돌리기·잘못된 값·탭 바꾸기·범위 밖 메뉴·조회 화면·로그아웃·심화 버전.
// 실행: VW=1536 VH=864 node neis/tests/explore-teacher2.js
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.OUT || require('os').tmpdir();
const VW = +(process.env.VW || 1536), VH = +(process.env.VH || 864);
const issues = [];
const log = m => console.log('· ' + m);
const bad = m => { issues.push(m); console.log('✗ ' + m); };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const F = 'file://' + path.resolve(__dirname, '../index.html');
  await p.goto(F); await p.evaluate(() => localStorage.clear()); await p.evaluate(() => localStorage.setItem('neis-go-on','1')); await p.reload();
  const W = (ms = 150) => p.waitForTimeout(ms);
  let shot = 0; const S = async n => { await p.screenshot({ path: `${OUT}/e2-${VW}-${String(++shot).padStart(2, '0')}-${n}.png` }); };
  const pill = () => p.$eval('#botPeek', e => e.innerText.replace(/\s+/g, ' ').trim());
  const popOn = () => p.evaluate(() => document.getElementById('scrim').classList.contains('on'));
  const pop = async () => (await popOn()) ? p.$eval('#mBody', e => e.innerText.replace(/\s+/g, ' ').trim()) : null;
  const ok = async () => { if (await popOn()) { await p.click('#mFoot .btn >> nth=0'); await W(); } };
  const go = async () => { const g = await p.$('#botPeek button:has-text("데려다줘")'); if (g) { await g.click(); await W(); } };
  const step = () => p.evaluate(() => { const n = nextAction(); return n ? n.step : 0; });
  const clickCell = async el => { const bx = await el.boundingBox(); await p.mouse.click(bx.x + 4, bx.y + 4); await W(80); };
  // 화면 안에서 글자가 잘리거나 넘치는지(가로 스크롤)
  const overflow = async label => { const r = await p.evaluate(() => { const m = document.getElementById('main'); return { page: m.scrollWidth > m.clientWidth + 1, grids: [...document.querySelectorAll('#main .grid-wrap')].map(g => g.scrollWidth - g.clientWidth).filter(x => x > 1) }; }); if (r.page || r.grids.length) bad(`${label}: 가로로 넘침 ${JSON.stringify(r)}`); };

  await p.click('#b-login'); await W(300);
  // 1. 🔔에서 3단계 눌러 이동
  await p.click('#rail-bell'); await W(); await p.click('#flow-3'); await W();
  log(`🔔 3단계 클릭 → 화면 ${await p.evaluate(() => view.menu + '/' + cond.tab + ' 탭:' + curRole())}`);
  await p.click('#b-query'); await W(); await p.click('#b-fetch'); await W(); await p.click('#b-modal-ok'); await W(); await ok();
  // 되돌리기: 대상자삭제 → 다시 가져오기
  await p.click('#b-del'); await W(); log(`[대상자삭제] 확인창: ${(await pop() || '').slice(0, 50)}`); await p.click('#b-modal-ok'); await W();
  log(`삭제 후 단계 ${await step()} / 말풍선: ${await pill()}`);
  await p.click('#b-fetch'); await W(); await p.click('#b-modal-ok'); await W(); await ok();
  await overflow('3단계 대상자');

  // 2. 범위 밖 메뉴 눌러 보기
  await p.click('#tree .it:text-is("성적산출관리")').catch(() => { });
  await W(); log(`범위 밖 메뉴: ${await p.$eval('#toast', e => e.textContent)}`);

  // 3. 4단계: 데려다줘 사용
  await go(); log(`데려다줘 → ${await p.evaluate(() => view.menu + '/' + cond.tab)} / 말풍선: ${await pill()}`);
  await p.click('#b-query'); await W(250);
  const rows = await p.$$('#main table.grid tbody tr');
  const rs = await p.evaluate(() => { const e = studentById(S.scen.exc); return [...document.querySelectorAll('#main table.grid tbody tr')].findIndex(r => r.cells[1].innerText.trim() == e.c && r.cells[2].innerText.trim() == e.no); });
  const sel = await rows[rs].$('select'); await clickCell(sel); await p.keyboard.press('Escape'); await sel.selectOption('특수교육대상자'); await W();
  // 다른 학생에게 기타를 고르고 사유 없이 저장 → 막혀야 함
  const sel2 = await rows[0].$('select'); await clickCell(sel2); await p.keyboard.press('Escape'); await sel2.selectOption('기타'); await W();
  await p.click('#b-save'); await W(); log(`기타 사유 없이 [저장]: ${await pop()}`); await ok();
  await sel2.selectOption(''); await W(); await p.click('#b-save'); await W(); await ok();
  await overflow('4단계 예외처리'); await S('4');

  // 4. 5단계: 탭을 일부러 [학급담임]으로 바꿔 보고, 잘못된 값 입력
  await go(); await p.click('#b-query'); await W(250);
  await p.click('#roles button:text-is("학급담임")'); await W(); await p.keyboard.press('Escape'); await W();
  log(`이수관리 화면에서 [학급담임]으로 바꾸면: 화면 ${await p.evaluate(() => view.menu)} / 알림 ${await p.$eval('#toast', e => e.textContent)}`);
  await go(); await p.click('#b-query'); await W(250);
  const hins = await p.$$('input.hin');
  await clickCell(hins[0]); await p.keyboard.type('13'); await p.keyboard.press('Tab');
  await p.keyboard.type('-1'); await p.keyboard.press('Tab');
  const v = await p.evaluate(() => [...document.querySelectorAll('input.hin')].slice(0, 2).map(i => { const sid = i.getAttribute('oninput').match(/'(\d{8,})'/)[1]; const st = studentById(sid); return (msbOf('mat', st.cls).hours[sid] || {}).h; }));
  const r2 = await p.$$eval('#main table.grid tbody tr', rs => rs.slice(0, 2).map(r => r.querySelector('.c-res option')?.textContent));
  log(`필요시수 12인데 13 입력 → 저장값 ${v[0]}, 판정 ${r2[0]} / -1 입력 → 저장값 ${v[1]}, 판정 ${r2[1]}`);
  if (v[0] > 12) bad('참여시수가 필요시수(12)보다 큰 값도 그대로 저장됨');
  if (v[1] < 0) bad('참여시수에 음수가 그대로 저장됨');
  // 바르게 다시 입력
  await p.evaluate(() => { document.querySelectorAll('input.hin').forEach(i => { const sid = i.getAttribute('oninput').match(/'(\d{8,})'/)[1]; i.value = sid === S.scen.un ? 5 : 9; i.dispatchEvent(new Event('input')); }); });
  await p.click('#b-save'); await W(); await ok(); await overflow('5단계 이수관리'); await S('5');

  // 5. 6단계 → 마감 후 마감취소 → 다시 마감
  await go(); await p.click('#b-query'); await W();
  await p.click('#b-credit'); await W(); await p.click('#b-modal-ok'); await W(); await ok();
  await p.click('#b-close'); await W(); await p.click('#b-modal-ok'); await W(); await ok();
  const un = await p.$('button:has-text("마감취소")'); log(`마감 후 [마감취소] 버튼: ${!!un}`);
  if (un) { await un.click(); await W(); log(`[마감취소] 확인창: ${(await pop() || '').slice(0, 50)}`); await p.click('#b-modal-ok'); await W(); log(`마감취소 후 단계 ${await step()} / 학생부 반영 상태 ${await p.evaluate(() => CLASSES.map(c => !!S.recReflect[c]).join(','))}`); }
  // 다시 학점반영·마감
  await go(); await p.click('#b-query'); await W(); await p.click('#b-credit'); await W(); await p.click('#b-modal-ok'); await W(); await ok(); await p.click('#b-close'); await W(); await p.click('#b-modal-ok'); await W(); await ok();
  log(`다시 마감 후 단계 ${await step()}`);

  // 6. 조회 화면 둘러보기
  await p.click('#roles button:text-is("교과담임")'); await W(); await p.keyboard.press('Escape'); await W();
  await p.click('#rail-menu'); await W(); await p.click('#mega a:text-is("성적처리")'); await W();
  await p.evaluate(() => { const g = [...document.querySelectorAll('#tree .grp')].find(x => x.textContent.replace('▼', '').trim() === '성적처리'); if (g && !g.classList.contains('open')) g.click(); }); await W();
  await p.click('#tree .it[title="최소성취수준보장지도(추가학습)조회(교과담당)"]'); await W(); await p.click('#b-query').catch(() => { }); await W();
  log(`조회(교과담당) 줄 수: ${await p.$$eval('#main table.grid tbody tr', r => r.length).catch(() => 0)}`); await overflow('조회(교과담당)'); await S('view2');
  await p.click('#roles button:text-is("학급담임")'); await W();
  const megaCols = await p.$$eval('#mega .col h4', h => h.map(x => x.textContent).join(','));
  log(`[학급담임] 전체메뉴 분류: ${megaCols}`);
  await p.keyboard.press('Escape'); await W();
  const hasView1 = await p.evaluate(() => !hiddenMenu('msb-view'));
  log(`[학급담임]에서 조회(학급담임) 메뉴 보임: ${hasView1}`);
  if (hasView1) { await p.click('#rail-menu'); await W(); await p.click('#mega a:text-is("성적처리")').catch(() => { }); await W(); await p.click('#tree .it[title="최소성취수준보장지도(추가학습)조회(학급담임)"]').catch(() => { }); await W(); }
  else await p.evaluate(() => go('score', 'msb-view'));
  log(`조회(학급담임) 반 목록: ${await p.$$eval('#f-cls option', o => o.map(x => x.textContent).join(',')).catch(() => '반 선택 없음')}`);
  await p.click('#b-query').catch(() => { }); await W(); log(`조회(학급담임) 줄 수: ${await p.$$eval('#main table.grid tbody tr', r => r.length).catch(() => 0)}`); await overflow('조회(학급담임)'); await S('view1');

  // 7. 로그아웃 후 다시 로그인 → 이어서
  await p.click('.gnb .hb:has-text("로그아웃")'); await W(); await p.click('#b-login'); await W(300);
  log(`다시 로그인: 단계 ${await step()} / 첫 화면 버튼 ${await p.$eval('#b-start', e => e.innerText).catch(() => '없음')}`);

  // 8. 7·8단계는 데려다줘로 마무리
  for (let i = 0; i < 40 && (await step()) !== 0; i++) {
    if (await popOn()) { const n = await p.$('#pop .btn.next'); await (n ? n.click() : p.click('#mFoot .btn >> nth=0')); await W(); continue; }
    const g = await p.$('#botPeek button:has-text("데려다줘")'); if (g) { await g.click(); await W(); continue; }
    const rt = await p.$('#roles button.next'); if (rt) { await rt.click(); await W(); continue; }
    const nx = await p.$('#main .btn.next'); if (nx) { await nx.click(); await W(); continue; }
    const hh = await p.$('th.next-hdr#th-mgmt-closed'); if (hh) { await hh.click(); await W(); continue; }
    break;
  }
  log(`마무리 후 단계 ${await step()} (0이면 완료)`); await overflow('8단계'); await S('done');
  if ((await step()) !== 0) bad('8단계까지 끝나지 않음');

  // 9. 심화 버전: 출결·성적 마감 오류 찾기
  await p.goto(F + '#%EC%8B%AC%ED%99%94'); await p.reload(); await p.click('#b-login'); await W(300);
  log(`심화 첫 화면: ${await p.$eval('#main .hm2 .intro', e => e.innerText)} / 말풍선: ${await pill()}`);
  for (let i = 0; i < 80 && (await step()) <= 2 && (await step()) > 0; i++) {
    if (await popOn()) { const n = await p.$('#pop .btn.next'); await (n ? n.click() : p.click('#mFoot .btn >> nth=0')); await W(); continue; }
    const g = await p.$('#botPeek button:has-text("데려다줘")'); if (g) { await g.click(); await W(); continue; }
    const rt = await p.$('#roles button.next'); if (rt) { log(`심화: 탭 바꾸기 안내 → [${await rt.innerText()}]`); await rt.click(); await W(); continue; }
    const nx = await p.$('#main .btn.next, #pop .btn.next'); if (nx) { await nx.click(); await W(); continue; }
    log(`심화: 진행 멈춤 — ${await pill()}`); break;
  }
  log(`심화 1·2단계 뒤 단계 ${await step()} / 말풍선 ${await pill()}`); await S('deep');
  if ((await step()) !== 3) bad('심화 1·2단계를 마치지 못함');

  console.log('\nERRORS', JSON.stringify(errs)); console.log('ISSUES', JSON.stringify(issues));
  await b.close();
})();
