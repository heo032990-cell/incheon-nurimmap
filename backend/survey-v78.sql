
-- Survey definitions contain questions only; answers never enter these tables.
create table public.nurim_surveys (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 center_id uuid references public.centers(id), title text not null,
 revision integer not null default 0, published_revision integer,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.nurim_survey_versions (
 survey_id uuid references public.nurim_surveys(id) on delete restrict,
 revision integer not null, schema jsonb not null, saved_by uuid not null references public.profiles(id),
 saved_name text not null, saved_at timestamptz not null default now(),
 drive_pdf_url text, drive_folder_url text,
 primary key(survey_id,revision)
);
alter table public.nurim_surveys enable row level security;
alter table public.nurim_survey_versions enable row level security;
revoke all on public.nurim_surveys,public.nurim_survey_versions from anon,authenticated;
grant all on public.nurim_surveys,public.nurim_survey_versions to service_role;
create index nurim_surveys_owner on public.nurim_surveys(owner_id);
alter table public.programs add column survey_id uuid references public.nurim_surveys(id) on delete restrict;
alter table public.programs add column public_number bigint generated always as identity;
alter table public.programs add column public_year integer;
alter table public.programs add column public_center text;
create unique index programs_public_number_unique on public.programs(public_number);
create function public.nurim_program_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
  new.created_at:=now();
  new.public_year:=extract(year from new.created_at at time zone 'Asia/Seoul');
  new.public_center:=coalesce(nullif(trim(new.center_name),''),'복지관');
 else
  new.created_at:=old.created_at;
  new.public_number:=old.public_number;
  new.public_year:=old.public_year;
  new.public_center:=old.public_center;
 end if;
 return new;
end $$;
update public.programs set public_year=extract(year from created_at at time zone 'Asia/Seoul'),public_center=coalesce(nullif(trim(center_name),''),'복지관');
create trigger nurim_program_identity before insert or update on public.programs for each row execute function public.nurim_program_identity();
create table public.nurim_survey_submissions (
 id uuid primary key references public.applications(id) on delete cascade,
 survey_id uuid not null references public.nurim_surveys(id),
 revision integer not null,
 token_hash text not null,
 completed_at timestamptz,
 foreign key(survey_id,revision) references public.nurim_survey_versions(survey_id,revision)
);
alter table public.nurim_survey_submissions enable row level security;
revoke all on public.nurim_survey_submissions from anon,authenticated;
grant all on public.nurim_survey_submissions to service_role;
create index nurim_survey_submissions_survey on public.nurim_survey_submissions(survey_id,revision);
alter table public.applications add column survey_response boolean not null default false;
-- Even a direct API request cannot bypass the answer storage rule.
create function public.nurim_application_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' and old.survey_response then new.survey_response:=true; end if;
 if new.survey_response or exists(select 1 from public.programs where id=new.program_id and survey_id is not null) then
  new.survey_response:=true;
  if TG_OP='INSERT' and coalesce(auth.role(),'') <> 'service_role' then raise exception '통합 설문 접수 경로를 사용해 주세요.'; end if;
  if coalesce(new.note,'')<>'' or coalesce(new.signature,'')<>'' or coalesce(new.participant_type,'')<>''
   or coalesce(new.application_responses,'{}'::jsonb)<>'{}'::jsonb or coalesce(new.consent_responses,'{}'::jsonb)<>'{}'::jsonb
   or new.uploaded_file_path is not null then
   raise exception '통합 설문의 상세 응답은 Google Drive에만 저장해야 합니다.';
  end if;
 end if;
 return new;
end $$;
create trigger nurim_application_guard before insert or update on public.applications for each row execute function public.nurim_application_guard();
create function public.nurim_save_survey(p_id uuid,p_owner uuid,p_center uuid,p_schema jsonb,p_revision integer,p_name text) returns public.nurim_surveys language plpgsql set search_path='' as $$
declare s public.nurim_surveys;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,1));
 select * into s from public.nurim_surveys where id=p_id for update;
 if not found then
  if p_revision<>0 then raise exception '설문을 다시 불러와 주세요.'; end if;
  insert into public.nurim_surveys(id,owner_id,center_id,title) values(p_id,p_owner,p_center,p_schema->>'title') returning * into s;
 end if;
 if s.revision<>p_revision then raise exception '다른 담당자가 먼저 저장했습니다. 새로 불러온 뒤 수정해 주세요.'; end if;
 update public.nurim_surveys set title=p_schema->>'title',revision=revision+1,updated_at=now() where id=p_id returning * into s;
 insert into public.nurim_survey_versions(survey_id,revision,schema,saved_by,saved_name) values(p_id,s.revision,p_schema,p_owner,p_name);
 return s;
end $$;
revoke all on function public.nurim_save_survey(uuid,uuid,uuid,jsonb,integer,text) from public,anon,authenticated;
grant execute on function public.nurim_save_survey(uuid,uuid,uuid,jsonb,integer,text) to service_role;

create function public.nurim_reserve_survey(p_id uuid,p_program text,p_survey uuid,p_revision integer,p_token text,p_basic jsonb)
returns public.applications language plpgsql set search_path='' as $$
declare a public.applications; m public.nurim_survey_submissions; c uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,2));
 select * into m from public.nurim_survey_submissions where id=p_id;
 if found then
  if m.token_hash<>p_token or m.survey_id<>p_survey or m.revision<>p_revision then raise exception '신청 확인번호가 올바르지 않습니다.'; end if;
  select * into a from public.applications where id=p_id;
  if a.program_id<>p_program or a.applicant_name<>p_basic->>'name' or a.phone<>p_basic->>'phone' or a.birth_date::text<>p_basic->>'birth' then raise exception '재시도 시 기본정보를 변경할 수 없습니다. 새 신청 창을 열어 주세요.'; end if;
  return a;
 end if;
 select center_id into c from public.programs where id=p_program and survey_id=p_survey;
 if not found then raise exception '프로그램 설문 연결을 다시 확인해 주세요.'; end if;
 insert into public.applications(id,program_id,center_id,applicant_name,phone,birth_date,participant_type,drive_sync_status,survey_response)
 values(p_id,p_program,c,p_basic->>'name',p_basic->>'phone',(p_basic->>'birth')::date,'','pending',true) returning * into a;
 insert into public.nurim_survey_submissions(id,survey_id,revision,token_hash) values(p_id,p_survey,p_revision,p_token);
 return a;
end $$;
revoke all on function public.nurim_reserve_survey(uuid,text,uuid,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.nurim_reserve_survey(uuid,text,uuid,integer,text,jsonb) to service_role;

create function public.nurim_binding_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.survey_id is not null and (TG_OP='INSERT' or new.survey_id is distinct from old.survey_id) then
  if not exists(select 1 from public.nurim_surveys where id=new.survey_id and owner_id=new.manager_id and published_revision is not null) then
   raise exception '프로그램 담당자가 배포한 설문만 연결할 수 있습니다.';
  end if;
 end if;
 return new;
end $$;
create trigger nurim_binding_guard before insert or update on public.programs for each row execute function public.nurim_binding_guard();

revoke execute on function public.nurim_application_guard(),public.nurim_binding_guard(),public.nurim_program_identity() from public,anon,authenticated;
