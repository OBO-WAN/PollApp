do $$
declare
  mentor_test_survey_id constant text := '944f7e27-2f90-4712-aeb7-a2eee08fa47b';
begin
  if exists (
    select 1
    from public.surveys
    where id = mentor_test_survey_id
  ) then
    if not exists (
      select 1
      from public.questions as question
      join public.answers as answer on answer.question_id = question.id
      where question.survey_id = mentor_test_survey_id
      group by question.id
      having count(answer.id) > 6
    ) then
      raise exception
        'Refusing to remove mentor test survey: it no longer contains an invalid answer count';
    end if;

    delete from public.surveys
    where id = mentor_test_survey_id;
  end if;
end;
$$;
