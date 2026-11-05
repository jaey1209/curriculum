// 연수 교사 플레이 테스트 확인 항목(2026-11) 자동 점검.
// 실제 마우스·키보드만 사용하고, 클릭은 force 없이 한다(다른 요소가 가리면 실패).
// 실행: VW=1471 VH=812 node neis/tests/playtest.js
const { chromium } = require('playwright');
const path = require('path');
const SP = process.env.OUT || require('os').tmpdir();
const VW = +(process.env.VW || 1471), VH = +(process.env.VH || 812);
const results = [];
const ok = (name, pass, info) => { results.push({ name, pass: !!pass, info }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../index.html'));
  await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.click('#b-login'); await p.waitForTimeout(300);
  const W = (ms = 120) => p.waitForTimeout(ms);
  const clickBot = async () => { const r = await p.$eval('#botAv', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); await p.mouse.click(r.x, r.y); };
  const step = () => p.evaluate(() => { const n = nextAction(); return n ? n.step : 0; });
  const scrimOn = () => p.evaluate(() => document.getElementById('scrim').classList.contains('on'));
  const popText = () => p.evaluate(() => document.getElementById('mBody').innerText);
  const closeAlert = async () => { if (await scrimOn()) { await p.click('#mFoot .btn >> nth=0'); await W(); } };

  // 기본 위치에서 최성봇이 화면의 조작 요소를 가리는지
  const overlaps = async (label) => {
    const r = await p.evaluate(() => {
      const rects = ['#botAv>svg', '#botPeek'].map(q => document.querySelector(q)).filter(e => e && e.offsetParent !== null || (e && getComputedStyle(e).position === 'fixed')).map(e => e.getBoundingClientRect()).filter(r => r.width && r.height);
      const hit = [];
      document.querySelectorAll('#main button, #main input, #main select, #main .wt, #main a').forEach(el => {
        const a = el.getBoundingClientRect(); if (!a.width || !a.height) return;
        if (a.bottom < 0 || a.top > innerHeight) return;
        if (rects.some(r => !(a.right < r.left || a.left > r.right || a.bottom < r.top || a.top > r.bottom))) hit.push((el.id || el.tagName) + ':' + (el.textContent || el.value || '').trim().slice(0, 14));
      });
      return hit;
    });
    ok(`[4] 기본 위치에서 가림 없음 — ${label}`, r.length === 0, r);
  };

  // 말풍선·로봇·채팅 안내를 따라 한 번 진행(정상 클릭만)
  const follow = async () => {
    if (await scrimOn()) { const n = await p.$('#pop .btn.next'); await (n ? n.click() : p.click('#mFoot .btn >> nth=0')); await W(); return true; }
    const go = await p.$('#botPeek button:has-text("데려다줘")'); if (go) { await go.click(); await W(); return true; }
    const rt = await p.$('#roles button.next'); if (rt) { await rt.click(); await W(); return true; }
    const nx = await p.$('#main .btn.next'); if (nx) { await nx.click(); await W(); return true; }
    const hh = await p.$('th.next-hdr#th-mgmt-closed'); if (hh) { await hh.click(); await W(); return true; }
    return false;
  };
  const followUntil = async (cond, max = 60) => { for (let i = 0; i < max; i++) { if (await cond()) return true; if (!(await follow())) return await cond(); } return await cond(); };

  // ── 1. 초기 화면 ──
  ok('[확인1] 처음 화면이 3단계 안내로 시작', (await step()) === 3, await p.textContent('#botPeek'));
  ok('[4] 말풍선 기본 접힘(한 줄 요약)', await p.evaluate(() => document.getElementById('botPeek').classList.contains('mini')));
  const botBox = await p.$eval('#botAv', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; });
  const small = VW <= 1400 || VH <= 800;
  ok(small ? '[4] 작은 화면: 기본 위치가 오른쪽 위(화면 제목 줄)' : '[4] 기본 위치가 오른쪽 아래', small ? botBox.x > VW * 0.7 && botBox.y < 140 : botBox.x > VW * 0.7 && botBox.y > VH * 0.6, botBox);
  await overlaps('업무 흐름도');

  // ── 3단계 ──
  await followUntil(async () => (await step()) > 3);
  ok('3단계 완료 → 4단계', (await step()) === 4);
  const mathTargets = await p.evaluate(() => CLASSES.reduce((n, c) => n + msbTargets('mat', c).length, 0));
  ok('[7] 공통수학2 대상자 수', mathTargets === 7, mathTargets);
  ok('[7] 공통국어2·공통영어2는 마감 상태로 시작', await p.evaluate(() => ['kor', 'eng'].every(s => CLASSES.every(c => msbOf(s, c).closed))));

  // ── 4단계: 예외처리 ──
  await followUntil(async () => p.evaluate(() => view.menu === 'msb-manage' && cond.tab === 'exc' && !!queried['msb-manage']));
  await W(200);
  ok('[8] 최성봇이 시나리오를 말풍선으로 알려 줌(처음 한 번 펼침)', await p.$eval('#botPeek', e => !e.classList.contains('mini') && /특수교육대상자/.test(e.querySelector('.pk-sc')?.innerText || '')));
  await p.click('#botPeek .pk-x'); await W();
  await overlaps('4단계 예외처리');
  // 기타 사유 입력 직후 [저장] 1번
  const rows = await p.$$('#main table.grid tbody tr');
  const otherRow = rows[rows.length - 1];
  await (await otherRow.$('select')).selectOption('기타'); await W();
  const rs = await otherRow.$('input.exc-rs'); await rs.click(); await p.keyboard.type('연수 테스트 사유');
  await p.click('#b-save'); await W();
  ok('[1] 기타 사유 입력 직후 [저장] 첫 클릭에 반응(시나리오 밖 예외는 안내로 막힘)', (await scrimOn()) && /저장이 완료|골라 주세요|한 명이에요/.test(await popText()), await popText());
  await closeAlert();
  { const rows2 = await p.$$('#main table.grid tbody tr'); await (await rows2[rows2.length - 1].$('select')).selectOption(''); await W(); }
  // 시나리오 학생: 특수교육대상자
  const excSel = await p.$('td.exc-cell select'); await excSel.selectOption('특수교육대상자'); await W();
  await p.click('#b-save'); await W();
  ok('[1] 예외 선택 직후 [저장] 첫 클릭에 저장', (await scrimOn()) && /저장이 완료/.test(await popText()));
  await closeAlert();
  ok('4단계 완료 → 5단계', (await step()) === 5);

  // ── 5단계: 이수관리 — 칸마다 클릭 1번 ──
  await followUntil(async () => p.evaluate(() => view.menu === 'msb-manage' && cond.tab === 'hours' && !!queried['msb-manage']));
  ok('[8] 5단계 시나리오 말풍선(미이수 학생)', await p.$eval('#botPeek', e => /미이수/.test(e.querySelector('.pk-sc')?.innerText || '')));
  await p.mouse.click(400, 300); await W();
  ok('[8] 표 쪽을 누르면 시나리오 말풍선이 한 줄로 접힘', await p.$eval('#botPeek', e => e.classList.contains('mini')));
  await overlaps('5단계 이수관리');
  const hins = await p.$$('input.hin');
  const plan = await p.evaluate(() => [...document.querySelectorAll('input.hin')].map(i => { const sid = i.getAttribute('oninput').match(/'(\d{8,})'/)[1]; return { sid, v: sid === S.scen.un ? 5 : 9 }; }));
  for (let i = 0; i < hins.length; i++) { await hins[i].click(); await p.keyboard.type(String(plan[i].v)); }
  const got1 = await p.evaluate(pl => pl.map(x => { const c = studentById(x.sid).cls; return (msbOf('mat', c).hours[x.sid] || {}).h; }), plan);
  ok(`[1] 참여시수 ${hins.length}명 클릭 1번씩 입력`, got1.every((v, i) => v === plan[i].v), got1);
  // Tab만으로 입력(값을 바꿔 다시 입력)
  await hins[0].click(); await p.keyboard.press('Control+A');
  for (let i = 0; i < hins.length; i++) { await p.keyboard.type(String(plan[i].v === 5 ? 5 : 10)); await p.keyboard.press('Tab'); }
  const got2 = await p.evaluate(pl => pl.map(x => { const c = studentById(x.sid).cls; return (msbOf('mat', c).hours[x.sid] || {}).h; }), plan);
  ok('[2] 숫자 입력 → Tab 반복만으로 전원 입력', got2.every((v, i) => v === (plan[i].v === 5 ? 5 : 10)), got2);
  ok('[2] 마지막 칸에서 Tab → [저장]으로 이동', await p.evaluate(() => document.activeElement && document.activeElement.id === 'b-save'));
  const hs = await p.$eval('#main .grid-wrap', g => ({ sw: g.scrollWidth, cw: g.clientWidth }));
  ok('[작은 수정] 이수관리 비고 칸이 가로 스크롤 없이 보임', hs.sw <= hs.cw + 1, hs);
  await p.click('#b-save'); await W();
  ok('[1] 입력 직후 [저장] 1번으로 저장', (await scrimOn()) && /저장이 완료/.test(await popText()));
  await closeAlert();
  ok('[8] 미이수 학생 판정', await p.evaluate(() => { const st = studentById(S.scen.un); return msbRoomStats('mat', st.cls).un === 1; }));

  // ── 6단계 ──
  await followUntil(async () => (await step()) >= 7 && !(await scrimOn()) || (await scrimOn() && /3~6단계/.test(await popText())));
  ok('[7] 6단계 마감 시 "과목마다 3~6단계 반복" 안내', /과목마다 3~6단계/.test(await popText()), (await popText()).slice(0, 80));
  await closeAlert();
  ok('[확인5] 공통수학2 마감 후 7단계로 넘어감', (await step()) === 7);
  ok('[7] 흐름도에 3~6단계 체크', JSON.stringify(await p.evaluate(() => steps().slice(2, 6).map(s => s.ok()))) === '[true,true,true,true]');

  // ── 7·8단계 ──
  await followUntil(async () => p.evaluate(() => view.menu === 'rec-reflect' && !!queried['rec-reflect']));
  await overlaps('7단계 학생부');
  await followUntil(async () => p.evaluate(() => view.menu === 'msb-mgmt' && !!queried['msb-mgmt']));
  await overlaps('8단계 마감관리');
  const rooms = await p.evaluate(() => SUBJECTS.every(s => CLASSES.every(c => msbOf(s.id, c).closed)));
  ok('[7] 8단계 표 9개 강의실 모두 마감', rooms);
  await followUntil(async () => (await step()) === 0);
  ok('[확인6] 예외·미이수 학생 포함 8/8 완료', JSON.stringify(await p.evaluate(() => steps().map(s => s.ok()))) === '[true,true,true,true,true,true,true,true]');
  await p.screenshot({ path: SP + '/pt-done.png' });

  // ── 최성봇 네 모서리 ──
  for (const [nm, tx, ty] of [['왼쪽 위', 0, 0], ['오른쪽 위', 1, 0], ['왼쪽 아래', 0, 1], ['오른쪽 아래', 1, 1]]) {
    const r = await p.$eval('#botAv', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await p.mouse.move(r.x, r.y); await p.mouse.down(); await p.mouse.move(tx ? VW - 5 : 5, ty ? VH - 5 : 5, { steps: 10 }); await p.mouse.up(); await W();
    // 말풍선 펼치기
    if (await p.$('#botPeek .pk-pill')) { await p.click('#botPeek .pk-pill'); await W(); }
    const pk = await p.evaluate(() => [...document.querySelectorAll('#botPeek button')].map(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; }));
    ok(`[5] ${nm}: 말풍선 버튼 모두 화면 안`, pk.length > 0 && pk.every(Boolean), pk);
    const x = await p.$eval('#botPeek .pk-x', e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
    ok(`[6] ${nm}: 접기 버튼 32px 이상`, x[0] >= 32 && x[1] >= 32, x);
    // 말풍선 본문 클릭은 아무 일도 하지 않음(대화 기능 없음)
    await p.click('#botPeek .pk-s', { position: { x: 5, y: 5 } }); await W();
    ok(`[6] ${nm}: 말풍선 본문 클릭해도 그대로`, await p.$eval('#botPeek', e => !e.classList.contains('mini')));
    await p.click('#botPeek .pk-x'); await W();
    // 로봇 클릭 → 말풍선 펼침, 로봇·말풍선 모두 화면 안
    await clickBot(); await W(200);
    const ch = await p.evaluate(() => { const pk = document.getElementById('botPeek'), a = pk.getBoundingClientRect(), v = document.getElementById('botAv').getBoundingClientRect(); return { open: !pk.classList.contains('mini'), peek: a.top >= 0 && a.bottom <= innerHeight && a.left >= 0 && a.right <= innerWidth, robot: v.top >= 0 && v.bottom <= innerHeight && v.left >= 0 && v.right <= innerWidth }; });
    ok(`[5] ${nm}: 로봇 클릭으로 말풍선 펼침, 화면 안`, ch.open && ch.peek && ch.robot, ch);
    // 말풍선이 펼쳐진 채로 알림창 버튼 누르기
    await p.evaluate(() => alertBox('알림', '모서리 테스트'));
    await p.click('#mFoot .btn >> nth=0', { timeout: 3000 }).then(() => ok(`[3] ${nm}: 알림창 [확인]을 누를 수 있음`, true), e => ok(`[3] ${nm}: 알림창 [확인]을 누를 수 있음`, false, e.message.split('\n')[0]));
    await clickBot(); await W(200);
    ok(`[6] ${nm}: 로봇 한 번 더 클릭하면 접힘`, await p.$eval('#botPeek', e => e.classList.contains('mini')));
  }

  // ── 왼쪽 메뉴 접기 ──
  await p.click('#tree .fold'); await W();
  const fw = await p.$eval('#tree', t => t.getBoundingClientRect().width);
  await p.click('#tree .fold'); await W();
  const fw2 = await p.$eval('#tree', t => t.getBoundingClientRect().width);
  ok('[작은 수정] 왼쪽 메뉴 접기(◀)가 동작', fw < 30 && fw2 > 200, [fw, fw2]);

  // ── 초기화(완료 말풍선의 [처음부터 다시]) ──
  await p.click('#botPeek button:has-text("처음부터 다시")'); await W();
  ok('[10] [처음부터 다시] → 확인창', await scrimOn());
  await p.click('#b-modal-ok'); await W(300);
  const st = await p.evaluate(() => ({ step: nextAction().step, tabs: openTabs.length, chat: chatLog.length, left: document.getElementById('bot').style.left, mini: document.getElementById('botPeek').classList.contains('mini'), menu: view.menu }));
  ok('[10] 초기화 후 첫 로그인과 같은 화면', st.step === 3 && st.tabs === 0 && st.chat <= 2 && st.left === '' && st.mini && st.menu === 'gd-steps', st);
  await p.click('#rail-bell'); await W(); ok('[10] 🔔 업무진행에 초기화 버튼', !!(await p.$('#b-reset'))); await p.click('#rail-menu'); await W();
  await p.screenshot({ path: SP + '/pt-reset.png' });

  ok('페이지 오류 없음', errs.length === 0, errs);
  const fail = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - fail} / ${results.length} 통과`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
