/* 교과서 선정대장 — Apps Script 웹앱 + 공유 저장소(Google 시트)
 *
 * 교사마다 자기 컴퓨터에서 작업해도 입력 내용이 한곳(배포한 사람의 Google 드라이브에 있는
 * 스프레드시트)에 모이도록, index.html 이 google.script.run 으로 아래 api* 함수를 부른다.
 *
 * 시트 '평가' — 교사 한 명의 과목 하나가 한 줄(키 = 교과|성명|과목). 앞쪽 칸은 사람이 보기 위한
 *              요약이고, 앱은 마지막 '자료(JSON)' 칸만 읽는다.
 * 시트 '절차' — 교과부장의 절차 체크리스트(교과마다 한 줄).
 */
var SHEET_TITLE = "교과서 선정대장 2027 데이터";
var EVAL_SHEET = "평가";
var EVAL_HEAD = ["키", "교과", "성명", "과목", "상태", "1위 출판사", "종합의견 및 추천의견", "수정 시각", "자료(JSON)"];
var STEP_SHEET = "절차";
var STEP_HEAD = ["교과", "수정 시각", "자료(JSON)"];
var MAX_JSON = 45000;  // 시트 한 칸은 50,000자까지

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('교과서 선정대장')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* 편집기에서 한 번 실행: 권한을 승인하고 데이터 시트를 만든 뒤 주소를 로그에 남긴다. */
function setupSheet() {
  sheet_(EVAL_SHEET, EVAL_HEAD);
  sheet_(STEP_SHEET, STEP_HEAD);
  var url = book_().getUrl();
  Logger.log("데이터 시트: " + url);
  return url;
}

/* ── 앱이 부르는 함수 (인자·반환값은 JSON 문자열) ── */

/* 로그인한 사람의 평가 전부 + (교과부장이면) 그 교과의 절차 체크리스트 */
function apiLoad(dept, name) {
  dept = clean_(dept); name = clean_(name);
  var prefix = dept + "|" + name + "|", evals = [], steps = null;
  rows_(EVAL_SHEET, EVAL_HEAD).forEach(function (r) {
    if (String(r[0]).indexOf(prefix) !== 0) return;
    var ev = parse_(r[8]);
    if (ev) { ev.owner = name; evals.push(ev); }
  });
  rows_(STEP_SHEET, STEP_HEAD).forEach(function (r) {
    if (String(r[0]) === dept) steps = parse_(r[2]);
  });
  return JSON.stringify({ evals: evals, steps: steps });
}

/* 교과부장 [서식1] 탭: 그 교과에서 제출된 평가 전부 (교사 전원) */
function apiDeptForms(dept) {
  dept = clean_(dept);
  var prefix = dept + "|", out = [];
  rows_(EVAL_SHEET, EVAL_HEAD).forEach(function (r) {
    var key = String(r[0]);
    if (key.indexOf(prefix) !== 0) return;
    var ev = parse_(r[8]);
    if (ev && ev.submitted) { ev.owner = key.split("|")[1]; out.push(ev); }
  });
  return JSON.stringify(out);
}

/* 저장: {evals:[{ev, status, top}], steps:{dept, steps, at}|null}
 * 같은 사람이 두 컴퓨터에서 고친 경우 더 나중에 고친 쪽(ev.at)이 남는다.
 * 시트에 더 최근 것이 있어 받아들이지 않은 평가는 newer 로 돌려준다. */
function apiSave(json) {
  var req = JSON.parse(json || "{}"), newer = [];
  var sh = sheet_(EVAL_SHEET, EVAL_HEAD), ss = sheet_(STEP_SHEET, STEP_HEAD);  // 잠그기 전에 시트 준비
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var list = Array.isArray(req.evals) ? req.evals : [];
    if (list.length) {
      var data = values_(sh, EVAL_HEAD.length);
      var rowOf = {};
      data.forEach(function (r, i) { rowOf[String(r[0])] = i; });
      var now = new Date(), add = [], addAt = {};
      list.forEach(function (item) {
        var ev = item && item.ev;
        if (!ev) return;
        var dept = clean_(ev.gun), name = clean_(ev.owner), subject = clean_(ev.subject);
        if (!dept || !name || !subject) return;
        var key = dept + "|" + name + "|" + subject, body = JSON.stringify(ev);
        if (body.length > MAX_JSON) throw new Error(subject + ": 자료가 너무 큽니다.");
        var row = [key, txt_(dept), txt_(name), txt_(subject), txt_(item.status), txt_(item.top),
                   txt_(ev.opinion), now, body];
        if (rowOf.hasOwnProperty(key)) {
          var old = parse_(data[rowOf[key]][8]);
          if (old && (old.at || 0) > (ev.at || 0)) { old.owner = name; newer.push(old); return; }
          sh.getRange(rowOf[key] + 2, 1, 1, row.length).setValues([row]);
        } else if (addAt.hasOwnProperty(key)) {
          add[addAt[key]] = row;
        } else {
          addAt[key] = add.length; add.push(row);
        }
      });
      if (add.length) sh.getRange(data.length + 2, 1, add.length, EVAL_HEAD.length).setValues(add);
    }
    var st = req.steps;
    if (st && clean_(st.dept)) {
      var sdata = values_(ss, STEP_HEAD.length), dept = clean_(st.dept);
      var srow = [txt_(dept), new Date(), JSON.stringify({ steps: st.steps || {}, at: st.at || 0 })];
      var at = -1;
      sdata.forEach(function (r, i) { if (String(r[0]) === dept) at = i; });
      ss.getRange((at < 0 ? sdata.length : at) + 2, 1, 1, srow.length).setValues([srow]);
    }
  } finally {
    lock.releaseLock();
  }
  return JSON.stringify({ ok: true, newer: newer });
}

/* ── 내부 도우미 ── */

function book_() {
  var props = PropertiesService.getScriptProperties();
  var ss = open_(props.getProperty("SHEET_ID"));
  if (ss) return ss;
  var lock = LockService.getScriptLock();   // 처음 두 사람이 동시에 열어도 시트는 하나만
  lock.waitLock(20000);
  try {
    ss = open_(props.getProperty("SHEET_ID"));
    if (!ss) {
      ss = SpreadsheetApp.getActiveSpreadsheet()        // 스프레드시트에 붙은 스크립트라면 그 시트
        || SpreadsheetApp.create(SHEET_TITLE);           // 아니면 배포한 사람의 드라이브에 새로 만듦
      props.setProperty("SHEET_ID", ss.getId());
    }
    return ss;
  } finally {
    lock.releaseLock();
  }
}
function open_(id) {
  if (!id) return null;
  try { return SpreadsheetApp.openById(id); } catch (e) { return null; }
}
function sheet_(name, head) {
  var ss = book_(), sh = ss.getSheetByName(name);
  if (!sh) {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      sh = ss.getSheetByName(name);
      if (!sh) {
        sh = ss.insertSheet(name);
        sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight("bold");
        sh.setFrozenRows(1);
      }
    } finally {
      lock.releaseLock();
    }
  }
  return sh;
}
/* 머리줄을 뺀 모든 줄 */
function values_(sh, width) {
  var n = sh.getLastRow() - 1;
  return n > 0 ? sh.getRange(2, 1, n, width).getValues() : [];
}
function rows_(name, head) { return values_(sheet_(name, head), head.length); }
function parse_(s) {
  try { var v = JSON.parse(String(s || "")); return v && typeof v === "object" ? v : null; } catch (e) { return null; }
}
/* 키에 쓰는 값: 구분자 '|' 제거, 앞뒤 공백 제거 */
function clean_(s) { return String(s == null ? "" : s).replace(/\|/g, "").trim().slice(0, 60); }
/* 사람이 보는 칸: 앞에 ' 를 붙여 숫자·날짜·수식으로 바뀌지 않게 글자 그대로 저장 */
function txt_(s) { s = String(s == null ? "" : s); return s ? "'" + s : ""; }
