-- 최고관리자용 기존 app_settings RLS 정책을 그대로 사용합니다.
-- 기존 데이터와 다른 설정은 변경하지 않습니다.
alter table public.app_settings
  add column if not exists activity_category_icons jsonb not null default '{}'::jsonb;
comment on column public.app_settings.activity_category_icons is '활동분류 이름별 표시 아이콘. 기존 app_settings 접근권한 적용';
