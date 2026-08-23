begin;

insert into public.surveys (id, category, title, description, end_date)
values
  ('1', 'Team activities', 'Let’s Plan the Next Team Event Together', 'We want to create team activities that everyone will enjoy – share your preferences and ideas in our survey to help us plan better experiences together.', current_date + 1),
  ('2', 'Gaming & Entertainment', 'Gaming habits and favorite games!', 'We’d like to learn more about your gaming habits, favorite genres and preferred ways to play.', current_date + 3),
  ('3', 'Gaming & Entertainment', 'Which games should we play at our next community night?', '', current_date + 7),
  ('4', 'Health & Wellness', 'Healthier future: Fit & wellness survey!', 'Help us understand which health and wellness topics matter most to you and what could support a healthier everyday routine.', current_date + 2),
  ('5', 'Health & Wellness', 'Which wellness activities should we offer next?', '', current_date + 9),
  ('6', 'Team activities', 'Help us choose the next team-building activity', '', current_date + 12),
  ('7', 'Workplace culture', 'How do you feel about remote work?', 'This survey gathered feedback about remote-work routines, flexibility and the places where our team works best.', current_date - 4),
  ('8', 'Team activities', 'Summer team event retrospective', 'Thank you for joining our summer event. These final results show what the team enjoyed and what we can improve next time.', current_date - 7),
  ('9', 'Health & Wellness', 'Weekly wellness check-in', 'This completed check-in reflects how the team felt during the week and which habits supported everyone’s well-being.', current_date - 12)
on conflict (id) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  end_date = excluded.end_date;

insert into public.questions (id, survey_id, prompt, allow_multiple, position)
values
  ('team-date', '1', 'Which date would work best for you?', true, 1),
  ('team-activities', '1', 'Choose the activities you prefer', true, 2),
  ('team-priority', '1', 'What’s most important to you in a team event?', false, 3),
  ('team-duration', '1', 'How long would you prefer the event to last?', false, 4),
  ('gaming-frequency', '2', 'How often do you play video games?', false, 1),
  ('gaming-platforms', '2', 'Which platforms do you use?', true, 2),
  ('gaming-genres', '2', 'Which game genres do you enjoy most?', true, 3),
  ('gaming-priority', '2', 'What matters most when choosing a game?', false, 4),
  ('community-game-mode', '3', 'Which game should headline community night?', false, 1),
  ('community-game-style', '3', 'Which play styles should we include?', true, 2),
  ('wellness-goals', '4', 'Which wellness goals are most important to you?', true, 1),
  ('wellness-frequency', '4', 'How often do you exercise during a typical week?', false, 2),
  ('wellness-motivation', '4', 'What helps you stay motivated?', true, 3),
  ('wellness-activity', '4', 'Which wellness activity would you most like us to offer?', false, 4),
  ('wellness-offering', '5', 'Which wellness activities should we offer next?', true, 1),
  ('wellness-schedule', '5', 'When should wellness activities take place?', false, 2),
  ('team-building-choice', '6', 'Which team-building activity should we plan next?', false, 1),
  ('team-building-goal', '6', 'What should the next team-building event achieve?', true, 2),
  ('remote-work-location', '7', 'Where did you work most often?', false, 1),
  ('remote-work-benefits', '7', 'Which aspects of remote work helped you most?', true, 2),
  ('summer-event-rating', '8', 'How would you rate the summer team event?', false, 1),
  ('summer-event-highlights', '8', 'Which parts of the event did you enjoy most?', true, 2),
  ('wellness-check-in-energy', '9', 'How was your energy level this week?', false, 1),
  ('wellness-check-in-support', '9', 'What supported your well-being this week?', true, 2)
on conflict (id) do update set
  survey_id = excluded.survey_id,
  prompt = excluded.prompt,
  allow_multiple = excluded.allow_multiple,
  position = excluded.position;

create temporary table pollapp_seed_answers (
  id text primary key,
  question_id text not null,
  text text not null,
  position integer not null,
  vote_count bigint not null
) on commit drop;

insert into pollapp_seed_answers (id, question_id, text, position, vote_count)
values
  ('team-date-1', 'team-date', '19.09.2025, Friday', 1, 27),
  ('team-date-2', 'team-date', '10.10.2025, Friday', 2, 44),
  ('team-date-3', 'team-date', '11.10.2025, Saturday', 3, 3),
  ('team-date-4', 'team-date', '31.10.2025, Friday', 4, 26),
  ('team-activity-1', 'team-activities', 'Outdoor adventure like kayaking', 1, 60),
  ('team-activity-2', 'team-activities', 'Office Costume Party', 2, 0),
  ('team-activity-3', 'team-activities', 'Bowling, mini-golf, volleyball', 3, 14),
  ('team-activity-4', 'team-activities', 'Beach party, Music & cocktails', 4, 26),
  ('team-activity-5', 'team-activities', 'Escape room', 5, 0),
  ('team-priority-1', 'team-priority', 'Team bonding', 1, 44),
  ('team-priority-2', 'team-priority', 'Food and drinks', 2, 3),
  ('team-priority-3', 'team-priority', 'Trying something new', 3, 26),
  ('team-priority-4', 'team-priority', 'Keeping it low-key and stress-free', 4, 27),
  ('team-duration-1', 'team-duration', 'Half a day', 1, 14),
  ('team-duration-2', 'team-duration', 'Full day', 2, 86),
  ('team-duration-3', 'team-duration', 'Evening only', 3, 0),
  ('gaming-frequency-1', 'gaming-frequency', 'Every day', 1, 32),
  ('gaming-frequency-2', 'gaming-frequency', 'Several times a week', 2, 41),
  ('gaming-frequency-3', 'gaming-frequency', 'A few times a month', 3, 19),
  ('gaming-frequency-4', 'gaming-frequency', 'Rarely', 4, 8),
  ('gaming-platform-1', 'gaming-platforms', 'PC', 1, 38),
  ('gaming-platform-2', 'gaming-platforms', 'PlayStation', 2, 29),
  ('gaming-platform-3', 'gaming-platforms', 'Xbox', 3, 18),
  ('gaming-platform-4', 'gaming-platforms', 'Nintendo Switch', 4, 15),
  ('gaming-genre-1', 'gaming-genres', 'Action and adventure', 1, 28),
  ('gaming-genre-2', 'gaming-genres', 'Strategy', 2, 22),
  ('gaming-genre-3', 'gaming-genres', 'Role-playing games', 3, 24),
  ('gaming-genre-4', 'gaming-genres', 'Sports and racing', 4, 18),
  ('gaming-genre-5', 'gaming-genres', 'Cozy and casual games', 5, 8),
  ('gaming-priority-1', 'gaming-priority', 'Story and world', 1, 31),
  ('gaming-priority-2', 'gaming-priority', 'Playing with friends', 2, 37),
  ('gaming-priority-3', 'gaming-priority', 'Challenge and gameplay', 3, 25),
  ('gaming-priority-4', 'gaming-priority', 'Visual style', 4, 7),
  ('community-game-mode-1', 'community-game-mode', 'Cooperative adventure', 1, 34),
  ('community-game-mode-2', 'community-game-mode', 'Party games', 2, 28),
  ('community-game-mode-3', 'community-game-mode', 'Strategy challenge', 3, 22),
  ('community-game-mode-4', 'community-game-mode', 'Sports tournament', 4, 16),
  ('community-game-style-1', 'community-game-style', 'Team-based games', 1, 38),
  ('community-game-style-2', 'community-game-style', 'Short rounds', 2, 31),
  ('community-game-style-3', 'community-game-style', 'Beginner-friendly games', 3, 24),
  ('community-game-style-4', 'community-game-style', 'Competitive bracket', 4, 19),
  ('wellness-goal-1', 'wellness-goals', 'Being more active', 1, 34),
  ('wellness-goal-2', 'wellness-goals', 'Improving sleep', 2, 27),
  ('wellness-goal-3', 'wellness-goals', 'Eating balanced meals', 3, 23),
  ('wellness-goal-4', 'wellness-goals', 'Reducing stress', 4, 16),
  ('wellness-frequency-1', 'wellness-frequency', 'Not currently', 1, 12),
  ('wellness-frequency-2', 'wellness-frequency', '1–2 days', 2, 35),
  ('wellness-frequency-3', 'wellness-frequency', '3–4 days', 3, 41),
  ('wellness-frequency-4', 'wellness-frequency', '5 or more days', 4, 12),
  ('wellness-motivation-1', 'wellness-motivation', 'Clear personal goals', 1, 29),
  ('wellness-motivation-2', 'wellness-motivation', 'Exercising with others', 2, 34),
  ('wellness-motivation-3', 'wellness-motivation', 'Tracking progress', 3, 25),
  ('wellness-motivation-4', 'wellness-motivation', 'Professional guidance', 4, 12),
  ('wellness-activity-1', 'wellness-activity', 'Group fitness sessions', 1, 26),
  ('wellness-activity-2', 'wellness-activity', 'Healthy cooking workshops', 2, 21),
  ('wellness-activity-3', 'wellness-activity', 'Mindfulness sessions', 3, 31),
  ('wellness-activity-4', 'wellness-activity', 'Walking or running groups', 4, 22),
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
  ('team-building-goal-4', 'team-building-goal', 'Welcoming new colleagues', 4, 18),
  ('remote-work-location-1', 'remote-work-location', 'Mostly from home', 1, 46),
  ('remote-work-location-2', 'remote-work-location', 'Mostly from the office', 2, 18),
  ('remote-work-location-3', 'remote-work-location', 'A balanced mix of both', 3, 36),
  ('remote-work-benefit-1', 'remote-work-benefits', 'More focused work time', 1, 38),
  ('remote-work-benefit-2', 'remote-work-benefits', 'A flexible daily schedule', 2, 34),
  ('remote-work-benefit-3', 'remote-work-benefits', 'Less commuting', 3, 22),
  ('remote-work-benefit-4', 'remote-work-benefits', 'A better work-life balance', 4, 29),
  ('summer-event-rating-1', 'summer-event-rating', 'Excellent', 1, 41),
  ('summer-event-rating-2', 'summer-event-rating', 'Good', 2, 37),
  ('summer-event-rating-3', 'summer-event-rating', 'Okay', 3, 15),
  ('summer-event-rating-4', 'summer-event-rating', 'Needs improvement', 4, 7),
  ('summer-event-highlight-1', 'summer-event-highlights', 'Outdoor activities', 1, 32),
  ('summer-event-highlight-2', 'summer-event-highlights', 'Food and drinks', 2, 28),
  ('summer-event-highlight-3', 'summer-event-highlights', 'Time with the team', 3, 44),
  ('summer-event-highlight-4', 'summer-event-highlights', 'Music and entertainment', 4, 19),
  ('wellness-check-in-energy-1', 'wellness-check-in-energy', 'High', 1, 24),
  ('wellness-check-in-energy-2', 'wellness-check-in-energy', 'Mostly steady', 2, 48),
  ('wellness-check-in-energy-3', 'wellness-check-in-energy', 'Low', 3, 28),
  ('wellness-check-in-support-1', 'wellness-check-in-support', 'Regular breaks', 1, 31),
  ('wellness-check-in-support-2', 'wellness-check-in-support', 'Movement or exercise', 2, 27),
  ('wellness-check-in-support-3', 'wellness-check-in-support', 'Connecting with colleagues', 3, 22),
  ('wellness-check-in-support-4', 'wellness-check-in-support', 'A manageable workload', 4, 35);

insert into public.answers (id, question_id, text, position)
select id, question_id, text, position from pollapp_seed_answers
on conflict (id) do update set
  question_id = excluded.question_id,
  text = excluded.text,
  position = excluded.position;

insert into public.votes (id, survey_id, anonymous_token)
select
  survey_id || '-seed-vote-' || voter_number,
  survey_id,
  md5(survey_id || ':' || voter_number)::uuid
from (values ('1'), ('2'), ('3'), ('4'), ('5'), ('6'), ('7'), ('8'), ('9')) as seeded_surveys (survey_id)
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
  from pollapp_seed_answers as seed
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

commit;
