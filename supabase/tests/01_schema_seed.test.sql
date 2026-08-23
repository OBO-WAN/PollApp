begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(22);

select has_table('public', 'surveys', 'surveys table exists');
select has_table('public', 'questions', 'questions table exists');
select has_table('public', 'answers', 'answers table exists');
select has_table('public', 'votes', 'votes table exists');
select has_table('public', 'vote_selections', 'vote selections table exists');
select has_table('public', 'answer_results', 'answer results table exists');

select has_function(
  'public',
  'create_survey',
  array['jsonb'],
  'survey creation RPC exists'
);
select has_function(
  'public',
  'submit_survey_vote',
  array['text', 'uuid', 'jsonb'],
  'vote submission RPC exists'
);

select results_eq(
  $$select count(*) from public.surveys$$,
  array[9::bigint],
  'seed contains nine surveys'
);
select results_eq(
  $$select count(*) from public.questions$$,
  array[24::bigint],
  'seed contains twenty-four questions'
);
select results_eq(
  $$select count(*) from public.answers$$,
  array[95::bigint],
  'seed contains ninety-five answers'
);
select results_eq(
  $$select count(*) from public.votes$$,
  array[900::bigint],
  'seed contains nine hundred ballots'
);
select results_eq(
  $$select count(*) from public.vote_selections$$,
  array[2519::bigint],
  'seed contains the expected answer selections'
);
select results_eq(
  $$select count(*) from public.answer_results$$,
  array[95::bigint],
  'every answer has an aggregate result'
);
select results_eq(
  $$select sum(vote_count) from public.answer_results$$,
  array[2519::numeric],
  'aggregate totals match all answer selections'
);

select results_eq(
  $$
    select count(*)
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname in (
        'surveys',
        'questions',
        'answers',
        'votes',
        'vote_selections',
        'answer_results'
      )
      and relrowsecurity
  $$,
  array[6::bigint],
  'RLS is enabled on every application table'
);
select results_eq(
  $$
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename in ('surveys', 'questions', 'answers', 'answer_results')
  $$,
  array[4::bigint],
  'the four public read policies exist'
);
select results_eq(
  $$
    select count(*)
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'answer_results'
  $$,
  array[1::bigint],
  'answer results are published for realtime updates'
);

select results_eq(
  $$
    select count(*)
    from public.answer_results as result
    left join (
      select answer_id, count(*) as vote_count
      from public.vote_selections
      group by answer_id
    ) as selection using (answer_id)
    where result.vote_count <> coalesce(selection.vote_count, 0)
  $$,
  array[0::bigint],
  'stored aggregates equal their underlying selections'
);
select results_eq(
  $$
    select count(*)
    from (
      select 1
      from public.votes as vote
      join public.questions as question using (survey_id)
      left join public.vote_selections as selection
        on selection.vote_id = vote.id
        and selection.question_id = question.id
      group by vote.id, question.id, question.allow_multiple
      having count(selection.answer_id) = 0
        or (not question.allow_multiple and count(selection.answer_id) <> 1)
    ) as invalid_ballot_answer
  $$,
  array[0::bigint],
  'every seeded ballot answers each question correctly'
);
select results_eq(
  $$
    select count(*)
    from public.surveys as survey
    where not exists (
      select 1
      from public.questions as question
      where question.survey_id = survey.id
    )
  $$,
  array[0::bigint],
  'every seeded survey contains voting questions'
);
select results_eq(
  $$
    select count(*)
    from (
      select question.id
      from public.questions as question
      left join public.answers as answer on answer.question_id = question.id
      group by question.id
      having count(answer.id) not between 2 and 6
    ) as invalid_question
  $$,
  array[0::bigint],
  'every seeded question contains between two and six answers'
);

select * from finish();
rollback;
