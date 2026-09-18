alter table public.applications add column if not exists drive_uploaded_file_url text;
alter table public.applications add column if not exists base_consent_snapshot jsonb not null default '[]'::jsonb;
create or replace function public.nurim_application_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' and old.survey_response then new.survey_response:=true; end if;
 if new.survey_response or exists(select 1 from public.programs where id=new.program_id and survey_id is not null) then
  new.survey_response:=true;
  if TG_OP='INSERT' and coalesce(auth.role(),'') <> 'service_role' then raise exception '통합 설문 접수 경로를 사용해 주세요.'; end if;
  if coalesce(new.note,'')<>'' or coalesce(new.participant_type,'')<>''
   or coalesce(new.application_responses,'{}'::jsonb)<>'{}'::jsonb
   or new.uploaded_file_path is not null then
   raise exception '통합 설문의 상세 응답은 Google Drive에만 저장해야 합니다.';
  end if;
 end if;
 return new;
end $$;

notify pgrst, 'reload schema';
