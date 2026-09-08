# Apps Script v78 적용
기존 Google Drive 연동을 담당하는 웹 앱 프로젝트를 업데이트합니다. 프로그램마다 만드는 Google Form 연결 스크립트와는 다른 프로젝트입니다.

1. 현재 v68 Google Drive 연동 웹 앱의 Apps Script 편집기를 엽니다.
2. 기존 코드를 별도로 보관한 뒤 google-apps-script-v78.gs 전체 내용으로 교체하고 저장합니다.
3. 스크립트 속성 WEBHOOK_SECRET은 기존 값을 유지합니다. Supabase의 GOOGLE_APPS_SCRIPT_URL과 GOOGLE_DRIVE_WEBHOOK_SECRET도 바꾸지 않습니다.
4. 함수 목록에서 authorizeNurimSurveyV78을 한 번 실행하여 Google 문서·Drive 접근 권한을 승인합니다. 권한 확인용으로 새로 만든 임시 문서 한 개는 휴지통으로 보냅니다.
5. 배포 → 배포 관리 → 기존 웹 앱 편집 → 새 버전으로 업데이트합니다. 기존 /exec URL을 유지합니다.
6. 기존과 같은 실행 주체·접근 설정을 유지합니다. 서버는 공유 비밀값을 통해 요청을 검증합니다.
7. 누림지도 담당자 계정의 Google Drive 폴더를 확인하고, 설문 관리 → Google 연결 점검을 실행합니다.
8. 설문을 저장한 뒤 Google 배포 / 업데이트를 실행합니다.

추가되는 Google 권한: DocumentApp을 통한 출력 원본 문서와 PDF 생성.
실제 응답은 기관/담당자 설정 폴더 아래 설문별 폴더, 버전별 응답 탭, 개별 출력 PDF로 저장합니다.
전체신청명단.csv는 Google에서 갱신됩니다. 기존 v68의 기타 기능은 파일에 함께 보존했습니다.

첫 확인에는 가상의 테스트 이름·연락처를 사용하세요. 한 건 제출 → 시트 행·PDF·CSV 확인 → 같은 전송 재시도 → 문항 업데이트 후 새 응답 → 수정·취소 순으로 확인합니다.
Drive 연동 오류가 표시되면 웹 앱 배포 버전, 폴더 공유 권한, 공유 비밀값과 기존 URL 유지 여부를 확인합니다.

