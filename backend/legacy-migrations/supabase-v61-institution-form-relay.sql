-- v61: 기관 소유 Google Form 제출 확인 영수증
-- 실제 답변은 저장하지 않고 프로그램 ID, 일회성 확인번호, 제출시각만 보관합니다.

create table if not exists public.google_form_submission_receipts (
  program_id text not null references public.programs(id) on delete cascade,
  token uuid not null,
  submitted_at timestamptz not null default now(),
  primary key (program_id, token)
);

alter table public.google_form_submission_receipts enable row level security;

-- 공개 정책을 만들지 않습니다. Edge Function(service_role)만 접근합니다.
comment on table public.google_form_submission_receipts is
  '기관 소유 Google Form의 제출 여부만 기록. 신청 답변 및 개인정보 저장 금지.';

alter table public.google_form_verification_configs
  add column if not exists verification_mode text not null default 'sheet',
  add column if not exists relay_secret_hash text,
  add column if not exists relay_connected_at timestamptz;

alter table public.google_form_verification_configs
  alter column response_spreadsheet_id drop not null;

comment on column public.google_form_verification_configs.verification_mode is
  'sheet=기존 Sheet 조회, relay=기관 Form이 제출 영수증만 전송';
