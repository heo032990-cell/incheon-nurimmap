# v93 — 이용 연령 명칭 일치

최고관리자는 ‘전연령’을 저장했는데 등록 화면·상세검색·카드에서 ‘전연령·가족’으로 표시되던 문제를 수정했습니다. 화면용 강제 치환을 제거해 설정값을 그대로 표시합니다. 기존 프로그램의 저장값과 DB는 변경하지 않았습니다.

수정: auth.js, enhancements.js, index.html 캐시 버전, package.json.
검증: 정적 빌드 및 브라우저에서 설정값 ‘전연령’이 등록·검색 선택지에 그대로 표시됨 확인. v92의 반응형 수정과 v91 저장 구조는 유지.
배포 ZIP: incheon-nurim-map-netlify-2026-09-10-v93-age-label.zip (Git 미포함, npm run build로 재생성 가능).
Netlify 운영 배포 완료: 6aa1f618655a7ca315814286 (2026-09-10), https://incheon-nurimmap.netlify.app/
Supabase·Apps Script 변경 없음.

