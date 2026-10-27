
/* Educational tasks, played inside the story stage as conversations with colleagues.
   Fictional data; no connection to NEIS. All controls are tap-only.
   Each task is a list of steps. A step asks one question with options; a correct answer raises rapport with the
   task's colleague by 1, a wrong answer lowers it by 1, and either way the colleague explains and the story moves on. */
const TASK_ROUTES=['보충지도','추가학습','해당 없음'];
const TASK_COURSES=['공통수학2','공통영어2','공통국어2'];
const TASK_STUDENTS=[
 {name:'나래',grade:1,course:'공통수학2',type:'공통',ach:35,att:46,route:0,reasons:['출석은 충족했지만 성취율이 40% 미만이다','출석이 기준보다 많으니 지원이 필요 없다','성취율이 낮으면 보충지도와 추가학습을 모두 한다']},
 {name:'다온',grade:1,course:'공통영어2',type:'공통',ach:65,att:31,route:1,reasons:['성취율은 충족했지만 출석이 32회 미만이다','성취율이 높으면 출석과 관계없이 충족이다']},
 {name:'마루',grade:2,course:'대수',type:'선택',ach:35,att:40,route:2,reasons:['선택 과목은 성취율 기준을 적용하지 않고, 출석은 충족했다','성취율이 35%라 보충지도 대상이다']},
 {name:'라온',grade:1,course:'공통수학2',type:'공통',ach:35,att:31,route:0,reasons:['둘 다 미도달이면 보충지도로 지원하고 추가학습을 따로 부과하지 않는다','둘 다 미도달이니 보충지도와 추가학습을 각각 한다','출석 미달이 먼저이니 추가학습만 한다']},
 {name:'가온',grade:1,course:'공통국어2',type:'공통',ach:40,att:32,route:2,reasons:["40%·32회는 '이상' 기준에 포함된다",'기준을 넘지 않았으니(초과가 아님) 보충지도 대상이다']},
 {name:'누리',grade:1,course:'공통국어2',type:'공통',ach:39,att:32,route:0,reasons:['출석 32회는 충족, 성취율 39%는 40% 미만이다','39%는 40%에 가까우니 충족으로 본다','출석이 기준과 같아 추가학습도 필요하다']},
 {name:'다올',grade:1,course:'공통영어2',type:'공통',ach:40,att:31,route:1,reasons:['성취율 40%는 충족, 출석 31회는 32회 미만이다','성취율이 기준과 같아 보충지도도 필요하다']},
 {name:'여울',grade:2,course:'대수',type:'선택',ach:39,att:32,route:2,reasons:['선택 과목은 출석 기준으로 판단한다','39%이면 모든 과목에서 미이수다']}
];
// Wrong-answer labels for the merged route+reason question, in the same order as reasons[1..].
const TASK_WRONG_ROUTES={나래:['해당 없음','보충지도+추가학습'],다온:['해당 없음'],마루:['보충지도'],라온:['보충지도+추가학습','추가학습'],가온:['보충지도'],누리:['해당 없음','보충지도+추가학습'],다올:['보충지도+추가학습'],여울:['보충지도']};
const TASK_RECORDS=[
 {name:'나래',course:0,route:0,hours:6,sessions:[1,2,3,4,5,6]},
 {name:'라온',course:0,route:0,hours:5,sessions:[1,2,3,4,5]},
 {name:'다온',course:1,route:1,hours:6,sessions:[1,2,3,4,7,9]},
 {name:'누리',course:2,route:0,hours:9,sessions:[1,2,3,4,5,6,7,8,9]},
 {name:'다올',course:1,route:1,hours:6,sessions:[1,2,3,4,5,6],online:[5,6]}
];
const TASK_META={
 audit:['숫자가 맞지 않는 출결 기록','07','기록의 수와 담당을 분리해서 확인했어요.',1,12,'출결 마감 수는 학생 개인의 출석 횟수와 다릅니다.'],
 prepare:['학기별 과목출결 마감','07','출결 해결 결과와 성적·학교 계획의 준비 자료를 확인했어요.',1,8,'누락 확인 → 담당자 처리 → 결과 대조 → 과목 마감.'],
 routes:['학생별 지원 경로','03','8명의 경로와 근거를 확정했어요. 업무 책상의 판정표에서 다시 볼 수 있어요.',0,18,'공통·선택을 나누고 성취율과 출석을 따로 확인합니다.'],
 roster:['수기 명단을 함께 검토해요','03','중복과 과목 유형을 확인하고 누락 학생을 보완했어요.',1,10,'수기 명단은 학생 자료와 확정 판정을 대조합니다.'],
 exception:['보호자 전화 상담','10','확인할 자료와 학교 절차, 다시 안내할 담당을 구체적으로 설명했어요.',2,12,'예외는 자료·적용 기준·학교의 심의와 결정 절차를 확인합니다.'],
 import:['대상자 확인','07','세 과목 5명의 명단과 학교의 예외 확인 결과를 대조했어요.',1,8,'가져온 대상자와 학교에서 확인한 명단을 대조합니다.'],
 parent:['보호자 전화 상담','09','나래의 걱정을 듣고 보충지도의 의미와 다음 안내를 전했어요.',2,12,'원점수를 바꾸는 것과 이수를 위한 지원을 구분합니다.'],
 shortage:['추가학습은 얼마나 운영하나요?','04','정규수업 출석 부족과 지원 운영 시수를 구분했어요.',0,10,'참여 기준은 총 운영 시수의 2/3입니다.'],
 evidence:['초안의 시수가 왜 다를까요?','04','계획·기준·중복 증빙 대신 실제 참여를 기록했어요.',1,10,'실제 참여를 확인하고 학교의 최종 이수 결정과 구분합니다.'],
 hours:['참여시수 입력·저장','03','세 과목의 실제 참여 기록을 저장했어요. 최종 이수는 학교 확인 결과와 구분해요.',1,12,'입력값은 계획 시수나 목표 시수가 아니라 확인된 실제 참여입니다.'],
 zero:['대상자가 없는 강의실','08','대상자 0명인 체육도 반영·마감·학생부 상태를 확인했어요.',0,8,'대상자 0명과 모든 후속 처리 완료는 같은 뜻이 아닙니다.'],
 finalAudit:['저장 이후의 반영 현황','07','누락 위치와 다음 담당을 찾아, 요청 상태와 결재 완료를 구분했어요.',0,10,'저장·학점반영·교과마감·학생부 반영·결재는 각각 확인합니다.'],
 flow:['역할별 반영과 마감','05','다음 날 도착한 결재 완료 결과까지 확인했어요.',2,10,'승인요청 뒤에도 결재 완료 결과를 확인합니다.'],
 schoolMemo:['다음 담당자에게 남기는 세 문장','03','자료·함께 확인할 사람·확인 시점을 인수인계 메모로 남겼어요.',2,10,'기억을 전달하기보다 확인할 자료와 협업 순서를 남깁니다.']
};
const TASK_REFS={
 audit:'운영 자료 PDF22쪽 · 서울 Ⅳ장82~83·86쪽',prepare:'운영 자료 PDF22쪽 · 서울 Ⅳ장82~83·86쪽',routes:'운영 자료 PDF7~9·20쪽 · 학점 이수 QnA6·17~18쪽',roster:'운영 자료 PDF7~9·20쪽 · 학점 이수 QnA6·17~18쪽',exception:'학점 이수 QnA12쪽',import:'서울 Ⅳ장87~90쪽 · 학점 이수 QnA27~28쪽',parent:'운영 자료 PDF9·20·23쪽 · 학점 이수 QnA18·28쪽',shortage:'운영 자료 PDF9·20쪽 · 학점 이수 QnA18쪽',evidence:'운영 자료 PDF9·20·23쪽 · 학점 이수 QnA18·28쪽',hours:'서울 Ⅳ장91~93쪽 · 학점 이수 QnA28쪽',zero:'운영 자료 PDF22~23쪽 · 학점 이수 QnA28~29쪽 · 서울 Ⅳ장93쪽',finalAudit:'서울 Ⅳ장93~95쪽 · 학점 이수 QnA28~29쪽',flow:'서울 Ⅳ장82~83·93~95쪽 · 학점 이수 QnA28~29쪽',schoolMemo:'학교 운영 계획·기록·역할별 처리 결과를 인수인계하는 가상 활동'
};
const TASK_FLOW=[['학점반영','교과 담당'],['교과마감','교과 담당'],['학생부 자료반영','담임선생님'],['마감정보 저장','업무 담당'],['승인요청','업무 담당'],['결재 완료 결과 확인','업무 담당']];
const TASK_MEMO_OPTIONS=[
 {title:'대상 확정 전',data:['올해 지침과 학생별 성취율·출석 자료','작년 인수인계와 올해 달라진 기준'],who:['교과 담당·담임선생님·최성보 담당','전임 담당자와 교무부 담당'],when:['대상 명단을 확정하기 전에','학생·보호자에게 안내하기 전에']},
 {title:'참여 기록 저장 전',data:['출석표와 학습 기록의 날짜·차시','운영 계획과 중복 증빙 여부'],who:['운영 교과 선생님과 담임선생님','기록을 작성한 선생님과 업무 담당'],when:['실제 참여시수를 저장하기 전에','학교의 최종 확인 자료를 정리할 때']},
 {title:'반영·마감 이후',data:['학점반영·교과마감·학생부 반영 현황','마감정보와 결재문서의 처리 결과'],who:['교과 담당·담임선생님·업무 담당','교무부 담당과 역할별 처리 담당'],when:['승인요청 후 결재 결과가 나왔을 때','종업식 전 최종 점검 때']}
];
const TASK_CALLS={
 parent:[
  {question:'안내문 받았어요. 나래가 많이 속상해해요. 보충지도 하면 점수가 40점으로 바뀌나요?',options:['나래도 어머님도 걱정되셨겠어요. 먼저 어떤 점이 가장 걱정되는지 듣고, 점수와 이수 절차를 나눠 설명드릴게요.','걱정되시죠. 일단 참여하면 이수는 되니까 너무 염려하지 않으셔도 돼요.','보충지도는 점수를 바꾸는 제도가 아닙니다. 자세한 내용은 안내문을 읽어 주세요.'],good:0,reaction:'나래가 친구들한테 알려질까 봐도 걱정하더라고요. 점수가 바뀌는 건 아닌가요?',bad:['','그럼 참여만 하면 이수가 확정이라는 말씀이죠?','안내문만 봐서는 잘 모르겠어서 전화드린 건데요…'],hint:'걱정을 먼저 듣고, 확인 전 이수를 약속하지 않아요.'},
  {question:'점수가 바뀌는 게 아니라면, 어떤 도움을 받는 건가요?',options:['성적표에는 그대로지만 참여하는 만큼 점수를 보완해 주는 시간이라고 보시면 돼요.','보충지도는 원점수를 바꾸는 게 아니라, 과목 이수를 위해 부족한 배움을 돕는 시간이에요. 참여 기록과 학교의 확인 절차를 거쳐 결과를 안내해요.','일단 6시간만 채우면 결과는 같으니까 시간만 맞춰 보내 주세요.'],good:1,reaction:'점수를 올려 주는 건 아니군요. 아이가 배울 수 있게 돕는 시간이라니 조금 안심돼요.',bad:['그럼 점수가 따로 올라가는 게 맞나요?','','시간만 채우면 된다는 거죠?'],hint:'원점수·실제 참여·학교의 최종 확인 결과를 구분해서 설명해요.'},
  {question:'앞으로는 누구에게 무엇을 확인하면 될까요?',options:['담임선생님과 수학 선생님이 안내한 일정에 참여하도록 함께 도와주세요. 실제 참여를 확인하고 학교에서 결과를 확인한 뒤 담임선생님과 다시 안내드릴게요.','일정만 지키시면 제가 지금 이수된 것으로 생각하고 다음 안내를 드릴게요.','모든 문의는 수학 선생님께만 해 주세요. 저는 명단만 처리해요.'],good:0,reaction:'알겠습니다. 나래에게도 그렇게 설명할게요. 결과가 확인되면 다시 알려 주세요.',bad:['','이미 이수된 것으로 안내해도 되는 건가요?','어떤 선생님께 무엇을 물어봐야 할지 아직 어렵네요.'],hint:'다음 확인 내용·협업할 담당·안내 시점을 구체적으로 전해요.'}
 ],
 exception:[
  {question:'다온이가 장염으로 입원해서 수업을 빠졌는데, 이것도 출석 부족으로 보는 건가요?',options:['입원 자료를 제출하시면 예외로 인정될 가능성이 높으니 우선 걱정 안 하셔도 돼요.','입원까지 해서 많이 걱정되셨겠어요. 진료·입원 관련 자료와 출결 기록, 적용할 기준을 먼저 확인한 뒤 학교의 절차에 따라 안내드릴게요.','기록이 31회라서 예외는 안 됩니다. 추가학습을 하셔야 해요.'],good:1,reaction:'그럼 입원 자료를 드리면 바로 인정되는 건 아닌 거군요?',bad:['그럼 자료만 내면 인정된다고 안내해도 될까요?','','입원한 사정은 확인하지 않아도 되는 건가요?'],hint:'공감하되 인정·불인정을 자료 확인 전에 확정하지 않아요.'},
  {question:'어떤 내용을 확인해야 하나요?',options:['객관적인 자료와 실제 출결 기록을 맞추고, 해당하는 적용 기준과 학교의 심의·결정 절차를 확인해야 해요.','입원 기간만 확인되면 제가 담당자 권한으로 예외 처리할 수 있어요.','다른 학생과 같은 기준을 쓰면 되니까 별도 자료는 받지 않을게요.'],good:0,reaction:'알겠습니다. 필요한 자료를 담임선생님께 전달하겠습니다.',bad:['','학교에서 별도로 결정할 필요는 없다는 거죠?','자료를 제출해도 검토를 받지 못하는 건가요?'],hint:'자료 확인과 학교의 결정 절차를 건너뛰지 않아요.'},
  {question:'확인되면 어떻게 연락받으면 될까요?',options:['결정 전이지만 우선 예외로 안내하고, 달라지면 수정해 드릴게요.','학기 말까지 기다리시면 나이스에 표시될 거예요.','담임선생님과 자료를 확인해 학교의 검토·결정 결과가 나오면 함께 다시 안내드릴게요. 지금은 결과를 단정하지 않겠습니다.'],good:2,reaction:'지금 바로 확정할 수는 없다는 말씀이죠. 확인 결과 나오면 연락 주세요.',bad:['그럼 지금은 예외 적용으로 알고 있으면 될까요?','어디에, 언제 다시 물어보면 되는지 알려 주세요.',''],hint:'학교 확인 뒤 누가 다시 안내할지 연결해요.'}
 ]
};

/* ---------- helpers ---------- */
function taskState(id=activeTask){return S.tasks[id]||(S.tasks[id]={});}
function taskDataRows(headers,rows,cls='data-table',mark=-1){return `<div class="table-scroll"><table class="${cls}"><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr${i===mark?' class="is-marked"':''}>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function taskStatus(text,done=false){return `<span class="status-chip ${done?'done':'pending'}">${done?'✓':'○'} ${esc(text)}</span>`;}
function taskCard(title,body){return `<div class="ev-card">${title?`<h4>${esc(title)}</h4>`:''}${body}</div>`;}
function q(say,options,answer,ok,no,extra={}){return {say,options,answer,ok,no,...extra};}
const routeLabel=r=>TASK_ROUTES[r];

/* ---------- step builders (evidence may depend on the answers so far) ---------- */
const TASK_BUILD={
 audit(t){const names=['공통수학2','공통영어2','대수','물리학'],teach=[50,51,51,51],home=[51,50,51,51];
  const table=i=>taskCard('강의실별 마감 수',taskDataRows(['과목','시간표','교과 마감','담임 마감'],names.map((n,k)=>[n,51,teach[k],home[k]]),'data-table',i));
  const opt=['교과 담당','담임선생님','문제없음'];
  return [
   q('공통수학2는 시간표 51, 교과 마감 50, 담임 마감 51이에요. 누구에게 확인을 부탁할까요?',opt,0,'맞아요. 교과 마감이 한 번 비어 있으니 교과 담당 선생님께 확인해요.','수학은 교과 교시 마감이 50회예요. 교과 담당 선생님께 확인을 부탁하면 돼요.',{evidence:table(0)}),
   q('공통영어2는 시간표 51, 교과 마감 51, 담임 마감 50이에요. 누구에게 확인을 부탁할까요?',opt,1,'네. 담임 일출결 마감이 하나 비었으니 담임선생님께 확인해요.','영어는 담임 일출결 마감이 50회예요. 담임선생님께 확인을 부탁하면 돼요.',{evidence:table(1)}),
   q('대수는 세 숫자가 모두 51이에요. 어떻게 할까요?',opt,2,'맞아요. 세 수가 같으니 대수는 문제없어요.','대수는 시간표·교과 마감·담임 마감이 모두 51로 같아요. 문제없음이에요.',{evidence:table(2)}),
   q('물리학도 세 숫자가 모두 51이에요. 어떻게 할까요?',opt,2,'네. 물리학도 문제없어요.','물리학도 세 수가 51로 같으니 문제없음이에요.',{evidence:table(3)}),
   q('그럼 담당 선생님들께 어떻게 요청할까요?',['원장을 확인한 뒤 담당자가 누락을 처리하고 51/51/51로 다시 대조해요.','대상자를 먼저 만든 뒤 마감 수는 나중에 맞춰요.','시간표 수를 마감된 숫자에 맞춰 수정해요.'],0,'좋아요. 담당자가 처리한 뒤 다시 대조하는 순서가 맞아요.','시간표나 학생 출석을 임의로 맞추지 않아요. 담당자가 누락을 처리한 뒤 51/51/51로 다시 대조해요.')
  ];},
 prepare(t){const ev=taskCard('담당 선생님들이 처리한 결과',taskDataRows(['과목','시간표','교과 마감','담임 마감'],TASK_COURSES.map(c=>[c,51,51,51])));
  return [
   q('누락이 해결되어 세 과목 모두 51·51·51이에요. 다음 순서는요?',['학기별 과목 마감을 확인해요','대상자 가져오기부터 해요','누락 기록을 다시 수정해요'],0,'맞아요. 해결된 기록을 대조했으니 과목 마감을 확인해요.','이미 해결된 누락을 다시 고치지 않아요. 51·51·51 대조 뒤에는 학기별 과목 마감을 확인해요.',{evidence:ev}),
   q('과목 마감을 확인했어요. 그다음 준비된 자료는 무엇을 볼까요?',['성적 전체 마감과 결재 승인 완료 결과','학생부 자료반영 결과','학생별 참여시수 입력 화면'],0,'네. 성적 마감과 승인 완료 결과를 확인한 뒤에 대상자를 만들어요.','대상자를 만들기 전에는 성적 전체 마감과 승인 완료 결과를 확인해요. 학생부와 참여시수는 뒤의 단계예요.',{evidence:ev}),
   q('학교 운영 계획과 심의·결정 자료는요?',['준비된 학교 자료를 확인했어요','계획 없이 바로 대상자를 만들어요'],0,'좋아요. 학교의 계획과 결정 자료를 먼저 확인하는 게 맞아요.','대상자를 만들기 전에 학교 운영 계획과 심의·결정 자료를 확인해요.')
  ];},
 routes(t){const steps=[
   q('먼저 기준부터요. 3학점 과목의 학점 기준 횟수는 몇 회일까요? 실제 시간표 수업은 51회예요.',[51,48,32],1,'맞아요. 3×16=48회예요. 실제 시간표 51회와 구분해요.','학점 기준 횟수는 3×16=48회예요. 실제 시간표 51회와 구분해요.',{kind:'number'}),
   q('출석 기준은 48회의 3분의 2예요. 몇 회일까요?',[48,32,16],1,'네. 32회예요.','48회의 2/3은 32회예요.',{kind:'number'}),
   q('공통 과목의 성취율 기준은 몇 % 이상일까요?',[40,60,50],0,'맞아요. 40% 이상이에요. 선택 과목에는 적용하지 않아요.','공통 과목 성취율은 40% 이상을 확인해요. 선택 과목에는 적용하지 않아요.',{kind:'number'})
  ];
  TASK_STUDENTS.forEach((s,i)=>{const right=`${routeLabel(s.route)} · ${s.reasons[0]}`;const wrong=s.reasons.slice(1).map((r,k)=>`${TASK_WRONG_ROUTES[s.name][k]} · ${r}`);const options=[...wrong];const answer=i%(wrong.length+1);options.splice(answer,0,right);
   const ev=taskCard(`${s.name} · ${s.course}(${s.type} 과목)`,`<div class="ev-student">${studentFace(s.name)}<div class="ev-stats"><div><span>성취율</span><b>${s.ach}%</b><small>${s.type==='선택'?'기준 미적용':'기준 40% 이상'}</small></div><div><span>출석</span><b>${s.att}회</b><small>기준 32회 이상</small></div></div></div>`);
   steps.push(q(`${s.name}는 ${s.course}(${s.type}) 성취율 ${s.ach}%, 출석 ${s.att}회예요. 어떤 지원이 맞을까요?`,options,answer,`맞아요. ${s.name}는 ${routeLabel(s.route)}. ${s.reasons[0]}.`,`${s.name}는 ${routeLabel(s.route)}이에요. ${s.reasons[0]}.`,{evidence:ev,student:s.name}));});
  return steps;},
 roster(t){const draft=[[0,0],[1,1],[3,0],[3,1],[2,0],[6,1]],ok=[1,1,1,0,0,1];
  const rows=draft.map(([si,r])=>{const s=TASK_STUDENTS[si];return [studentLabel(s.name),s.course,`${s.ach}%`,`${s.att}회`,routeLabel(r)];});
  const table=i=>taskCard('수기 검토 명단',taskDataRows(['학생','과목','성취율','출석','초안'],rows,'data-table',i));
  const why=['나래는 공통 과목에서 출석은 충족, 성취율 35%라 보충지도가 맞아요.','다온은 성취율 65%지만 출석 31회라 추가학습이 맞아요.','라온은 성취율과 출석이 모두 미도달이라 보충지도로 지원해요.','라온이 추가학습 줄에 또 있어요. 둘 다 미도달이면 보충지도 하나로 지원하니 이 줄은 지워야 해요.','마루는 선택 과목(대수)이라 성취율 기준을 적용하지 않고, 출석 40회는 충족이에요. 지원 대상이 아니에요.','다올은 성취율 40%는 충족, 출석 31회라 추가학습이 맞아요.'];
  const steps=draft.map(([si,r],i)=>{const s=TASK_STUDENTS[si];return q(`${i+1}번째 줄, ${s.name} · ${s.course} · ${s.ach}% · ${s.att}회 · 초안 ${routeLabel(r)}. 어때요?`,['이상 없음','수정 필요'],ok[i]?0:1,`맞아요. ${why[i]}`,why[i],{evidence:table(i)});});
  steps.push(q('지원 대상인데 명단에서 빠진 학생이 있어요. 누구일까요?',[4,5,7].map(i=>{const s=TASK_STUDENTS[i];return `${s.name} · ${s.course} · ${s.ach}% · ${s.att}회`;}),1,'맞아요. 누리는 출석 32회 충족, 성취율 39%라 보충지도 대상인데 명단에 없었어요.','누리예요. 출석 32회는 충족이지만 성취율 39%는 40% 미만이라 보충지도 대상이에요. 가온과 여울은 기준을 충족했어요.',{evidence:table(-1)}));
  steps.push(q('라온이 두 줄에 있으면 무엇이 문제일까요?',['보충지도·추가학습을 중복 부과하게 된다','서로 다른 지원이므로 문제없다'],0,'네. 둘 다 미도달이면 보충지도 하나로 지원해요.','둘 다 미도달인 학생에게 보충지도와 추가학습을 각각 부과하지 않아요. 한 줄로 정리해요.'));
  return steps;},
 exception(t){return TASK_CALLS.exception.map(r=>q(r.question,r.options,r.good,r.reaction,r.bad,{who:'10',hint:r.hint,call:true}));},
 parent(t){return TASK_CALLS.parent.map(r=>q(r.question,r.options,r.good,r.reaction,r.bad,{who:'09',hint:r.hint,call:true}));},
 import(t){const ev=taskCard('대상자 가져오기 결과',taskDataRows(['성명','과목','학점','지원 경로','예외 적용'],TASK_RECORDS.map(r=>[studentLabel(r.name),TASK_COURSES[r.course],3,routeLabel(r.route),'없음'])));
  return [
   q('대상자 명단은 어떻게 만들까요?',['대상자 가져오기로 자동 생성해요','예정 인원을 계산해서 직접 입력해요','작년 명단을 복사해요'],0,'맞아요. 성적·출결 자료를 바탕으로 자동 생성돼요.','대상자는 가져오기로 자동 생성돼요. 인원을 미리 계산하거나 직접 입력하지 않아요.'),
   q('세 과목에서 5명이 나왔어요. 이 명단은 무엇과 대조할까요?',['학교에서 확인한 명단과 예외 확인 결과','작년 대상자 명단','대조하지 않고 바로 저장'],0,'네. 학교 확인 결과와 대조해요.','가져온 대상자는 학교에서 확인한 명단·예외 확인 결과와 대조해요.',{evidence:ev}),
   q('다온이의 예외 적용 칸이 "없음"이에요. 어떻게 볼까요?',['학교의 확인·결정 결과에 따라 표시된 것이니 그대로 둬요','보호자 문의가 있었으니 제가 예외로 바꿔요','칸을 비워 두고 나중에 결정해요'],0,'맞아요. 예외는 학교의 확인과 결정 절차를 거친 결과예요.','예외 적용은 담당자가 임의로 바꾸지 않아요. 학교의 확인·결정 결과대로 둬요.',{evidence:ev})
  ];},
 shortage(t){const ev=taskCard('가상 학교 운영 계획','<p>3학점 과목 · 학점당 3시수<br>총 운영 9시수 · 실제 참여 기록으로 확인<br>라온은 공통수학2의 성취율과 출석이 모두 미도달한 사례</p>');
  return [
   q('3학점 과목이면 추가학습 총 운영 시수는 몇 시수일까요?',[1,6,9],2,'맞아요. 학점당 3시수니까 9시수예요. 출석이 한 번 부족한 것과는 다른 숫자예요.','학점당 3시수라 총 운영 9시수예요. 부족한 정규 출석 횟수를 채우는 게 아니에요.',{kind:'number',evidence:ev}),
   q('라온은 성취율과 출석이 모두 미도달이에요. 어떤 지원이 필요할까요?',['보충지도 하나로 지원','보충지도와 추가학습을 각각 배정','추가학습만 배정'],0,'네. 둘 다 미도달이면 보충지도 하나로 지원해요.','둘 다 미도달이면 보충지도로 지원하고 추가학습을 따로 부과하지 않아요.',{evidence:ev}),
   q('총 운영 9시수일 때 참여 기준은 몇 시수일까요?',[3,6,9],1,'맞아요. 9시수의 3분의 2, 6시수예요.','참여 기준은 총 운영 시수의 2/3이라 6시수예요.',{kind:'number',evidence:ev}),
   q('그럼 총 운영 12시수라면 참여 기준은요?',[6,8,12],1,'네. 12시수의 3분의 2, 8시수예요.','12시수의 2/3은 8시수예요.',{kind:'number',evidence:ev})
  ];},
 evidence(t){const ev=taskCard('출석부와 입력 초안',taskDataRows(['학생','초안','출석부'],[[studentLabel('나래'),'9시수','1~6차시 출석 / 7~9차시 미참여'],[studentLabel('라온'),'6시수','1~5차시 출석 / 6~9차시 미참여']]));
  return [
   q('나래의 실제 참여시수는 몇 시수일까요?',[5,6,9],1,'맞아요. 출석부에 1~6차시만 있으니 6시수예요.','출석부에는 1~6차시 출석만 있어요. 실제 참여는 6시수예요.',{kind:'number',evidence:ev}),
   q('나래 초안은 9시수로 되어 있어요. 어떻게 수정할까요?',['계획한 9시수 대신 실제 참여 6시수로 수정해요','계획한 시수대로 9시수를 입력해요'],0,'네. 계획이 아니라 실제 참여를 기록해요.','입력값은 계획 시수가 아니라 실제 참여예요. 6시수로 수정해요.',{evidence:ev}),
   q('라온의 실제 참여시수는요?',[5,6,9],0,'맞아요. 1~5차시, 5시수예요.','출석부에는 1~5차시 출석만 있어요. 5시수예요.',{kind:'number',evidence:ev}),
   q('라온 초안은 6시수예요. 어떻게 할까요?',['확인된 실제 참여 5시수로 수정해요','이수를 위해 6시수로 입력해요'],0,'네. 기준을 채우려고 없는 시간을 더하지 않아요.','사실과 다른 시간을 더하지 않아요. 확인된 5시수로 수정해요. 이수 여부는 학교 확인 결과와 구분해요.',{evidence:ev})
  ];},
 hours(t){const steps=[];TASK_RECORDS.forEach((r,i)=>{const rows=TASK_RECORDS.map((x,k)=>({...x,k})).filter(x=>x.course===r.course);
   const ev=taskCard(`${TASK_COURSES[r.course]} 출석부`,taskDataRows(['학생',...Array.from({length:9},(_,n)=>`${n+1}`)],rows.map(x=>[studentLabel(x.name),...Array.from({length:9},(_,n)=>x.sessions.includes(n+1)?x.online?.includes(n+1)?'●온':'●':'—')]),'data-table att-table',rows.findIndex(x=>x.k===i))+`<p class="helper-text">● 출석 / — 미참여 / ●온 승인된 온라인 차시. 총 운영 9시수 · 참여 기준 6시수.</p>${taskCard('입력 현황',`<div class="segment">${TASK_RECORDS.map((x,k)=>{const v=t.answers?.[k];return `<span class="status-chip ${v===undefined?'':v>=6?'done':'pending'}">${x.name} ${v===undefined?'미입력':v+'시수 · '+(v>=6?'이수':'미이수')}</span>`;}).join('')}</div>`)}`);
   steps.push(q(`${TASK_COURSES[r.course]} · ${r.name}의 실제 참여시수를 입력해 주세요.`,[0,1,2,3,4,5,6,7,8,9],r.hours,`맞아요. ${r.name}는 ${r.hours}시수, ${r.hours>=6?'이수':'미이수'}로 자동 표시돼요.`,`출석부를 보면 ${r.name}는 ${r.hours}시수예요. ${r.hours>=6?'이수':'미이수'}로 자동 표시돼요.`,{kind:'number',evidence:ev}));});
  return steps;},
 zero(t){const ev=i=>taskCard('체육 강의실 · 1월 현황',taskDataRows(['과목','대상','성적일람표','학점반영','교과마감','학생부'],[['체육',0,'준비됨',taskStatus(i>=1?'반영 확인':'확인 전',i>=1),taskStatus(i>=1?'마감 확인':'확인 전',i>=1),taskStatus(i>=2?'반영 확인':'미반영',i>=2)]]));
  return [
   q('제 강의실은 대상자가 0명인데, 저는 뭘 하면 되죠?',['성적일람표를 확인하고 학점반영·교과마감 결과까지 확인해요','대상자가 없으니 아무 처리 없이 끝내요','화면을 진행하려면 학생 한 명을 추가해요'],0,'아, 0명이어도 반영이랑 마감은 확인해야 하는구나.','대상자가 0명이어도 성적일람표와 반영·마감 결과는 확인해야 해요. 학생을 추가하는 단계가 아니에요.',{evidence:ev(0)}),
   q('그다음엔 담임선생님과 무엇을 확인할까요?',['학생부 해당 과목 자료반영 결과를 확인해요','교과마감이 끝났으니 학생부도 자동 완료로 봐요','대상자 목록만 다시 불러와요'],0,'네. 학생부 반영은 담임선생님이 따로 확인해요.','교과마감 뒤에도 담임선생님의 학생부 자료반영 결과를 따로 확인해요.',{evidence:ev(1)})
  ];},
 finalAudit(t){const names=['공통수학2','공통영어2','공통국어2','체육'],st=[[1,1,1,0],[1,0,0,0],[1,1,1,1],[1,1,1,1]];
  const ev=i=>taskCard('1월 마감 주간 현황',taskDataRows(['과목','참여 저장','학점반영','교과마감','학생부 반영'],names.map((n,k)=>[n,...st[k].map(s=>taskStatus(s?'완료':'미완료',!!s))]),'data-table',i));
  return [
   q('공통수학2에서 아직 안 된 처리는 무엇일까요?',['학생부 반영','교과마감','없음 · 모두 완료'],0,'맞아요. 수학은 학생부 반영만 남았어요.','수학은 참여 저장·학점반영·교과마감은 끝났고 학생부 반영이 미완료예요.',{evidence:ev(0)}),
   q('공통영어2는요?',['학점반영·교과마감·학생부 반영 세 단계','참여 저장만','없음 · 모두 완료'],0,'네. 영어는 저장만 하고 세 단계가 남았어요.','영어는 참여 저장만 되어 있고 학점반영·교과마감·학생부 반영이 모두 미완료예요.',{evidence:ev(1)}),
   q('공통수학2는 다음에 누가 무엇을 확인할까요?',['담임선생님 · 학생부 자료반영 결과','교과 담당 · 참여시수 다시 입력','업무 담당 · 승인요청만 처리'],0,'맞아요. 학생부 반영은 담임선생님 몫이에요.','수학의 남은 처리는 학생부 반영이라 담임선생님이 확인해요.',{evidence:ev(0)}),
   q('공통영어2의 순서는요?',['교과 담당 반영·마감 → 담임선생님 학생부 반영','담임선생님이 먼저 학생부 반영 → 교과 입력','업무 담당이 모두 대신 처리'],0,'네. 교과 담당이 반영·마감한 뒤 담임선생님이 학생부에 반영해요.','교과 담당의 학점반영·교과마감이 먼저고, 그다음 담임선생님이 학생부 반영을 해요.',{evidence:ev(1)})
  ];},
 flow(t){const roles=['교과 담당','담임선생님','업무 담당'],key=[0,0,1,2,2,2];const ev=n=>taskCard('처리 순서',`<ol class="flow-list">${TASK_FLOW.map((f,i)=>`<li class="${i<n?'is-done':i===n?'is-now':''}">${f[0]}</li>`).join('')}</ol>`);
  const steps=[];TASK_FLOW.forEach((f,i)=>{if(i===5)steps.push({kind:'info',say:'승인요청을 보냈어요. 결재 완료는 아직이에요.\n가상 일정으로 다음 날 아침 08:20, 교내 알림이 왔어요. "요청한 문서의 결재가 완료되었습니다."',evidence:ev(5)});
   steps.push(q(`다음 처리는 ${f[0]}이에요. 누가 할까요?`,roles,key[i],`맞아요. ${f[0]}은 ${f[1]}이 해요.`,`${f[0]}은 ${f[1]}이 확인해요.`,{evidence:ev(i)}));});
  return steps;},
 schoolMemo(t){const steps=[];TASK_MEMO_OPTIONS.forEach((g,i)=>{steps.push(q(`${i+1}. ${g.title} · 무엇을 보나요?`,g.data,null,'좋아요.',''),q(`${i+1}. ${g.title} · 누구와 확인하나요?`,g.who,null,'좋아요.',''),q(`${i+1}. ${g.title} · 언제 확인하나요?`,g.when,null,'좋아요. 한 문장이 완성됐어요.',''));});return steps;}
};
function taskSteps(id){const t=taskState(id);return TASK_BUILD[id]?TASK_BUILD[id](t):[];}

/* ---------- state machine ---------- */
function activeTaskId(){if(S.practiceTask)return S.practiceTask;const c=currentScene();if(!S.pending&&c.kind==='task'){const t=S.tasks[c.task];if(t?.started&&t.phase!=='closed')return c.task;}return null;}
function startTask(id){if(!TASK_META[id])return;const t=taskState(id);if(t.done&&!S.practiceTask){reviewTask(id);return;}Object.assign(t,{started:true,phase:'ask',step:0,answers:[],ok:0,no:0,done:false});save();renderStory();}
function taskAnswer(index){const id=activeTaskId();if(!id)return;const t=taskState(id),steps=taskSteps(id),st=steps[t.step];if(!st||t.phase!=='ask')return;
 t.answers[t.step]=index;const graded=st.answer!==null&&st.answer!==undefined;const correct=!graded||index===st.answer;t.lastCorrect=correct;if(graded){if(correct)t.ok++;else t.no++;}
 t.lastDelta=0;if(graded&&!S.practiceTask&&typeof taskRapport==='function')t.lastDelta=taskRapport(id,correct?1:-1);
 t.phase='feedback';save();renderStory();}
function taskContinue(){const id=activeTaskId();if(!id)return;const t=taskState(id),steps=taskSteps(id);
 if(t.phase==='hint'){t.phase='ask';}
 else if(t.phase==='feedback'||(t.phase==='ask'&&steps[t.step]?.kind==='info')){t.step++;if(t.step>=steps.length){t.phase='done';t.done=true;const m=TASK_META[id];finishTask(id,{message:m[2],rule:m[5],skill:m[3]});}else t.phase='ask';}
 else if(t.phase==='done'){t.phase='closed';if(S.practiceTask){exitPractice();return;}}
 save();renderStory();}
function taskHint(){const id=activeTaskId();if(!id)return;const t=taskState(id);if(t.phase!=='ask')return;t.phase='hint';save();renderStory();}
function taskAction(action,button){if(!action.startsWith('task-'))return false;const val=Number(button.dataset.val);
 if(action==='task-answer'){taskAnswer(val);return true;}
 if(action==='task-continue'){taskContinue();return true;}
 if(action==='task-hint'){taskHint();return true;}
 if(action==='task-start'){startTask(button.dataset.id);return true;}
 return false;}
/* What the stage shows while a task is running: speaker, text, choices, evidence, actions. */
function taskView(){const id=activeTaskId();if(!id)return null;const t=taskState(id),steps=taskSteps(id),st=steps[Math.min(t.step,steps.length-1)],m=TASK_META[id],friend=(typeof TASK_FRIEND!=='undefined'&&TASK_FRIEND[id])||m[1];
 const who=st?.who||m[1];const practice=!!S.practiceTask;const header=`${practice?'자유 실습 · ':''}${m[0]}`;const progress=steps.length>1?`${Math.min(t.step+1,steps.length)} / ${steps.length}`:'';
 const base={id:`task:${id}:${t.step}:${t.phase}`,who,expression:4,text:'',choices:'',evidence:st?.evidence||'',actions:'',header,progress,task:id};
 if(t.phase==='ask'){if(st.kind==='info')return {...base,expression:0,text:st.say,actions:btn('▶ 계속','task-continue',{},'primary')};
  const numeric=st.kind==='number';
  const choices=st.options.map((o,i)=>btn(esc(String(o)),'task-answer',{val:i},numeric?'segment':'choice-card')).join('');
  return {...base,text:st.say,choices,choicesClass:numeric?'segment':'',actions:st.hint||true?btn('동료에게 묻기','task-hint',{},'ghost small'):''};}
 if(t.phase==='hint'){return {...base,who:'03',expression:2,text:st.hint||(typeof WORK_NUDGES!=='undefined'&&WORK_NUDGES[id])||'자료를 하나씩 나눠서 같이 확인해 봐요.',actions:btn('▶ 돌아가기','task-continue',{},'primary')};}
 if(t.phase==='feedback'){const graded=st.answer!==null&&st.answer!==undefined;const picked=t.answers[t.step];let text=t.lastCorrect?st.ok:(Array.isArray(st.no)?st.no[picked]:st.no);let expression=t.lastCorrect?5:1;let who2=who;
  if(st.call&&!t.lastCorrect){text=`${text}\n(박수학 선생님 메모: ${st.hint})`;}
  const delta=t.lastDelta?`<span class="rapport-delta ${t.lastDelta>0?'up':'down'}">${displayName(friend)} 친밀도 ${t.lastDelta>0?'+1':'-1'}</span>`:'';
  return {...base,who:who2,expression,text,chips:delta,actions:btn(t.step>=steps.length-1?'▶ 마무리':'▶ 다음','task-continue',{},'primary')};}
 if(t.phase==='done'){const graded=steps.filter(s=>s.answer!==null&&s.answer!==undefined).length;const summary=graded?`<span class="status-chip done">정답 ${t.ok}/${graded}</span>`:'';return {...base,who:m[1],expression:5,text:m[2],chips:summary,actions:btn(practice?'연습 목록으로':'완료','task-continue',{},'primary')};}
 return null;}
/* Review of a finished task: each question with the answer given and the correct one. */
function reviewTask(id){const t=taskState(id),steps=taskSteps(id);if(!t.done){toast('아직 끝나지 않은 실습이에요.');return;}
 const rows=steps.filter(s=>s.kind!=='info').map((s,i)=>{const k=steps.indexOf(s);const picked=t.answers[k];const graded=s.answer!==null&&s.answer!==undefined;const right=graded?picked===s.answer:true;return `<article class="review-line ${right?'is-right':'is-wrong'}"><h4>${i+1}. ${esc(s.say)}</h4><p><b>내 답</b> ${esc(String(s.options[picked]??'—'))}</p>${graded&&!right?`<p><b>정답</b> ${esc(String(s.options[s.answer]))}</p>`:''}</article>`;}).join('');
 openInfo(TASK_META[id][0]+' · 확인 기록',`<p class="helper-text">근거: ${esc(TASK_REFS[id]||'')}</p>${rows}`);}
function renderVerdictReview(){const t=taskState('routes');if(!t.done)return '<p>아직 확정 판정이 없습니다. 학생별 경로 실습을 마치면 여기에 남아요.</p>';return `<p>확정 판정 · 2026학년도 고1·2 가상 일반 사례</p>${taskDataRows(['학생','과목','성취율','출석','지원 경로','판정 근거'],TASK_STUDENTS.map(s=>[studentLabel(s.name),`${s.course}(${s.type})`,`${s.ach}%`,`${s.att}회`,routeLabel(s.route),esc(s.reasons[0])]))}<p>보충지도 3명 · 추가학습 2명 · 기준 충족 3명. 개별 학생의 예외는 별도로 자료와 학교 확인 결과를 확인합니다.</p>`;}
