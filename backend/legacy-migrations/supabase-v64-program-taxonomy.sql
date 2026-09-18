-- v63: 프로그램 활동분류·장애유형·참여대상 유형 추가
-- 기존 행과 기존 기능을 보존하며 열만 추가합니다.

alter table public.programs
  add column if not exists activity_category text not null default '기타',
  add column if not exists disability_types text[] not null default array['전체 장애유형']::text[],
  add column if not exists audience_type text not null default '기타',
  add column if not exists audience_other text;

alter table public.app_settings
  add column if not exists program_categories text[] not null default array['신체활동','문화·여가활동','교육활동','자조모임','가족지원','기타']::text[],
  add column if not exists disability_types text[] not null default array['전체 장애유형','지체장애','뇌병변장애','시각장애','청각장애','언어장애','지적장애','자폐성장애','정신장애','신장장애','심장장애','호흡기장애','간장애','안면장애','장루·요루장애','뇌전증장애','기타']::text[],
  add column if not exists audience_types text[] not null default array['장애 당사자','가족·보호자','지역주민','기타']::text[];

create index if not exists programs_activity_category_idx
  on public.programs(activity_category);
create index if not exists programs_disability_types_gin_idx
  on public.programs using gin(disability_types);

comment on column public.programs.activity_category is '최고관리자가 관리하는 프로그램 활동분류';
comment on column public.programs.disability_types is '프로그램 대상 장애유형. 전체 장애유형 선택 가능';
comment on column public.programs.audience_type is '상세검색용 참여대상 유형. 기타 세부문구는 audience_other에 저장';