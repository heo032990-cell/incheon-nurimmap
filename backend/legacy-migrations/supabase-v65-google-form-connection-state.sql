-- 인천누림지도 v65
-- 기관 Google Form의 최초 연결 완료 상태를 안전하게 유지합니다.
-- 기존 데이터와 테이블은 삭제하지 않습니다.

alter table public.google_form_verification_configs
  add column if not exists relay_token_entry text,
  add column if not exists relay_form_url text;

comment on column public.google_form_verification_configs.relay_token_entry is
  '기관 소유 Google Form에서 자동 생성된 신청 확인번호 entry 값';

comment on column public.google_form_verification_configs.relay_form_url is
  '최초 연결을 승인한 기관 소유 Google Form 주소';

update public.google_form_verification_configs as config
set relay_token_entry = program.google_form_token_entry,
    relay_form_url = program.google_form_url
from public.programs as program
where config.program_id = program.id
  and config.verification_mode = 'relay'
  and config.relay_connected_at is not null
  and (config.relay_token_entry is null or config.relay_form_url is null)
  and program.google_form_token_entry ~ '^entry\.[0-9]+$';
update public.programs as program
set google_form_verification_enabled = true,
    google_form_token_entry = config.relay_token_entry,
    updated_at = now()
from public.google_form_verification_configs as config
where config.program_id = program.id
  and config.verification_mode = 'relay'
  and config.relay_connected_at is not null
  and config.relay_token_entry ~ '^entry\.[0-9]+$'
  and program.google_form_url is not null
  and (
    program.google_form_verification_enabled is distinct from true
    or program.google_form_token_entry is distinct from config.relay_token_entry
  );