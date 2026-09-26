/* 교과서 선정대장 — Apps Script 웹앱 + 공유 저장소(Google 시트)
 *
 * 교사마다 자기 컴퓨터에서 작업해도 입력 내용이 한곳(배포한 사람의 Google 드라이브에 있는
 * 스프레드시트)에 모이도록, index.html 이 google.script.run 으로 아래 api* 함수를 부른다.
 *
 * 시트 '교사' — 로그인 명단(이름·교과·코드). 교육과정부가 「교사별 코드」 엑셀 내용을 붙여 넣는다.
 *              코드는 이 시트에만 있고 화면(브라우저)으로는 보내지 않는다.
 * 시트 '평가' — 교사 한 명의 과목 하나가 한 줄(키 = 교과|성명|과목). 앞쪽 칸은 사람이 보기 위한
 *              요약이고, 앱은 마지막 '자료(JSON)' 칸만 읽는다.
 * 시트 '절차' — 교과부장 자료(절차 체크리스트·[서식3] 추천 의견, 교과마다 한 줄).
 *
 * 로그인하면 서명한 출입증(token)을 주고, 이후 모든 요청은 출입증의 교과·성명으로만 처리한다.
 * 교사는 자기 평가만 읽고 쓸 수 있고, 교과 전체 제출분은 그 교과의 교과부장만 받는다.
 */
var SHEET_TITLE = "교과서 선정대장 2027 데이터";
var TEACHER_SHEET = "교사";
var TEACHER_HEAD = ["이름", "교과", "코드"];
var EVAL_SHEET = "평가";
var EVAL_HEAD = ["키", "교과", "성명", "과목", "상태", "1위 출판사", "종합의견 및 추천의견", "수정 시각", "자료(JSON)"];
var STEP_SHEET = "절차";
var STEP_HEAD = ["교과", "수정 시각", "자료(JSON)"];
var MAX_JSON = 45000;          // 시트 한 칸은 50,000자까지
var TOKEN_HOURS = 12;          // 출입증 유효 시간 (쓰는 동안 계속 늘어남)
var MAX_FAIL = 5, LOCK_MIN = 10;   // 코드를 5번 틀리면 10분 동안 그 사람은 로그인 불가

/* 교과부장 (index.html 의 DEPT_CHIEFS 와 같게) */
var CHIEFS = {
  "국어과": "김민석", "수학과": "이재영", "영어과": "이민우",
  "생활교양과": "진나현", "예술체육과": "류선희", "사회과": "나경숙", "과학과": "박무근"
};

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('교과서 선정대장')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* 편집기에서 한 번 실행: 권한을 승인하고 데이터 시트를 만든 뒤 주소를 로그에 남긴다. */
function setupSheet() {
  sheet_(TEACHER_SHEET, TEACHER_HEAD);
  sheet_(EVAL_SHEET, EVAL_HEAD);
  sheet_(STEP_SHEET, STEP_HEAD);
  secret_();
  var url = book_().getUrl(), n = teachers_().length;
  Logger.log("데이터 시트: " + url);
  Logger.log(n ? "교사 명단 " + n + "명" : "시트 '교사'에 이름·교과·코드를 붙여 넣어야 로그인할 수 있습니다.");
  return url;
}

/* ── 앱이 부르는 함수 (인자·반환값은 문자열) ── */

/* 로그인: 시트 '교사'의 이름·교과·코드가 맞으면 출입증을 줌 */
function apiLogin(dept, name, code) {
  dept = clean_(dept); name = clean_(name); code = code_(code);
  var cache = CacheService.getScriptCache(), failKey = "fail:" + dept + "|" + name;
  var fails = Number(cache.get(failKey) || 0);
  if (fails >= MAX_FAIL) throw new Error("코드를 " + MAX_FAIL + "번 틀려 " + LOCK_MIN + "분 동안 로그인할 수 없습니다.");
  var list = teachers_();
  if (!list.length) throw new Error("교사 명단이 비어 있습니다. 교육과정부에 문의해 주세요 (데이터 시트의 '교사' 탭).");
  var ok = code && list.some(function (t) { return t.dept === dept && t.name === name && t.code === code; });
  if (!ok) {
    cache.put(failKey, String(fails + 1), LOCK_MIN * 60);
    throw new Error("교과·성명·코드가 맞지 않습니다.");
  }
  cache.remove(failKey);
  var user = { dept: dept, name: name, role: CHIEFS[dept] === name ? "chief" : "teacher" };
  return JSON.stringify({ token: issue_(user), dept: dept, name: name, role: user.role });
}

/* 로그인한 사람의 평가 전부 + (교과부장이면) 그 교과의 교과부장 자료. 출입증도 새로 줌 */
function apiLoad(token) {
  var user = auth_(token), prefix = user.dept + "|" + user.name + "|", evals = [], steps = null;
  rows_(EVAL_SHEET, EVAL_HEAD).forEach(function (r) {
    if (String(r[0]).indexOf(prefix) !== 0) return;
    var ev = parse_(r[8]);
    if (ev) { ev.owner = user.name; evals.push(ev); }
  });
  if (user.role === "chief") {
    rows_(STEP_SHEET, STEP_HEAD).forEach(function (r) {
      if (String(r[0]) === user.dept) steps = parse_(r[2]);
    });
  }
  return JSON.stringify({ evals: evals, steps: steps, token: issue_(user) });
}

/* 교과부장 전용: 그 교과에서 제출된 평가 전부(교사 전원) + 교과 교사 명단(이름만) */
function apiDeptForms(token) {
  var user = auth_(token);
  if (user.role !== "chief") throw new Error("교과부장만 볼 수 있습니다.");
  var prefix = user.dept + "|", out = [];
  rows_(EVAL_SHEET, EVAL_HEAD).forEach(function (r) {
    var key = String(r[0]);
    if (key.indexOf(prefix) !== 0) return;
    var ev = parse_(r[8]);
    if (ev && ev.submitted) { ev.owner = key.split("|")[1]; out.push(ev); }
  });
  var names = teachers_().filter(function (t) { return t.dept === user.dept; }).map(function (t) { return t.name; });
  return JSON.stringify({ evals: out, teachers: names });
}

/* 저장: {evals:[{ev, status, top}], steps:{dept, steps, f3, at}|null}
 * 출입증의 교과·성명과 다른 평가는 받지 않는다(남의 평가를 고칠 수 없음).
 * 같은 사람이 두 컴퓨터에서 고친 경우 더 나중에 고친 쪽(ev.at)이 남는다.
 * 시트에 더 최근 것이 있어 받아들이지 않은 평가는 newer 로 돌려준다. */
function apiSave(token, json) {
  var user = auth_(token);
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
        if (!subject || dept !== user.dept || name !== user.name) return;
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
    if (st && user.role === "chief" && clean_(st.dept) === user.dept) {
      var body2 = JSON.stringify({ steps: st.steps || {}, f3: st.f3 || {}, at: st.at || 0 });
      if (body2.length > MAX_JSON) throw new Error("교과부장 자료가 너무 큽니다.");
      var sdata = values_(ss, STEP_HEAD.length), srow = [txt_(user.dept), new Date(), body2], at = -1;
      sdata.forEach(function (r, i) { if (String(r[0]) === user.dept) at = i; });
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
/* 시트 '교사': [{name, dept, code}] */
function teachers_() {
  return rows_(TEACHER_SHEET, TEACHER_HEAD).map(function (r) {
    return { name: clean_(r[0]), dept: clean_(r[1]), code: code_(r[2]) };
  }).filter(function (t) { return t.name && t.dept; });
}
/* 코드 비교용: 앞뒤 공백 제거, 숫자면 앞의 0 무시 (시트가 045 를 45 로 바꿔도 맞게) */
function code_(v) {
  var s = String(v == null ? "" : v).trim();
  return /^\d+$/.test(s) ? String(parseInt(s, 10)) : s;
}

/* 출입증: "교과|성명|역할|만료시각|서명". 서명은 스크립트 속성의 비밀값으로 만든 HMAC 이라
 * 화면에서 고쳐 쓰면 맞지 않는다. */
function issue_(user) {
  var payload = [user.dept, user.name, user.role, Date.now() + TOKEN_HOURS * 3600000].join("|");
  return payload + "|" + sign_(payload);
}
function auth_(token) {
  var parts = String(token || "").split("|");
  if (parts.length === 5) {
    var payload = parts.slice(0, 4).join("|");
    if (sign_(payload) === parts[4] && Number(parts[3]) > Date.now()) {
      return { dept: parts[0], name: parts[1], role: parts[2] };
    }
  }
  throw new Error("AUTH: 로그인이 만료되었습니다. 다시 로그인해 주세요.");
}
function sign_(payload) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret_()));
}
function secret_() {
  var props = PropertiesService.getScriptProperties(), s = props.getProperty("TOKEN_SECRET");
  if (s) return s;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    s = props.getProperty("TOKEN_SECRET");
    if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty("TOKEN_SECRET", s); }
    return s;
  } finally {
    lock.releaseLock();
  }
}
/* 키에 쓰는 값: 구분자 '|' 제거, 앞뒤 공백 제거 */
function clean_(s) { return String(s == null ? "" : s).replace(/\|/g, "").trim().slice(0, 60); }
/* 사람이 보는 칸: 앞에 ' 를 붙여 숫자·날짜·수식으로 바뀌지 않게 글자 그대로 저장 */
function txt_(s) { s = String(s == null ? "" : s); return s ? "'" + s : ""; }
