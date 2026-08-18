create table public.surveys (
  id text primary key default gen_random_uuid()::text,
  category text not null check (length(btrim(category)) between 1 and 80),
  title text not null check (length(btrim(title)) between 1 and 160),
  description text not null default '',
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id text primary key default gen_random_uuid()::text,
  survey_id text not null references public.surveys (id) on delete cascade,
  prompt text not null check (length(btrim(prompt)) between 1 and 240),
  allow_multiple boolean not null default false,
  position integer not null check (position > 0),
  unique (survey_id, position),
  unique (id, survey_id)
);

create table public.answers (
  id text primary key default gen_random_uuid()::text,
  question_id text not null references public.questions (id) on delete cascade,
  text text not null check (length(btrim(text)) between 1 and 240),
  position integer not null check (position > 0),
  unique (question_id, position),
  unique (id, question_id)
);

create table public.votes (
  id text primary key default gen_random_uuid()::text,
  survey_id text not null references public.surveys (id) on delete cascade,
  anonymous_token uuid not null,
  submitted_at timestamptz not null default now(),
  unique (survey_id, anonymous_token),
  unique (id, survey_id)
);

create table public.vote_selections (
  vote_id text not null,
  survey_id text not null,
  question_id text not null,
  answer_id text not null,
  primary key (vote_id, answer_id),
  foreign key (vote_id, survey_id)
    references public.votes (id, survey_id) on delete cascade,
  foreign key (question_id, survey_id)
    references public.questions (id, survey_id) on delete cascade,
  foreign key (answer_id, question_id)
    references public.answers (id, question_id) on delete cascade
);

create table public.answer_results (
  answer_id text primary key references public.answers (id) on delete cascade,
  vote_count bigint not null default 0 check (vote_count >= 0),
  updated_at timestamptz not null default now()
);

create index questions_survey_id_idx on public.questions (survey_id);
create index answers_question_id_idx on public.answers (question_id);
create index votes_survey_id_idx on public.votes (survey_id);
create index vote_selections_question_id_idx on public.vote_selections (question_id);
create index vote_selections_answer_id_idx on public.vote_selections (answer_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger surveys_set_updated_at
before update on public.surveys
for each row execute function public.set_updated_at();

create function public.initialize_answer_result()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.answer_results (answer_id) values (new.id);
  return new;
end;
$$;

create trigger answers_initialize_result
after insert on public.answers
for each row execute function public.initialize_answer_result();

create function public.update_answer_result()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.answer_results
    set vote_count = vote_count + 1,
        updated_at = now()
    where answer_id = new.answer_id;
    return new;
  end if;

  update public.answer_results
  set vote_count = vote_count - 1,
      updated_at = now()
  where answer_id = old.answer_id;
  return old;
end;
$$;

create trigger vote_selections_update_result
after insert or delete on public.vote_selections
for each row execute function public.update_answer_result();
