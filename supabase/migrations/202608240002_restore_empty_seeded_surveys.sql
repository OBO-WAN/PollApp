begin;

insert into public.questions (id, survey_id, prompt, allow_multiple, position)
values
  ('community-game-mode', '3', 'Which game should headline community night?', false, 1),
  ('community-game-style', '3', 'Which play styles should we include?', true, 2),
  ('wellness-offering', '5', 'Which wellness activities should we offer next?', true, 1),
  ('wellness-schedule', '5', 'When should wellness activities take place?', false, 2),
  ('team-building-choice', '6', 'Which team-building activity should we plan next?', false, 1),
  ('team-building-goal', '6', 'What should the next team-building event achieve?', true, 2)
on conflict (id) do update set
  survey_id = excluded.survey_id,
  prompt = excluded.prompt,
  allow_multiple = excluded.allow_multiple,
  position = excluded.position;

create temporary table pollapp_repaired_seed_answers (
  id text primary key,
  question_id text not null,
  text text not null,
  position integer not null,
  vote_count bigint not null
) on commit drop;

insert into pollapp_repaired_seed_answers (id, question_id, text, position, vote_count)
values
  ('community-game-mode-1', 'community-game-mode', 'Cooperative adventure', 1, 34),
  ('community-game-mode-2', 'community-game-mode', 'Party games', 2, 28),
  ('community-game-mode-3', 'community-game-mode', 'Strategy challenge', 3, 22),
  ('community-game-mode-4', 'community-game-mode', 'Sports tournament', 4, 16),
  ('community-game-style-1', 'community-game-style', 'Team-based games', 1, 38),
  ('community-game-style-2', 'community-game-style', 'Short rounds', 2, 31),
  ('community-game-style-3', 'community-game-style', 'Beginner-friendly games', 3, 24),
  ('community-game-style-4', 'community-game-style', 'Competitive bracket', 4, 19),
  ('wellness-offering-1', 'wellness-offering', 'Group fitness sessions', 1, 42),
  ('wellness-offering-2', 'wellness-offering', 'Healthy cooking workshops', 2, 35),
  ('wellness-offering-3', 'wellness-offering', 'Mindfulness sessions', 3, 27),
  ('wellness-offering-4', 'wellness-offering', 'Walking or running groups', 4, 21),
  ('wellness-schedule-1', 'wellness-schedule', 'Before work', 1, 24),
  ('wellness-schedule-2', 'wellness-schedule', 'During lunch', 2, 36),
  ('wellness-schedule-3', 'wellness-schedule', 'After work', 3, 28),
  ('wellness-schedule-4', 'wellness-schedule', 'Rotating times', 4, 12),
  ('team-building-choice-1', 'team-building-choice', 'Escape room', 1, 29),
  ('team-building-choice-2', 'team-building-choice', 'Outdoor challenge', 2, 33),
  ('team-building-choice-3', 'team-building-choice', 'Cooking class', 3, 21),
  ('team-building-choice-4', 'team-building-choice', 'Creative workshop', 4, 17),
  ('team-building-goal-1', 'team-building-goal', 'Stronger collaboration', 1, 41),
  ('team-building-goal-2', 'team-building-goal', 'Relaxed social time', 2, 37),
  ('team-building-goal-3', 'team-building-goal', 'Learning new skills', 3, 25),
  ('team-building-goal-4', 'team-building-goal', 'Welcoming new colleagues', 4, 18);

insert into public.answers (id, question_id, text, position)
select id, question_id, text, position
from pollapp_repaired_seed_answers
on conflict (id) do update set
  question_id = excluded.question_id,
  text = excluded.text,
  position = excluded.position;

insert into public.votes (id, survey_id, anonymous_token)
select
  survey_id || '-seed-vote-' || voter_number,
  survey_id,
  md5(survey_id || ':' || voter_number)::uuid
from (values ('3'), ('5'), ('6')) as repaired_surveys (survey_id)
cross join generate_series(1, 100) as voters (voter_number)
on conflict (survey_id, anonymous_token) do nothing;

with answer_windows as (
  select
    seed.id as answer_id,
    seed.question_id,
    question.survey_id,
    seed.vote_count,
    coalesce(
      sum(seed.vote_count) over (
        partition by seed.question_id
        order by seed.position
        rows between unbounded preceding and 1 preceding
      ),
      0
    ) as vote_offset
  from pollapp_repaired_seed_answers as seed
  join public.questions as question on question.id = seed.question_id
)
insert into public.vote_selections (vote_id, survey_id, question_id, answer_id)
select
  answer_window.survey_id || '-seed-vote-' || voter.voter_number,
  answer_window.survey_id,
  answer_window.question_id,
  answer_window.answer_id
from answer_windows as answer_window
cross join generate_series(1, 100) as voter (voter_number)
where mod(voter.voter_number - 1 - answer_window.vote_offset + 200, 100)
  < answer_window.vote_count
on conflict (vote_id, answer_id) do nothing;

do $$
begin
  if exists (
    select 1
    from public.surveys as survey
    where not exists (
      select 1
      from public.questions as question
      where question.survey_id = survey.id
    )
  ) then
    raise exception 'Every survey must contain at least one question';
  end if;

  if exists (
    select 1
    from public.questions as question
    left join public.answers as answer on answer.question_id = question.id
    group by question.id
    having count(answer.id) not between 2 and 6
  ) then
    raise exception 'Every question must contain between two and six answers';
  end if;
end;
$$;

commit;
