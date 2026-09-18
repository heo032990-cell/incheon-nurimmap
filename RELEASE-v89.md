# v89 — 관리자 재로그인과 안내정보 저장 복구

## 수정
- 로그인 후 프로그램 데이터 새로고침(renderAll)이 현재 프로그램 주소를 다시 해석하여 신청 창을 열던 경로를 수정했습니다.
- 주소 기반 신청 창은 최초 로딩 또는 뒤로/앞으로 이동 때만 열립니다. 관리자 창이 열려 있으면 자동 신청 창을 열지 않습니다.
- 관리자 진입·인증 변경 시 남아 있는 신청 창과 프로그램 주소를 정리합니다. 이용자의 정상 신청 버튼과 직접 프로그램 주소 접속은 유지합니다.
- 운영 DB app_settings에 누락된 policy_settings jsonb 항목을 복구하고 API 스키마 캐시를 갱신했습니다. 기존 v65 SQL에 있던 항목이며 저장 데이터나 관리자 권한은 변경하지 않았습니다.

## 적용 SQL
운영 migration 이름: restore_policy_settings_column
```sql
alter table public.app_settings add column if not exists policy_settings jsonb not null default '{}'::jsonb;
comment on column public.app_settings.policy_settings is '사이트 하단, 개인정보 처리방침, 이용약관, 접근성 및 문의 페이지 공통 정보';
notify pgrst, 'reload schema';
```

## 검증
- 실제 REST API에서 policy_settings 조회 HTTP 200.
- 실제 DB 트랜잭션에서 최고관리자 역할의 기존 값 upsert 1건 성공, 일반 관리자 update 0건. 테스트 트랜잭션은 rollback하여 안내정보 내용은 변경하지 않았습니다.
- 브라우저의 가상 인증으로 실제 로그인 버튼→로그아웃→재로그인을 2회 수행. 관리자 화면 유지, 신청 창 미노출 확인.
- renderAll 반복 시 신청 창 미노출, 명시적 프로그램 경로 이동 시 정상 신청 창 노출, 관리자 진입 시 경로 정리 확인.
- 기존 자동 검사 6개 파일 통과.

## 배포 / 롤백
- 웹 v89. Apps Script v87, 설문 Edge v10, 기존 Edge v65 유지. 사용자 스크립트 재배포 불필요.
- 이전 웹 Netlify: 6aa0b2056bd1fe179d92b87c (v88).
- 이전 Git 커밋: 7224f8da6e6f06ef8e4e8b16a714b45971dad253.
- 웹 롤백 시 복구한 DB 열은 유지합니다. 열 삭제는 저장한 안내정보를 잃게 하므로 하지 않습니다.
