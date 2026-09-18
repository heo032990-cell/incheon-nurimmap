-- 인천 누림지도 정책·운영기관 정보 최고관리자 편집
-- Supabase SQL Editor에서 1회 실행
alter table public.app_settings
  add column if not exists policy_settings jsonb not null default '{}'::jsonb;

update public.app_settings
set policy_settings = coalesce(policy_settings, '{}'::jsonb)
where id = 'global';

comment on column public.app_settings.policy_settings is
  '사이트 하단, 개인정보 처리방침, 이용약관, 접근성 및 문의 페이지 공통 정보';