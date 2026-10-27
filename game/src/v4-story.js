'use strict';

// Source: 최성보_성장일지_최종_수정요청서.md, sections 1 and 3.
// Dates are a fictional school calendar. All pupils, records and decisions are fictional.
// Tasks keep their existing IDs and administrative rules. Guides and records may be consulted.
// Expression: 0 calm, 1 worried, 2 smile, 3 surprised, 4 focused, 5 bright smile.
// Choice stat: 0 criteria, 1 records, 2 communication. No choice deducts points.
// bonus preserves choices which award two different stats in the supplied script.

const PERSON_ROLES = {
  player: '올해 처음 최성보 업무를 맡은 교사',
  '01': '올해 처음 최성보 업무를 맡은 교사',
  '02': '올해 처음 최성보 업무를 맡은 교사',
  '03': '수학 · 과정부 · 전임 최성보 담당',
  '04': '물리 · 연구부',
  '05': '사회 · 학년부 · 2학년 부장',
  '06': '국어 · 1학년 1반 담임',
  '07': '영어 · 교무부 · 출결·성적 담당',
  '08': '체육 교사',
  '09': '나래 보호자',
  '10': '다온 보호자',
  '11': '1학년 학생',
  '12': '1학년 학생'
};

const DISPLAY_NAMES = {
  '03': '박수학 선생님',
  '04': '김물리 선생님',
  '05': '이사회 선생님',
  '06': '최국어 선생님',
  '07': '윤영어 선생님',
  '08': '전체육 선생님',
  '09': '나래 어머니',
  '10': '다온 아버지',
  '11': '나래',
  '12': '라온'
};

const CHAPTERS = [
  { id: 'chapter1', title: '누구에게, 어떤 지원을?', subtitle: '12월 둘째 주 · 성적 확정 주간', time: '10분', label: '1장', badge: '기준을 읽는 눈' },
  { id: 'chapter2', title: '참여를 기록으로', subtitle: '12월 셋째~넷째 주 · 운영 기간', time: '10분', label: '2장', badge: '기록을 잇는 손' },
  { id: 'chapter3', title: '저장했다고 끝난 건 아니니까', subtitle: '1월 첫째 주 · 종업식 전 마감 주간', time: '7분', label: '3장', badge: '함께 마무리하는 힘' }
];

// The runtime selects the title matching the highest of the three final stats
// and explains the selected stat and score. This file does not invent a tie rule.
const ENDING_TITLES = [
  '꼼꼼한 기준 지킴이',
  '흔들림 없는 기록 장인',
  '함께 길을 찾는 소통가'
];

const STORY = {
  prologue: [
    { id: 'p01-roster', who: 'player', expression: 3, bg: 'office', time: '3월 · 회상', place: '교무실', text: '3월 업무분장표. 내 이름 옆에 적힌 낯선 단어,\n“최소 성취수준 보장지도”.' },
    { id: 'p01-support', who: 'player', expression: 0, bg: 'office', time: '3월 · 회상', place: '교무실', text: '학기 중 예방지도는 선배들 도움으로 겨우 넘겼다.\n진짜는 학기 말이라던데….' },
    { id: 'p02-calendar', who: 'player', expression: 0, bg: 'school', time: '12월 둘째 주 월요일 08:10', place: '재영고등학교 교문', text: '12월 둘째 주 월요일\n성적 확정 주간', kind: 'calendar', button: '교문으로 들어가기' },
    { id: 'p02-arrival', who: 'player', expression: 0, bg: 'school', time: '12월 둘째 주 월요일 08:10', place: '재영고등학교 교문', text: '기말고사가 끝난 지 사흘.\n이번 주는 성적 확정 주간이다.' },
    { id: 'p02-door', who: 'player', expression: 0, bg: 'corridor', time: '12월 둘째 주 월요일 08:15', place: '학교 현관', text: '현관에서 학생들의 인사를 받고 교무실로 향했다.\n오늘은 무엇부터 확인해야 할까.' },
    { id: 'p03-messages', who: 'player', expression: 3, bg: 'office', time: '12월 둘째 주 월요일 08:20', place: '교무실 · 내 책상', text: '메신저 열두 개에 공문까지….\n뭐부터 하지?' },
    { id: 'p03-notice', who: 'player', expression: 4, bg: 'office', time: '12월 둘째 주 월요일 08:20', place: '교무실 · 가상 공문 확인', text: '가상 공문: 「2026학년도 2학기 최소 성취수준 보장지도\n대상 확정 및 운영 안내」' },
    { id: 'p03-beginning', who: 'player', expression: 3, bg: 'office', time: '12월 둘째 주 월요일 08:20', place: '교무실 · 내 책상', text: '드디어 2학기 말..\n최성보 처리의\n시간이 다가왔다!!' },
    { id: 'p03-mentor', who: '03', expression: 2, bg: 'office', time: '12월 둘째 주 월요일 08:20', place: '교무실', text: '선생님, 첫 학기말이죠? 작년엔 제가 이 업무였잖아요.\n막히면 언제든 불러요.' },
    {
      id: 'p03-first-choice', who: 'player', expression: 4, bg: 'office', time: '12월 둘째 주 월요일 08:20', place: '교무실 · 내 책상', text: '무엇부터 할까?', kind: 'choice',
      choices: [
        { text: '공문부터 끝까지 읽는다', response: '좋아요. 올해 기준부터 잡고 가면 흔들리지 않아요.', who: '03', expression: 2, stat: 0, amount: 5 },
        { text: '박수학 선생님께 작년 흐름을 묻는다', response: '자료 보면서 확인해요. 출결, 성적, 대상, 운영, 반영.\n하나씩이에요.', who: '03', expression: 5, stat: 2, amount: 5 },
        { text: '작년 인수인계 파일부터 연다', response: '아, 그 파일 숫자는 작년 기준이에요.\n올해 공문이랑 꼭 대조해요.', who: '03', expression: 4, stat: 1, amount: 5 }
      ]
    },
    { id: 'p03-reference', who: '03', expression: 2, bg: 'office', time: '12월 둘째 주 월요일 08:20', place: '교무실', text: '지침이랑 기록은 옆에 펼쳐 두고 같이 봐요.\n외워서 답할 일이 아니라, 확인해서 해결할 일이니까요.' }
  ],

  chapter1: [
    { id: 'c1-calendar', who: 'player', expression: 0, bg: 'office', time: '12월 둘째 주 화요일 10:40', place: '교무실', text: '12월 둘째 주 · 성적 확정 주간\n누구에게, 어떤 지원을?', kind: 'calendar', button: '업무 일지 펼치기' },
    { id: 'c1-01-attendance-request', who: '07', expression: 1, bg: 'office', time: '12월 둘째 주 화요일 10:40', place: '교무실', text: '선생님, 성적 산출 전에 출결 마감부터 봐야 하는데\n숫자가 안 맞는 과목이 있어요.' },
    { id: 'c1-01-audit', who: '07', expression: 4, bg: 'office', time: '12월 둘째 주 화요일 10:40', place: '교무실 · 출결 기록 대조', text: '학생 출석 횟수 말고,\n강의실별 마감 수를 대조해 주실래요?', kind: 'task', task: 'audit', button: '숫자가 맞지 않는 출결 기록' },
    { id: 'c1-01-math-missing', who: '03', expression: 3, bg: 'office', time: '12월 둘째 주 화요일 10:40', place: '교무실', text: '어머, 수요일 3교시 공통수학2면 제 수업이네요.\n그날 출장이라 보강 들어간 선생님이 마감을 못 하셨나 봐요.' },
    { id: 'c1-01-homeroom-missing', who: '06', expression: 2, bg: 'office', time: '12월 둘째 주 화요일 10:40', place: '교무실', text: '목요일은 저희 반 체험학습 서류 처리하다\n일출결 마감을 놓쳤어요. 바로 할게요.' },
    { id: 'c1-01-prepare', who: '07', expression: 4, bg: 'office', time: '12월 둘째 주 화요일 10:40', place: '교무실', text: '확인한 기록이 51·51·51로 맞는지 보고,\n마감 결과와 준비된 학교 자료까지 확인해 주세요.', kind: 'task', task: 'prepare', button: '학기별 과목출결 마감' },
    { id: 'c1-01-first-step', who: 'player', expression: 0, bg: 'office', time: '12월 둘째 주 화요일 10:40', place: '교무실 · 내 책상', text: '출결이 맞아야 성적도, 대상도 맞는다.\n첫 단추는 끼웠다.' },

    { id: 'c1-02-grades-ready', who: '07', expression: 2, bg: 'office', time: '12월 둘째 주 목요일 15:00', place: '교무실', text: '성적 이의신청 기간 끝났어요.\n학기말 성적도 확정됐고요.' },
    { id: 'c1-02-electives-question', who: '05', expression: 5, bg: 'office', time: '12월 둘째 주 목요일 15:00', place: '교무실', text: '2학년 선택 과목도 성취율 40% 안 되면 보충지도죠?\n대수에 몇 명 있던데요.' },
    { id: 'c1-02-routes', who: '03', expression: 4, bg: 'office', time: '12월 둘째 주 목요일 15:00', place: '교무실 · 학생 자료', text: '학년이랑 과목 유형부터 나눠 봐요.\n공통 과목이랑 선택 과목은 보는 기준이 달라요.', kind: 'task', task: 'routes', button: '기준 계산 · 학생 8명 판정' },
    { id: 'c1-02-correction', who: '05', expression: 2, bg: 'office', time: '12월 둘째 주 목요일 15:00', place: '교무실', text: '아, 선택 과목은 출석으로 보는 거였네요.\n2학년 담임 선생님들께 제가 다시 안내할게요.' },
    { id: 'c1-02-boundaries', who: 'player', expression: 0, bg: 'office', time: '12월 둘째 주 목요일 15:00', place: '교무실 · 내 책상', text: '40%와 32회는 “초과”가 아니라 “이상”.\n경계에 선 학생일수록 한 번 더 보자.' },

    { id: 'c1-03-roster', who: '03', expression: 2, bg: 'office', time: '12월 둘째 주 금요일 09:00', place: '교무실 · 검토용 수기 명단', text: '작년엔 엑셀로 명단을 따로 만들었거든요.\n올해 것도 만들어 봤는데 한번 봐 줄래요?', kind: 'task', task: 'roster', button: '검토 명단의 세 군데 오류' },
    { id: 'c1-03-double-check', who: '03', expression: 5, bg: 'office', time: '12월 둘째 주 금요일 09:00', place: '교무실', text: '역시 제가 만든 건 꼭 누가 봐 줘야 해요.\n라온이를 두 번이나 넣었네요.' },

    { id: 'c1-04-call-request', who: '06', expression: 1, bg: 'corridor', time: '12월 둘째 주 금요일 11:30', place: '조용한 복도 · 전화', text: '다온이 아버님께 대상 예정이라고 미리 말씀드렸더니,\n담당 선생님과 직접 통화하고 싶으시대요.' },
    { id: 'c1-04-exception', who: '10', expression: 1, bg: 'corridor', time: '12월 둘째 주 금요일 11:30', place: '조용한 복도 · 다온 아버지 전화', text: '지난달에 장염으로 입원해서 빠진 건데,\n그것도 출석 부족으로 치는 건가요?', kind: 'task', task: 'exception', button: '아직 확정되지 않은 예외 상담' },
    { id: 'c1-04-follow-up', who: '10', expression: 0, bg: 'corridor', time: '12월 둘째 주 금요일 11:30', place: '조용한 복도 · 다온 아버지 전화', text: '지금 바로는 어렵다는 거죠.\n알겠습니다. 결과 나오면 연락 주세요.' },
    { id: 'c1-04-no-promise', who: 'player', expression: 0, bg: 'corridor', time: '12월 둘째 주 금요일 11:30', place: '조용한 복도', text: '바로 답해 드리고 싶었다.\n그래도 확인하지 않은 걸 약속할 수는 없지.' },

    { id: 'c1-05-school-decision', who: '07', expression: 4, bg: 'office', time: '12월 둘째 주 금요일 14:10', place: '교무실', text: '다온이 건은 학교에서 확인을 마쳤어요.\n이번 사례는 예외 적용 없이 일반 절차로 진행해요.' },
    { id: 'c1-05-import', who: '07', expression: 4, bg: 'office', time: '12월 둘째 주 금요일 14:10', place: '교무실', text: '확인한 다섯 명의 자료를 과목별로 조회해 주세요.\n학교 확인 결과와 명단을 함께 대조해요.', kind: 'task', task: 'import', button: '대상자' },
    { id: 'c1-05-inform-father', who: '06', expression: 0, bg: 'office', time: '12월 둘째 주 금요일 14:10', place: '교무실', text: '다온이 아버님께는\n제가 같이 다시 안내드릴게요.' },

    { id: 'c1-06-student-at-door', who: 'player', expression: 0, bg: 'office', time: '12월 둘째 주 금요일 16:20', place: '교무실 문 앞 · 나래 방문', text: '안내문을 든 나래가\n교무실 문 앞에서 머뭇거리고 있다.' },
    { id: 'c1-06-narae-worry', who: '11', expression: 1, bg: 'office', time: '12월 둘째 주 금요일 16:20', place: '교무실 문 앞', text: '선생님… 저 보충지도 대상이에요?\n다른 애들도 알아요?' },
    {
      id: 'c1-06-narae-choice', who: 'player', expression: 0, bg: 'office', time: '12월 둘째 주 금요일 16:20', place: '교무실 문 앞', text: '나래의 걱정에 어떻게 답할까?', kind: 'choice',
      choices: [
        { text: '명단은 업무에 필요한 선생님들만 봐. 수학 선생님이랑 한 단계씩 같이 해 보자.', response: '걱정됐지. 수학 선생님이랑 한 단계씩 같이 해 보자.', who: 'player', expression: 2, stat: 2, amount: 8 },
        { text: '다들 하는 거니까 너무 신경 쓰지 마.', response: '걱정하는 마음부터 받아 주면 좋겠어요.', who: '03', expression: 2, stat: 2, amount: 2 },
        { text: '점수가 낮으니까 어쩔 수 없지.', response: '사실이어도, 나래한텐 꽤 아프게 들렸을 거예요.', who: '03', expression: 1, stat: 2, amount: 0 }
      ]
    },
    { id: 'c1-06-narae-answer', who: '11', expression: 2, bg: 'office', time: '12월 둘째 주 금요일 16:20', place: '교무실 문 앞', text: '…알겠어요.\n다음 주부터 오면 되는 거죠?' },
    { id: 'c1-06-operation-next', who: 'player', expression: 0, bg: 'office', time: '12월 둘째 주 금요일 16:20', place: '교무실 · 내 책상', text: '안내문은 오늘 담임 선생님들을 통해 나갔다.\n다음 주부터는 운영 기간이다.' },
    { id: 'c1-end', who: 'player', expression: 2, bg: 'office', time: '12월 둘째 주 금요일 16:20', place: '교무실 · 업무 일지', text: '누구에게 어떤 지원이 필요한지,\n자료와 동료의 확인을 이어 첫 장을 마쳤다.', kind: 'chapterEnd', button: '성장 기록 받기 · 기준을 읽는 눈' }
  ],

  chapter2: [
    { id: 'c2-calendar', who: 'player', expression: 0, bg: 'corridor', time: '12월 셋째 주 월요일 08:40', place: '조용한 복도', text: '12월 셋째 주 월요일\n운영 기간이 시작됐다.', kind: 'calendar', button: '다음 주의 일지 펼치기' },
    { id: 'c2-01-parent', who: '09', expression: 1, bg: 'corridor', time: '12월 셋째 주 월요일 08:40', place: '조용한 복도 · 나래 어머니 전화', text: '안내문 받았어요. 나래가 많이 속상해해요.\n보충지도 하면 점수가 40점으로 바뀌는 건가요?', kind: 'task', task: 'parent', button: '걱정되는 보호자에게 설명하기' },
    { id: 'c2-01-mother-answer', who: '09', expression: 0, bg: 'corridor', time: '12월 셋째 주 월요일 08:40', place: '조용한 복도 · 나래 어머니 전화', text: '점수가 바뀌는 건 아니군요.\n그래도 아이를 돕는 시간이라니 마음이 좀 놓여요.' },

    { id: 'c2-02-scheduling', who: '04', expression: 4, bg: 'office', time: '12월 셋째 주 월요일 12:50', place: '교무실', text: '선생님, 추가학습 운영에 관해\n궁금한 게 있어요.' },
    { id: 'c2-02-shortage', who: '04', expression: 4, bg: 'office', time: '12월 셋째 주 월요일 12:50', place: '교무실 · 운영 메모', text: '다온이는 출석이 한 번 부족하니까\n추가학습도 한 시간만 잡으면 되죠?', kind: 'task', task: 'shortage', button: '운영 메모를 바로잡아요' },
    { id: 'c2-02-room-plan', who: '04', expression: 2, bg: 'office', time: '12월 셋째 주 월요일 12:50', place: '교무실', text: '아, 부족한 출석 횟수만 채우는 게 아니군요.\n운영 시수와 참여시수를 구분해야겠네요.' },

    { id: 'c2-03-missing-lessons', who: '03', expression: 1, bg: 'office', time: '12월 넷째 주 화요일 17:10', place: '교무실', text: '라온이가 5차시까지는 잘 왔는데,\n그 뒤로 6·7차시를 연속으로 안 왔어요.' },
    { id: 'c2-03-homeroom-worry', who: '06', expression: 1, bg: 'office', time: '12월 넷째 주 화요일 17:10', place: '교무실', text: '요즘 지각도 잦아요.\n“어차피 수학은 안 돼요”라는 말을 자주 하고요.' },
    { id: 'c2-03-two-chances', who: 'player', expression: 4, bg: 'office', time: '12월 넷째 주 화요일 17:10', place: '교무실 · 참여 기록 확인', text: '참여 기준은 6시수. 남은 건 8·9차시 두 번.\n한 번만 더 오면 된다.' },
    { id: 'c2-03-meeting', who: 'player', expression: 0, bg: 'corridor', time: '12월 넷째 주 화요일 17:10', place: '상담실 · 최국어 선생님과 동행', text: '최국어 선생님과 함께\n상담실에서 라온을 만났다.' },
    { id: 'c2-03-raon-discouraged', who: '12', expression: 1, bg: 'corridor', time: '12월 넷째 주 화요일 17:10', place: '상담실', text: '…가 봤자\n모르는 건 똑같은데요.' },
    {
      id: 'c2-03-raon-plan', who: 'player', expression: 0, bg: 'corridor', time: '12월 넷째 주 화요일 17:10', place: '상담실', text: '라온과 남은 시간을 어떻게 이야기할까?', kind: 'choice',
      choices: [
        { text: '남은 두 번 중 올 수 있는 날을 같이 정해 보자.', response: '남은 두 번 중 올 수 있는 날을\n같이 정해 보자.', who: 'player', expression: 2, stat: 2, amount: 8, flag: 'together_plan' },
        { text: '기준이 6시수야. 안 오면 미이수가 돼.', response: '맞는 말인데,\n라온이한텐 조금 차갑게 들렸을 것 같아요.', who: '06', expression: 1, stat: 0, amount: 5, bonus: [{ stat: 2, amount: 2 }] },
        { text: '괜찮아, 어떻게든 될 거야.', response: '결과를 미리 약속하면\n나중에 더 실망할 수 있어요.', who: '03', expression: 1, stat: 2, amount: 0 }
      ]
    },
    { id: 'c2-03-raon-next-time', who: '12', expression: 1, bg: 'corridor', time: '12월 넷째 주 화요일 17:10', place: '상담실', text: '…다음 시간엔\n가 볼게요.' },

    { id: 'c2-last-day-calendar', who: 'player', expression: 0, bg: 'office', time: '12월 넷째 주 목요일 17:40', place: '교무실', text: '12월 넷째 주 목요일\n운영 마지막 날', kind: 'calendar', button: '마지막 날의 기록 보기' },
    { id: 'c2-04-raon-absence', who: 'player', expression: 1, bg: 'office', time: '12월 넷째 주 목요일 17:40', place: '교무실 · 참여 기록', text: '라온은 끝내\n남은 차시에 오지 못했다.' },
    { id: 'c2-04-draft-arrival', who: '04', expression: 4, bg: 'office', time: '12월 넷째 주 목요일 17:40', place: '교무실', text: '보충지도 다 끝났어요.\n참여 기록이랑 입력 초안 가져왔어요.' },
    { id: 'c2-04-request-one-hour', who: '06', expression: 1, bg: 'office', time: '12월 넷째 주 목요일 17:40', place: '교무실', text: '선생님… 라온이 5시수잖아요.\n노력은 했는데, 한 시간만 인정해 주면 안 될까요?' },
    {
      id: 'c2-04-record-choice', who: 'player', expression: 4, bg: 'office', time: '12월 넷째 주 목요일 17:40', place: '교무실', text: '담임 선생님의 마음은 알지만,\n확인된 기록과 다른 숫자를 입력할 수는 없다.', kind: 'choice',
      choices: [
        { text: '마음은 알지만, 확인된 기록대로 입력해야 해요.', response: '…그렇죠.\n제가 괜히 마음이 앞섰네요.', who: '06', expression: 0, stat: 0, amount: 5, bonus: [{ stat: 2, amount: 5 }] },
        { text: '한 시간 정도는… 괜찮지 않을까요?', response: '그러면 기록이 사실과 달라지고,\n다른 학생들과 기준도 달라져요.', who: '03', expression: 4, stat: 0, amount: 0 }
      ]
    },
    { id: 'c2-04-agree-with-record', who: '06', expression: 0, bg: 'office', time: '12월 넷째 주 목요일 17:40', place: '교무실', text: '…맞아요.\n기록대로 해요.' },
    { id: 'c2-04-evidence', who: '04', expression: 4, bg: 'office', time: '12월 넷째 주 목요일 17:40', place: '교무실 · 기록과 입력 초안', text: '참여 기록과 초안을 나란히 놓고 볼게요.\n어디서 숫자가 달라졌는지 확인해 주세요.', kind: 'task', task: 'evidence', button: '초안의 시수가 왜 다를까요?' },
    { id: 'c2-04-hours', who: 'player', expression: 4, bg: 'office', time: '12월 넷째 주 목요일 17:40', place: '교무실', text: '확인한 실제 참여 기록을\n과목별로 입력하고 대조하자.', kind: 'task', task: 'hours', button: '이수관리' },

    { id: 'c2-review-calendar', who: 'player', expression: 0, bg: 'corridor', time: '12월 마지막 주 월요일 15:00', place: '회의실 앞 복도', text: '12월 마지막 주 월요일\n학교 심의·확정 결과 확인', kind: 'calendar', button: '학교에서 확인한 결과 보기' },
    { id: 'c2-05-review-complete', who: '07', expression: 4, bg: 'corridor', time: '12월 마지막 주 월요일 15:00', place: '회의실 앞 복도', text: '학업성적관리위원회 심의가 끝났어요.\n학교의 최종 확정 결과도 확인했고요.' },
    { id: 'c2-05-school-result', who: '07', expression: 4, bg: 'corridor', time: '12월 마지막 주 월요일 15:00', place: '회의실 앞 복도', text: '이번 사례는 나래·다온·누리·다올은 이수,\n라온이는 최종 미이수예요.' },
    { id: 'c2-05-homeroom-heavy', who: '06', expression: 1, bg: 'corridor', time: '12월 마지막 주 월요일 15:00', place: '회의실 앞 복도', text: '…그렇게 됐네요.' },
    { id: 'c2-05-reflection', who: 'player', expression: 1, bg: 'corridor', time: '12월 마지막 주 월요일 15:00', place: '회의실 앞 복도', text: '기록은 정확하게 했다.\n그런데 마음은 왜 이렇게 무겁지.' },

    { id: 'c2-06-raon-result', who: '12', expression: 1, bg: 'corridor', time: '12월 마지막 주 월요일 16:30', place: '상담실', text: '저 결국\n안 된 거죠.' },
    {
      id: 'c2-06-raon-choice', who: 'player', expression: 0, bg: 'corridor', time: '12월 마지막 주 월요일 16:30', place: '상담실', text: '라온에게 결과를 어떻게 안내할까?', kind: 'choice',
      choices: [
        { text: '이번 결과는 이렇게 확정됐어. 다음에 어떤 지원이 있는지 담임 선생님이랑 확인해서 꼭 알려 줄게.', response: '다음에 어떤 지원이 있는지\n담임 선생님이랑 확인해서 꼭 알려 줄게.', who: 'player', expression: 2, stat: 2, amount: 10 },
        { text: '다음엔 꼭 와야 해.', response: '다음 이야기도 필요하지만,\n지금은 라온이 마음부터요.', who: '06', expression: 0, stat: 2, amount: 3 },
        { text: '괜찮아, 별거 아니야.', response: '라온이한텐\n별거일 수 있어요.', who: '06', expression: 1, stat: 2, amount: 0 }
      ]
    },
    {
      id: 'c2-06-raon-response', who: '12', expression: 1, bg: 'corridor', time: '12월 마지막 주 월요일 16:30', place: '상담실', text: '…네.',
      conditionText: { flag: 'together_plan', yes: '날짜 같이 정해 준 건… 고마웠어요.\n다음엔 처음부터 가 볼게요.', no: '…네.' },
      conditionExpression: { flag: 'together_plan', yes: 2, no: 1 }
    },
    { id: 'c2-end', who: 'player', expression: 0, bg: 'corridor', time: '12월 마지막 주 월요일 16:30', place: '상담실 앞 · 업무 일지', text: '기록은 사실대로, 안내는 학생의 마음을 살피며.\n다음 지원은 학교 계획과 지침을 확인해 안내하자.', kind: 'chapterEnd', button: '성장 기록 받기 · 기록을 잇는 손' }
  ],

  chapter3: [
    { id: 'c3-calendar', who: 'player', expression: 0, bg: 'office', time: '1월 첫째 주 월요일 08:30', place: '교무실', text: '1월 첫째 주 월요일 · 종업식 D-4\n저장했다고 끝난 건 아니니까', kind: 'calendar', button: '마감 주간의 일지 펼치기' },
    { id: 'c3-01-deadline', who: '07', expression: 1, bg: 'office', time: '1월 첫째 주 월요일 08:30', place: '교무실', text: '이번 주 안에 학점반영, 마감, 학생부 반영까지 끝내야 해요.\n종업식이 금요일이라서요.' },
    { id: 'c3-01-quiet-office', who: 'player', expression: 0, bg: 'office', time: '1월 첫째 주 월요일 08:30', place: '교무실 · 내 책상', text: '다들 세특 마무리에 학생부 점검까지….\n교무실이 조용한데 키보드 소리만 크다.' },

    { id: 'c3-02-zero', who: '08', expression: 2, bg: 'office', time: '1월 첫째 주 월요일 10:20', place: '교무실', text: '선생님, 제 강의실은 대상자가 한 명도 없던데요.\n저는 할 거 없죠?', kind: 'task', task: 'zero', button: '0명인 강의실, 끝난 걸까요?' },
    { id: 'c3-02-share', who: '08', expression: 5, bg: 'office', time: '1월 첫째 주 월요일 10:20', place: '교무실', text: '아, 0명이어도 반영이랑 마감은 해야 하는구나.\n체육과 선생님들께도 공유할게요.' },

    { id: 'c3-03-final-audit', who: '07', expression: 3, bg: 'office', time: '1월 첫째 주 화요일 14:00', place: '교무실 · 반영 현황', text: '앗, 영어는 저장만 하고 학점반영을 안 했어요.\n다른 과목도 같이 봐 주실래요?', kind: 'task', task: 'finalAudit', button: '어느 단계가 빠졌을까요?' },

    { id: 'c3-04-colleague-message', who: '05', expression: 4, bg: 'office', time: '1월 첫째 주 수요일 15:30', place: '교무실', text: '1학년 담임 선생님들께\n학생부 자료반영 메시지 보냈어요.' },
    { id: 'c3-04-flow', who: '05', expression: 4, bg: 'office', time: '1월 첫째 주 수요일 15:30', place: '교무실', text: '끝나면 선생님이 마감정보 저장하고\n승인요청하시면 돼요.', kind: 'task', task: 'flow', button: '역할별 반영과 마감' },
    // The flow task owns: request -> pending -> next-morning calendar/message -> result lookup.
    // It must show the supplied inner monologue while pending, not approve on the learner's behalf:
    // "승인요청 완료. 그런데 ‘요청’은 ‘완료’가 아니지. 내일 아침에 다시 확인하자."
    // Thursday 08:20: prepared fictional message "결재 완료(교감 → 교장)" -> result lookup -> 6/6.
    { id: 'c3-04-next-morning-result', who: 'player', expression: 0, bg: 'office', time: '1월 첫째 주 목요일 08:20', place: '교무실 · 결재 결과 확인', text: '요청으로 끝내지 않고,\n결재 완료 결과까지 확인했다.' },

    { id: 'c3-end', who: 'player', expression: 2, bg: 'office', time: '1월 첫째 주 금요일 15:00 · 종업식 날', place: '교무실 · 업무 일지', text: '참여 기록부터 학점반영과 마감까지.\n동료들과 마지막 처리 결과를 확인했다.', kind: 'chapterEnd', button: '성장 기록 받기 · 함께 마무리하는 힘' }
  ],

  epilogue: [
    { id: 'e01-gate', who: 'player', expression: 0, bg: 'school', time: '1월 첫째 주 금요일 16:30 · 종업식 날', place: '재영고등학교 교문', text: '종업식 날 오후.\n교문을 나서는데 익숙한 목소리가 들린다.' },
    { id: 'e02-narae', who: '11', expression: 5, bg: 'school', time: '1월 첫째 주 금요일 16:30 · 종업식 날', place: '재영고등학교 교문', text: '선생님, 방학 잘 보내세요!\n수학 보충, 생각보다 할 만했어요.' },
    { id: 'e03-note-delivery', who: '06', expression: 2, bg: 'school', time: '1월 첫째 주 금요일 16:30 · 종업식 날', place: '재영고등학교 교문', text: '선생님,\n라온이가 이거 전해 달래요.' },
    {
      id: 'e04-raon-note', who: '12', expression: 2, bg: 'school', time: '1월 첫째 주 금요일 16:30 · 종업식 날', place: '교문 · 라온의 쪽지', text: '“선생님, 감사했습니다.”\n— 라온',
      conditionText: { flag: 'together_plan', yes: '“선생님, 다음 학기엔 처음부터 갈게요.”\n— 라온', no: '“선생님, 감사했습니다.”\n— 라온' }
    },
    { id: 'e05-mentor', who: '03', expression: 5, bg: 'school', time: '1월 첫째 주 금요일 16:30 · 종업식 날', place: '재영고등학교 교문', text: '첫 학기말,\n정말 고생 많았어요.' },
    { id: 'e06-names', who: 'player', expression: 2, bg: 'school', time: '1월 첫째 주 금요일 16:30 · 종업식 날', place: '재영고등학교 교문', text: '3월엔 낯설었던 단어가,\n이제는 학생들 이름으로 기억된다.' },
    { id: 'e07-ending', who: 'player', expression: 2, bg: 'school', time: '1월 첫째 주 금요일 16:30 · 종업식 날', place: '재영고등학교 교문', text: '나의 첫 학기말,\n함께 확인하며 쌓은 성장 기록.', kind: 'ending', button: '나의 엔딩과 성장 기록 보기' }
  ]
};
