# PollApp Supabase database

This directory contains the database contract for PollApp. The Angular application is not connected to it yet; that adapter belongs in a separate integration change.

## Data model

| Relation          | Purpose                                           | Anonymous access |
| ----------------- | ------------------------------------------------- | ---------------- |
| `surveys`         | Survey metadata and lifecycle                     | Read             |
| `questions`       | Ordered survey questions                          | Read             |
| `answers`         | Ordered answer choices                            | Read             |
| `votes`           | One anonymous ballot per survey and browser token | None             |
| `vote_selections` | Answers selected on a ballot                      | None             |
| `answer_results`  | Public aggregate count per answer                 | Read + realtime  |

Direct writes are not granted to `anon` or `authenticated`. The security-definer functions validate input and perform each multi-table write in one transaction:

- `create_survey(jsonb)` creates a survey with its questions and answers.
- `submit_survey_vote(text, uuid, jsonb)` validates and stores a complete ballot.

The anonymous token is a client-generated UUID used for best-effort duplicate prevention. It is not authentication and is never exposed through public read policies.

## Migration order

1. `202608180001_create_poll_schema.sql` creates relations, indexes, aggregate triggers, and timestamps.
2. `202608180002_create_poll_rpc.sql` creates the validated write functions.
3. `202608180003_configure_poll_access.sql` enables RLS, grants the minimum public access, and enables realtime aggregate updates.

`seed.sql` mirrors the current Angular fixtures. It creates deterministic anonymous ballots so the resulting aggregate counts match the fixture results.

## Local verification

The repository pins the Supabase CLI as a development dependency and includes `config.toml`. Docker must be installed and running before starting the local stack.

Install dependencies, then execute the complete database check:

```bash
npm install
npm run supabase:verify
```

The verification command starts Supabase, recreates the local database, applies every migration, loads `seed.sql`, and runs the pgTAP tests under `supabase/tests/`.

To stop the local services without deleting their data:

```bash
npm run supabase:stop
```

Useful checks:

```sql
select count(*) as surveys from public.surveys;
select count(*) as questions from public.questions;
select count(*) as answers from public.answers;
select count(*) as votes from public.votes;
select count(*) as selections from public.vote_selections;
```

The seeded baseline is 9 surveys, 18 questions, 71 answers, and 600 anonymous ballots. Selection totals vary because multi-choice questions may contain more than one answer.

The database tests additionally verify RLS privileges, realtime publication, transactional survey creation, vote submission, aggregate updates, duplicate-vote prevention, single-choice validation, and closed-survey behavior.

## Remote project

Linking and pushing should be done only after choosing the target Supabase project. Run the dry-run first and inspect its migration list:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run --include-seed
npx supabase db push --include-seed
npx supabase test db --linked
```

The linked-project test expects the fixture seed baseline and is intended for the initial deployment before real users vote. Do not commit database passwords, secret or service-role keys, access tokens, `.env` files, or generated files from `supabase/.temp/`.

## RPC payloads

Survey creation accepts the same shape as the Angular `CreateSurveyInput` model:

```json
{
  "category": "Team activities",
  "title": "Choose our next activity",
  "description": "Help the team decide.",
  "endDate": "2026-09-01",
  "questions": [
    {
      "prompt": "What should we do?",
      "allowMultiple": false,
      "answers": ["Bowling", "Escape room"]
    }
  ]
}
```

Vote submission accepts the selected IDs and a stable, client-generated anonymous UUID:

```json
[
  {
    "questionId": "question-id",
    "answerIds": ["answer-id"]
  }
]
```
