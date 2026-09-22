# Google Apps Script 배포 가이드

`web/index.html`을 Google Apps Script 웹앱으로 배포하기 위한 준비 파일입니다.
Apps Script 프로젝트 생성·배포는 Google 계정 인증이 필요한 작업이라 이 저장소의
자동화 도구로는 대신 실행할 수 없습니다 — 아래 단계를 따라 직접 배포해 주세요.

## 포함된 파일

- `Code.gs` — 웹앱 진입점(`doGet`). `web/index.html`을 그대로 서빙합니다.
- `index.html` — `web/index.html`의 복사본 (Apps Script 프로젝트에는 확장자 없이 `index`로 올라갑니다)
- `appsscript.json` — 매니페스트. 웹앱 접근 권한을 정의합니다.

`web/index.html`을 수정했다면 이 폴더의 `index.html`도 같은 내용으로 다시 복사해 주세요.

## 방법 A — script.google.com에서 직접 (가장 쉬움)

1. [script.google.com](https://script.google.com)에서 **새 프로젝트** 생성
2. 기본 생성된 `Code.gs`의 내용을 이 폴더의 `Code.gs` 내용으로 교체
3. 왼쪽 **+** → **HTML** 파일 추가, 이름을 `index`로 지정 → 이 폴더의 `index.html` 내용을 그대로 붙여넣기
4. 왼쪽 프로젝트 설정(톱니바퀴) 또는 `appsscript.json`(**프로젝트 설정 → "appsscript.json manifest 파일을 편집기에 표시"** 체크 후 나타남)을 이 폴더의 `appsscript.json` 내용으로 교체
5. 우측 상단 **배포 → 새 배포**
   - 유형: **웹 앱**
   - 실행 계정: **웹 앱에 액세스하는 사용자**
   - 액세스 권한: 학교 Google Workspace 계정으로 만든다면 **조직 내 사용자만**(도메인 제한)을 권장, 개인 Gmail이면 **모든 사용자**만 선택 가능
6. **배포**를 누르면 웹앱 URL이 발급됩니다. 이 URL을 교과부장·교사에게 공유하면 됩니다.
7. 이후 `Code.gs`/`index.html`을 수정하면 **배포 → 배포 관리 → 편집(연필 아이콘) → 새 버전** 으로 갱신해야 URL에 반영됩니다.

## 방법 B — clasp CLI (로컬에서, 반복 배포가 잦다면)

```bash
npm install -g @google/clasp
clasp login                 # 브라우저에서 구글 계정 로그인
clasp create --type webapp --title "교과서 선정대장" --rootDir deploy/appsscript
clasp push                  # 이 폴더의 파일들을 Apps Script 프로젝트로 업로드
clasp deploy                # 웹앱으로 배포, URL 발급
```

이후에는 `deploy/appsscript/index.html`을 갱신하고 `clasp push && clasp deploy`만 반복하면 됩니다.

## 참고 — 데이터 저장 위치

이 앱은 서버가 없는 순수 클라이언트 앱입니다. 입력한 내용은 각자의 브라우저
`localStorage`에만 저장되고 Apps Script 서버로 전송되지 않습니다. 따라서 여러 사람이
같은 배포 URL에 접속해도 서로의 입력 데이터를 공유하지 않으며(교사↔교과부장 간 데이터
교환은 앱 안의 "코드 복사/붙여넣기" 또는 "파일로 저장/불러오기" 기능으로 이뤄집니다),
브라우저를 바꾸거나 캐시를 지우면 그 브라우저에 저장된 내용은 사라집니다.
