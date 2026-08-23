create or replace function public.create_survey(p_payload jsonb)
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

    if jsonb_array_length(question_payload -> 'answers') > 6 then
      raise exception 'A question cannot contain more than 6 answers';
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
