do $$
declare
  verification_survey_id constant text := 'bcd14444-983e-40e4-a0c9-b3e245f66e08';
  verification_survey_title constant text := 'Production Deployment Verification 2026-08-24';
begin
  if exists (
    select 1
    from public.surveys
    where id = verification_survey_id
      and title <> verification_survey_title
  ) then
    raise exception 'Refusing to remove a survey whose title no longer matches';
  end if;

  delete from public.surveys
  where id = verification_survey_id
    and title = verification_survey_title;
end;
$$;
