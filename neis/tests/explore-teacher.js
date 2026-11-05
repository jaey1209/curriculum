// 현직 교사 관점 탐색 테스트: [데려다줘] 없이 메뉴·탭·버튼을 직접 눌러 진행하고, 일부러 실수도 해 본다.
// 실행: VW=1536 VH=864 node neis/tests/explore-teacher.js  (스크린샷은 OUT 폴더)
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.OUT || require('os').tmpdir();
const VW = +(process.env.VW || 1536), VH = +(process.env.VH || 864);
const notes = [], issues = [];
const log = m => { notes.push(m); console.log('· ' + m); };
const bad = m => { issues.push(m); console.log('✗ ' + m); };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../index.html'));
  await p.evaluate(() => localStorage.clear()); await p.reload();
  const W = (ms = 150) => p.waitForTimeout(ms);
  let shot = 0; const S = async n => { await p.screenshot({ path: `${OUT}/ex-${String(++shot).padStart(2, '0')}-${n}.png` }); };
  const pill = () => p.$eval('#botPeek', e => e.innerText.replace(/\s+/g, ' ').trim());
  const pop = async () => (await p.evaluate(() => document.getElementById('scrim').classList.contains('on'))) ? p.$eval('#mBody', e => e.innerText.replace(/\s+/g, ' ').trim()) : null;
  const ok = async () => { await p.click('#mFoot .btn >> nth=0'); await W(); };
  const tree = async t => { await p.evaluate(() => { const g = [...document.querySelectorAll('#tree .grp')].find(x => x.textContent.replace('▼', '').trim() === '성적처리'); if (g && !g.classList.contains('open')) g.click(); }); await W(); await p.click(`#tree .it[title="최소성취수준보장지도(추가학습)${t}"]`); await W(); };
  const wiz = async t => { await p.click(`.wiz .wt:has-text("${t}")`); await W(); };
  const role = async r => { await p.click(`#roles button:text-is("${r}")`); await W(); };
  const step = () => p.evaluate(() => { const n = nextAction(); return n ? n.step : 0; });

  // 1. 로그인
  await p.click('#b-login'); await W(300); await S('home');
  log(`첫 화면 말풍선: ${await pill()}`);
  log(`첫 화면 버튼: ${await p.$eval('#b-start', e => e.innerText)}`);
  await p.click('#rail-bell'); await W(); log(`🔔 진행 현황: ${await p.$eval('#noti .h', e => e.innerText.replace(/\s+/g, ' '))}`); await S('bell'); await p.keyboard.press('Escape'); await W();

  // 역할별 최성보 메뉴
  await p.click('#rail-menu'); await W(); await p.click('#mega a:text-is("성적처리")'); await W();
  for (const r of ['최성보업무', '교과담임', '학급담임']) { await role(r); await p.evaluate(() => { const g = [...document.querySelectorAll('#tree .grp')].find(x => x.textContent.replace('▼', '').trim() === '성적처리'); if (g && !g.classList.contains('open')) g.click(); }); await W(); log(`[${r}] 최성보 메뉴: ${await p.$$eval('#tree .it[title^="최소성취수준"]', a => a.map(x => x.title.replace('최소성취수준보장지도(추가학습)', '')).join(', '))}`); }
  await role('최성보업무');
  // 2. 3단계 — 메뉴로 직접 이동(아직 최성보업무 탭)
  await tree('이수관리'); await S('3-wrong-role');
  log(`이수관리 화면(최성보업무 탭) 말풍선: ${await pill()}`);
  await p.click('#b-query'); await W();
  await p.click('#b-fetch'); await W(); log(`최성보업무 탭에서 [대상자가져오기]: ${await pop()}`); await ok();
  await role('교과담임'); log(`[교과담임] 누른 뒤 말풍선: ${await pill()}`);
  await p.click('#b-query'); await W(); await p.click('#b-fetch'); await W(); log(`확인창: ${(await pop() || '').slice(0, 40)}…`); await p.click('#b-modal-ok'); await W();
  log(`알림: ${await pop()}`); await ok(); await S('3-done');
  if ((await step()) !== 4) bad('3단계 뒤 4단계로 안 넘어감');

  // 3. 4단계 — 예외처리 탭
  await wiz('예외처리'); log(`예외처리 탭(조회 전) 말풍선: ${await pill()}`);
  await p.click('#b-query'); await W(300); await S('4-scenario');
  const sc = await p.$('#botPeek .pk-sc'); log(`시나리오 말풍선 펼쳐짐: ${!!sc} ${sc ? await sc.innerText() : ''}`.replace(/\s+/g, ' '));
  // 시나리오 학생 행 찾기(2반 5번)
  const rowSel = await p.evaluate(() => { const e = studentById(S.scen.exc); const rows = [...document.querySelectorAll('#main table.grid tbody tr')]; return rows.findIndex(r => r.cells[1].innerText.trim() == e.c && r.cells[2].innerText.trim() == e.no); });
  log(`화면에서 시나리오 학생 행 번호: ${rowSel + 1}`);
  const rows = await p.$$('#main table.grid tbody tr');
  { const sel = await rows[rowSel].$('select'); const bx = await sel.boundingBox(); await p.mouse.click(bx.x + 5, bx.y + 5); await W(); await p.keyboard.press('Escape'); log(`예외 칸을 누르자 시나리오 말풍선 접힘: ${await p.$eval('#botPeek', e => e.classList.contains('mini'))}`); await sel.selectOption('특수교육대상자'); await W(); }
  await p.click('#b-save'); await W(); log(`[저장]: ${await pop()}`); await ok();

  // 실수: 이수관리 안 하고 마감 탭에서 학점반영 시도
  await wiz('마감'); await p.click('#b-query'); await W();
  log(`이수관리 전 [학점반영] 버튼 비활성화: ${await p.$eval('#b-credit', e => e.disabled)} / 안내: ${await p.$eval('#main', m => (m.querySelector('.rem-l[style*="crit"]') || {}).innerText || '')}`);
  log(`이 상태 말풍선: ${await pill()}`);

  // 4. 5단계 — 이수관리
  await wiz('이수관리'); await p.click('#b-query'); await W(300); await S('5-scenario');
  log(`이수관리 말풍선: ${(await pill()).slice(0, 120)}`);
  const plan = await p.evaluate(() => [...document.querySelectorAll('input.hin')].map(i => { const sid = i.getAttribute('oninput').match(/'(\d{8,})'/)[1]; const st = studentById(sid); return { sid, lab: `${st.c}반 ${st.no}번`, v: sid === S.scen.un ? 5 : null }; }));
  const vals = [12, 9, 7, 0, 8]; let k = 0; plan.forEach(x => { if (x.v == null) x.v = vals[k++ % vals.length]; });
  const hins = await p.$$('input.hin'); await hins[0].click();
  for (let i = 0; i < plan.length; i++) { await p.keyboard.type(String(plan[i].v)); await p.keyboard.press('Tab'); }
  const res = await p.$$eval('#main table.grid tbody tr', rs => rs.map(r => r.querySelector('.c-res option')?.textContent));
  log(`입력: ${plan.map((x, i) => `${x.lab}=${x.v}→${res[i]}`).join(', ')}`);
  await p.click('#b-save'); await W(); log(`[저장]: ${await pop()}`); await ok(); await S('5-saved');

  // 5. 6단계 — 마감
  await wiz('마감'); await p.click('#b-query'); await W();
  log(`학점반영 전 [마감] 버튼 비활성화: ${await p.$eval('#b-close', e => e.disabled)}`);
  await p.click('#b-credit'); await W(); await p.click('#b-modal-ok'); await W(); log(`학점반영 알림: ${await pop()}`); await ok();
  const sum = await p.$$eval('.sumtbl tr', rs => rs.map(r => r.innerText.replace(/\s+/g, ' ')).join(' | ')); log(`마감 탭 요약: ${sum}`);
  await p.click('#b-close'); await W(); await p.click('#b-modal-ok'); await W(); log(`마감 알림: ${await pop()}`); await ok(); await S('6-closed');
  log(`6단계 뒤 말풍선: ${await pill()}`);
  await p.click('#rail-bell'); await W(); log(`🔔: ${await p.$eval('#noti .h', e => e.innerText.replace(/\s+/g, ' '))}`); await p.keyboard.press('Escape'); await W();

  // 6. 7단계 — 전체메뉴에서 학생부 찾기
  await p.click('#rail-menu'); await W(); await S('7-mega');
  await p.click('#mega a:has-text("학교생활기록부")'); await W();
  log(`학생부 메뉴 열림: ${await p.evaluate(() => view.menu)} / 말풍선: ${await pill()}`);
  await role('학급담임');
  log(`[학급담임] 반 목록: ${await p.$$eval('#f-cls option', o => o.map(x => x.textContent).join(','))} / 말풍선: ${await pill()}`);
  await p.click('#b-query'); await W(); await S('7-reflect');
  await p.click('#b-reflect'); await W(); await p.click('#b-modal-ok'); await W(); log(`전체반영 알림: ${await pop()}`); await ok();
  // 반영 결과: 미이수 학생 학생부 확인
  const un = await p.evaluate(() => { const st = studentById(S.scen.un); cond.rtab = 'view'; cond.recStu = st.id; render(); return st.name; }); await W(300);
  const doc = await p.$eval('#main', m => m.innerText);
  log(`학생부 조회에서 미이수 학생(${un}) 공통수학2 줄: ${(doc.split('\n').find(l => /공통수학2/.test(l)) || '없음').replace(/\s+/g, ' ')}`); await S('7-view');

  // 7. 8단계 — 마감관리
  await role('최성보업무'); await p.click('#rail-menu'); await W(); await p.click('#mega a:text-is("성적처리")'); await W(); await tree('마감관리'); log(`마감관리 말풍선: ${await pill()}`);
  await p.click('#b-query'); await W(); await S('8-mgmt');
  await p.click('#b-mgmtsave'); await W(); await p.click('#b-modal-ok'); await W(); const a1 = await pop(); log(`마감정보저장: ${a1}`); if (a1) await ok();
  await p.click('#b-mgmtreq'); await W(); await S('8-apv');
  await p.click('#b-apv-ok'); await W(); log(`결재자 없이 [상신]: ${await p.$eval('#mBody .err', e => e.innerText).catch(() => '오류 표시 없음')}`);
  await p.click('#b-apv-pick'); await W(); await p.click('#b-apv-ok'); await W(); const a2 = await pop(); log(`상신 후: ${a2}`); if (a2) await ok();
  log(`결재 전 말풍선: ${await pill()}`);
  await p.click('#b-approve'); await W(); await p.click('#b-modal-ok'); await W(); const a3 = await pop(); log(`결재완료: ${a3}`); if (a3) await ok();
  await S('8-done');
  log(`완료 말풍선: ${await pill()}`);
  await p.click('#rail-bell'); await W(); log(`🔔: ${await p.$eval('#noti .h', e => e.innerText.replace(/\s+/g, ' '))}`); await S('bell-done'); await p.keyboard.press('Escape'); await W();
  if ((await step()) !== 0) bad('8단계 뒤 완료가 아님');

  // 8. 새로고침해도 유지되는지, 그리고 처음부터
  await p.reload(); await p.click('#b-login'); await W(300); log(`새로고침 후 첫 화면: ${await p.$eval('#main', m => m.innerText.replace(/\s+/g, ' ').slice(0, 80))}`);
  await p.click('#rail-bell'); await W(); await p.click('#b-reset'); await W(); log(`처음부터 확인창: ${await pop()}`); await p.click('#b-modal-ok'); await W(300);
  log(`초기화 뒤: ${await pill()} / 역할 ${await p.evaluate(() => curRole())}`);
  await S('reset');
  console.log('\nERRORS', JSON.stringify(errs)); console.log('ISSUES', JSON.stringify(issues));
  await b.close();
})();
