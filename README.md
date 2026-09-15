# 인천 누림지도 — 노트북 작업 시작 안내

## 프로젝트 소개·발표 자료

[AI 활용 내용 및 개선 시도](docs/AI-USAGE.md) — 활용 도구, 담당 역할, 활용 이유와 세 가지 개선 사례를 정리했습니다.

최신 작업 브랜치: `codex/survey-integration` (main이 아님).

```sh
git clone --branch codex/survey-integration https://github.com/heo032990-cell/incheon-nurimmap.git
cd incheon-nurimmap
npm run build
```

Git과 Node.js가 필요합니다. 비공개 저장소 접근 권한이 있는 GitHub 계정으로 로그인하세요. 이미 내려받았다면 작업을 저장한 뒤 해당 브랜치에서 `git pull --ff-only`로 업데이트하세요. 이 저장소의 루트가 기존 PC의 staging-v78-survey에 해당합니다.

## 아이콘 투표 시안
[투표용 4종 및 회사 작업 안내](design/icon-vote/README.md)에 원본 이미지, 색상 설명, 생성 프롬프트를 보관했습니다. 운영에 적용하기 전 투표로 선택할 후보입니다.

## 현재 기준
- 최신 버전은 v102입니다. 관리자 전용 페이지·설문 좌우 미리보기·페이지 제목/설명·끌어 이동·안내 동의 통합을 지원합니다. RELEASE-v102.md를 확인하세요.
- 최신 준비본은 v101 다중 첨부 개선본입니다(RELEASE-v101.md). v100 접근성을 유지하고 최대 10개 파일을 누적 추가·삭제하며 Google에 개별 원본으로 저장합니다. 적용 시 Apps Script를 먼저 업데이트한 뒤 웹을 배포합니다. 2026-09-15 운영 배포 완료. 배포·검증 기록은 RELEASE-v101.md를 확인하세요.
- v94 신청 기능: 기관명 유지, 장애유형 조합, 설문 선택 개수, 이전 단계, 서명 일치 검증을 반영했습니다. 운영 배포·검증·복구 기록은 RELEASE-v94.md를 확인하세요. 설문 서버는 nurim-survey v12입니다.
- v93까지의 기반 기능: 최고관리자가 설정한 이용 연령 명칭을 등록·검색·카드에 그대로 표시합니다. v92 반응형 활동분류 수정도 포함합니다. 배포 결과는 RELEASE-v93.md를 확인하세요.
- Apps Script v101: `backend/google-apps-script-v101.gs`. 같은 설문의 응답·PDF·CSV를 실제 신청 프로그램별로 저장. 사용자가 원하는 동작 완료를 확인했습니다. 사용자는 Google 기존 자료를 삭제했다고 알렸습니다.
- 기존 Supabase 서버: v90. 대시보드 전체 교체용 `backend/swift-processor-v90-single-file.ts`, 개발용 `backend/swift-processor-v90.ts`와 `backend/storage-policy.mjs`.
- 설문 서버: `backend/nurim-survey.ts`.
- SQL: `backend/survey-v78.sql`, `backend/web-consent-v90.sql`, `backend/legacy-migrations/`. 각각 별도 기능을 위한 변경 이력입니다. 기존 운영 DB에 무작정 다시 실행하지 마세요.

## 이어서 작업할 때
- Netlify·Supabase·Apps Script 배포는 사용자가 직접 합니다. 수정 파일과 적용 방법을 전달하세요.
- 신청 기본정보와 기본 개인정보 동의는 웹앱에 보관합니다. Google 신청서 출력물에는 기본 동의를 넣지 않습니다.
- 설문형: 기본정보+설문 응답을 해당 프로그램 Google 폴더에 저장합니다. 같은 설문 재사용 시 프로그램별로 분리합니다.
- 기본형: 참여명단 CSV. 첨부형: CSV+첨부 원본. 웹앱의 신청 기록은 유지합니다.
- 공유 빈 양식은 ‘설문 양식 관리’에 보관합니다. v91 적용 안내는 `docs/APPS-SCRIPT-v91.md`에 있습니다.
- 배포 ZIP은 Git에서 제외합니다. `npm run build`로 생성한 `dist` 폴더 내용을 압축하면 Netlify용 배포본을 만들 수 있습니다. backend·tests·비밀설정은 넣지 마세요.
- 예전 RELEASE 문서는 당시 기록입니다. 현재 상태는 이 문서를 우선 확인하세요.

## 검증 및 비밀정보
`npm test`로 코드 검사를 실행할 수 있습니다. v91 프로그램 분리 검사는 tests/survey-program-storage-v91.test.mjs, 개인정보 저장 검사는 tests/storage-policy-v91.test.mjs입니다.
운영 DB 데이터, Google Drive 실제 신청 자료, .env, 배포 인증정보는 GitHub에 저장하지 않습니다. 다른 컴퓨터에서는 관련 서비스에 별도 로그인해야 합니다.

최근 수정: v94 신청·설문 개선(RELEASE-v94.md), v91 프로그램별 설문 저장, v92 활동분류 반응형 버튼, v93 이용 연령 명칭 일치. 작업 파일은 모두 이 브랜치에 포함합니다. 최신본과 구버전 자료를 구분하되 필수 SQL·서버 코드·정책을 번호만 보고 삭제하지 마세요.
