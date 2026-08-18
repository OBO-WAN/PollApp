alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.votes enable row level security;
alter table public.vote_selections enable row level security;
alter table public.answer_results enable row level security;

revoke all on table public.surveys from anon, authenticated;
revoke all on table public.questions from anon, authenticated;
revoke all on table public.answers from anon, authenticated;
revoke all on table public.votes from anon, authenticated;
revoke all on table public.vote_selections from anon, authenticated;
revoke all on table public.answer_results from anon, authenticated;

grant select on table public.surveys to anon, authenticated;
grant select on table public.questions to anon, authenticated;
grant select on table public.answers to anon, authenticated;
grant select on table public.answer_results to anon, authenticated;

create policy "Surveys are publicly readable"
on public.surveys for select to anon, authenticated
using (true);

create policy "Questions are publicly readable"
on public.questions for select to anon, authenticated
using (true);

create policy "Answers are publicly readable"
on public.answers for select to anon, authenticated
using (true);

create policy "Answer results are publicly readable"
on public.answer_results for select to anon, authenticated
using (true);

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.initialize_answer_result() from public, anon, authenticated;
revoke execute on function public.update_answer_result() from public, anon, authenticated;
revoke execute on function public.create_survey(jsonb) from public, anon, authenticated;
revoke execute on function public.submit_survey_vote(text, uuid, jsonb)
from public, anon, authenticated;

grant execute on function public.create_survey(jsonb) to anon, authenticated;
grant execute on function public.submit_survey_vote(text, uuid, jsonb)
to anon, authenticated;

alter table public.answer_results replica identity full;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'answer_results'
  ) then
    alter publication supabase_realtime add table public.answer_results;
  end if;
end;
$$;
