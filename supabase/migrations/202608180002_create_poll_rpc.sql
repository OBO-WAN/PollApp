create function public.create_survey(p_payload jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_survey_id text := gen_random_uuid()::text;
  new_question_id text;
  question_payload jsonb;
  answer_payload jsonb;
  question_position bigint;
  answer_position bigint;
  survey_category text := btrim(coalesce(p_payload ->> 'category', ''));
  survey_title text := btrim(coalesce(p_payload ->> 'title', ''));
  survey_description text := btrim(coalesce(p_payload ->> 'description', ''));
  survey_end_date date;
begin
  if p_payload is null or jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'Survey payload must be an object';
  end if;

  if survey_category not in (
    'Team activities',
    'Gaming & Entertainment',
    'Health & Wellness',
    'Workplace culture'
  ) then
    raise exception 'Survey category is not supported';
  end if;

  if length(survey_title) not between 1 and 160 then
    raise exception 'Survey title must contain between 1 and 160 characters';
  end if;

  if length(survey_description) > 2000 then
    raise exception 'Survey description cannot exceed 2000 characters';
  end if;

  if nullif(p_payload ->> 'endDate', '') is not null then
    begin
      survey_end_date := (p_payload ->> 'endDate')::date;
    exception when invalid_datetime_format then
      raise exception 'Survey end date is invalid';
    end;

    if survey_end_date < current_date then
      raise exception 'Survey end date cannot be in the past';
    end if;
  end if;

  if jsonb_typeof(p_payload -> 'questions') is distinct from 'array' then
    raise exception 'Survey questions must be an array';
  end if;

  if jsonb_array_length(p_payload -> 'questions') = 0 then
    raise exception 'A survey must contain at least one question';
  end if;

  if jsonb_array_length(p_payload -> 'questions') > 20 then
    raise exception 'A survey cannot contain more than 20 questions';
  end if;

  insert into public.surveys (id, category, title, description, end_date)
  values (new_survey_id, survey_category, survey_title, survey_description, survey_end_date);

  for question_payload, question_position in
    select value, ordinality
    from jsonb_array_elements(p_payload -> 'questions') with ordinality
  loop
    if jsonb_typeof(question_payload) is distinct from 'object'
      or length(btrim(coalesce(question_payload ->> 'prompt', ''))) not between 1 and 240 then
      raise exception 'Every question needs a prompt of 1 to 240 characters';
    end if;

    if jsonb_typeof(question_payload -> 'allowMultiple') is distinct from 'boolean' then
      raise exception 'Every question needs an allowMultiple boolean';
    end if;

    if jsonb_typeof(question_payload -> 'answers') is distinct from 'array' then
      raise exception 'Question answers must be an array';
    end if;

    if jsonb_array_length(question_payload -> 'answers') < 2 then
      raise exception 'Every question needs at least two answers';
    end if;

    if jsonb_array_length(question_payload -> 'answers') > 20 then
      raise exception 'A question cannot contain more than 20 answers';
    end if;

    new_question_id := gen_random_uuid()::text;
    insert into public.questions (id, survey_id, prompt, allow_multiple, position)
    values (
      new_question_id,
      new_survey_id,
      btrim(question_payload ->> 'prompt'),
      (question_payload ->> 'allowMultiple')::boolean,
      question_position
    );

    for answer_payload, answer_position in
      select value, ordinality
      from jsonb_array_elements(question_payload -> 'answers') with ordinality
    loop
      if jsonb_typeof(answer_payload) is distinct from 'string'
        or length(btrim(answer_payload #>> '{}')) not between 1 and 240 then
        raise exception 'Every answer must contain between 1 and 240 characters';
      end if;

      insert into public.answers (question_id, text, position)
      values (new_question_id, btrim(answer_payload #>> '{}'), answer_position);
    end loop;
  end loop;

  return new_survey_id;
end;
$$;

create function public.submit_survey_vote(
  p_survey_id text,
  p_anonymous_token uuid,
  p_selections jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_vote_id text := gen_random_uuid()::text;
  selection_payload jsonb;
  answer_payload jsonb;
  selected_question_id text;
  selected_answer_id text;
  question_allow_multiple boolean;
  seen_question_ids text[] := array[]::text[];
  seen_answer_ids text[];
begin
  if p_survey_id is null or p_anonymous_token is null then
    raise exception 'Survey and anonymous voter token are required';
  end if;

  if not exists (
    select 1
    from public.surveys
    where id = p_survey_id
      and (end_date is null or end_date >= current_date)
  ) then
    raise exception 'Survey is unavailable or closed';
  end if;

  if p_selections is null
    or jsonb_typeof(p_selections) is distinct from 'array' then
    raise exception 'Vote selections must be an array';
  end if;

  if jsonb_array_length(p_selections) = 0 then
    raise exception 'Vote selections must be a non-empty array';
  end if;

  if jsonb_array_length(p_selections) <> (
    select count(*) from public.questions where survey_id = p_survey_id
  ) then
    raise exception 'Every survey question must be answered';
  end if;

  if exists (
    select 1 from public.votes
    where survey_id = p_survey_id and anonymous_token = p_anonymous_token
  ) then
    raise exception 'A vote has already been submitted for this survey';
  end if;

  for selection_payload in select value from jsonb_array_elements(p_selections)
  loop
    if jsonb_typeof(selection_payload) is distinct from 'object' then
      raise exception 'Every selection must be an object';
    end if;

    if jsonb_typeof(selection_payload -> 'answerIds') is distinct from 'array' then
      raise exception 'Every selection needs a questionId and answerIds array';
    end if;

    selected_question_id := btrim(coalesce(selection_payload ->> 'questionId', ''));
    if selected_question_id = '' or selected_question_id = any(seen_question_ids) then
      raise exception 'Question selections must be unique and valid';
    end if;

    select allow_multiple
    into question_allow_multiple
    from public.questions
    where id = selected_question_id and survey_id = p_survey_id;

    if not found then
      raise exception 'A selected question does not belong to this survey';
    end if;

    if jsonb_array_length(selection_payload -> 'answerIds') = 0
      or (
        not question_allow_multiple
        and jsonb_array_length(selection_payload -> 'answerIds') <> 1
      ) then
      raise exception 'The selected answer count is invalid for this question';
    end if;

    seen_answer_ids := array[]::text[];
    for answer_payload in
      select value from jsonb_array_elements(selection_payload -> 'answerIds')
    loop
      if jsonb_typeof(answer_payload) is distinct from 'string' then
        raise exception 'Answer IDs must be strings';
      end if;

      selected_answer_id := btrim(answer_payload #>> '{}');
      if selected_answer_id = '' or selected_answer_id = any(seen_answer_ids) then
        raise exception 'Answer selections must be unique and valid';
      end if;

      if not exists (
        select 1 from public.answers
        where id = selected_answer_id and question_id = selected_question_id
      ) then
        raise exception 'A selected answer does not belong to its question';
      end if;

      seen_answer_ids := array_append(seen_answer_ids, selected_answer_id);
    end loop;

    seen_question_ids := array_append(seen_question_ids, selected_question_id);
  end loop;

  insert into public.votes (id, survey_id, anonymous_token)
  values (new_vote_id, p_survey_id, p_anonymous_token);

  for selection_payload in select value from jsonb_array_elements(p_selections)
  loop
    selected_question_id := selection_payload ->> 'questionId';
    for answer_payload in
      select value from jsonb_array_elements(selection_payload -> 'answerIds')
    loop
      insert into public.vote_selections (vote_id, survey_id, question_id, answer_id)
      values (new_vote_id, p_survey_id, selected_question_id, answer_payload #>> '{}');
    end loop;
  end loop;

  return true;
exception when unique_violation then
  raise exception 'A vote has already been submitted for this survey';
end;
$$;
