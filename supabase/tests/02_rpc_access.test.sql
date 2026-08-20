begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(17);

select ok(
  has_table_privilege('anon', 'public.surveys', 'SELECT'),
  'anonymous clients can read surveys'
);
select ok(
  not has_table_privilege('anon', 'public.surveys', 'INSERT'),
  'anonymous clients cannot insert surveys directly'
);
select ok(
  not has_table_privilege('anon', 'public.votes', 'SELECT'),
  'anonymous clients cannot read ballots'
);
select ok(
  not has_table_privilege('anon', 'public.vote_selections', 'SELECT'),
  'anonymous clients cannot read ballot selections'
);
select ok(
  has_function_privilege('anon', 'public.create_survey(jsonb)', 'EXECUTE'),
  'anonymous clients can execute the survey creation RPC'
);
select ok(
  has_function_privilege(
    'anon',
    'public.submit_survey_vote(text,uuid,jsonb)',
    'EXECUTE'
  ),
  'anonymous clients can execute the vote submission RPC'
);

set local role anon;

select lives_ok(
  $$
    select public.create_survey(
      '{
        "category": "Team activities",
        "title": "Database RPC smoke test",
        "description": "Created inside a rolled-back pgTAP test.",
        "endDate": null,
        "questions": [
          {
            "prompt": "Choose one answer",
            "allowMultiple": false,
            "answers": ["First", "Second"]
          }
        ]
      }'::jsonb
    )
  $$,
  'anonymous survey creation succeeds through the RPC'
);

select lives_ok(
  $$
    select public.submit_survey_vote(
      '1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
      '[
        {"questionId":"team-date","answerIds":["team-date-1"]},
        {"questionId":"team-activities","answerIds":["team-activity-1"]},
        {"questionId":"team-priority","answerIds":["team-priority-1"]},
        {"questionId":"team-duration","answerIds":["team-duration-1"]}
      ]'::jsonb
    )
  $$,
  'anonymous vote submission succeeds through the RPC'
);

reset role;

select results_eq(
  $$
    select answer_id, vote_count
    from public.answer_results
    where answer_id in (
      'team-activity-1',
      'team-date-1',
      'team-duration-1',
      'team-priority-1'
    )
    order by answer_id
  $$,
  $$
    values
      ('team-activity-1'::text, 61::bigint),
      ('team-date-1'::text, 28::bigint),
      ('team-duration-1'::text, 15::bigint),
      ('team-priority-1'::text, 45::bigint)
  $$,
  'vote submission updates every selected aggregate'
);
select results_eq(
  $$select count(*) from public.votes where survey_id = '1'$$,
  array[101::bigint],
  'vote submission stores one ballot'
);
select results_eq(
  $$
    select count(*)
    from public.vote_selections
    where vote_id = (
      select id
      from public.votes
      where survey_id = '1'
        and anonymous_token = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
    )
  $$,
  array[4::bigint],
  'vote submission stores all four selections'
);

set local role anon;

select throws_ok(
  $$
    select public.submit_survey_vote(
      '1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
      '[
        {"questionId":"team-date","answerIds":["team-date-1"]},
        {"questionId":"team-activities","answerIds":["team-activity-1"]},
        {"questionId":"team-priority","answerIds":["team-priority-1"]},
        {"questionId":"team-duration","answerIds":["team-duration-1"]}
      ]'::jsonb
    )
  $$,
  'P0001',
  'A vote has already been submitted for this survey',
  'duplicate browser tokens are rejected'
);
select throws_ok(
  $$
    select public.submit_survey_vote(
      '1',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
      '[
        {"questionId":"team-date","answerIds":["team-date-1"]},
        {"questionId":"team-activities","answerIds":["team-activity-1"]},
        {"questionId":"team-priority","answerIds":["team-priority-1","team-priority-2"]},
        {"questionId":"team-duration","answerIds":["team-duration-1"]}
      ]'::jsonb
    )
  $$,
  'P0001',
  'The selected answer count is invalid for this question',
  'single-choice questions reject multiple answers'
);
select throws_ok(
  $$
    select public.submit_survey_vote(
      '7',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
      '[
        {"questionId":"remote-work-location","answerIds":["remote-work-location-1"]},
        {"questionId":"remote-work-benefits","answerIds":["remote-work-benefit-1"]}
      ]'::jsonb
    )
  $$,
  'P0001',
  'Survey is unavailable or closed',
  'past surveys reject new votes'
);

reset role;

select ok(
  not has_table_privilege('anon', 'public.answers', 'UPDATE'),
  'anonymous clients cannot update answers directly'
);
select ok(
  not has_table_privilege('anon', 'public.answer_results', 'UPDATE'),
  'anonymous clients cannot alter aggregate results directly'
);
select ok(
  has_table_privilege('anon', 'public.answer_results', 'SELECT'),
  'anonymous clients can read aggregate results'
);

select * from finish();
rollback;
