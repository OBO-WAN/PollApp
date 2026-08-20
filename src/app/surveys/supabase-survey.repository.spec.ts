import { TestBed } from '@angular/core/testing';
import { SupabaseClient } from '@supabase/supabase-js';

import {
  mapSupabaseSurvey,
  SUPABASE_CLIENT,
  SupabaseSurveyRepository,
  SupabaseSurveyRow,
} from './supabase-survey.repository';

describe('SupabaseSurveyRepository', () => {
  it('maps nested rows and preserves question and answer positions', () => {
    const endDate = dateFromToday(2);
    const survey = mapSupabaseSurvey({
      id: 'survey-1',
      category: 'Team activities',
      title: 'Team lunch',
      description: null,
      end_date: endDate,
      created_at: '2026-08-20T08:00:00Z',
      questions: [
        {
          id: 'question-2',
          prompt: 'Second question',
          allow_multiple: true,
          position: 2,
          answers: [],
        },
        {
          id: 'question-1',
          prompt: 'First question',
          allow_multiple: false,
          position: 1,
          answers: [
            {
              id: 'answer-2',
              text: 'Second answer',
              position: 2,
              answer_results: [{ vote_count: '7' }],
            },
            {
              id: 'answer-1',
              text: 'First answer',
              position: 1,
              answer_results: { vote_count: 3 },
            },
          ],
        },
      ],
    });

    expect(survey).toMatchObject({
      id: 'survey-1',
      description: '',
      endDate,
      daysRemaining: 2,
      status: 'active',
    });
    expect(survey.questions.map((question) => question.id)).toEqual(['question-1', 'question-2']);
    expect(survey.questions[0].answers.map((answer) => answer.id)).toEqual([
      'answer-1',
      'answer-2',
    ]);
    expect(survey.questions[0].answers.map((answer) => answer.voteCount)).toEqual([3, 7]);
  });

  it('returns an empty collection when Supabase has no surveys', async () => {
    const repository = createRepository({ data: [], error: null });

    await expect(repository.listSurveys()).resolves.toEqual([]);
  });

  it('surfaces Supabase query failures to the fallback repository', async () => {
    const repository = createRepository({ data: null, error: { message: 'offline' } });

    await expect(repository.listSurveys()).rejects.toThrow('Supabase could not load surveys.');
  });
});

function createRepository(result: { data: readonly SupabaseSurveyRow[] | null; error: unknown }) {
  const client = {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue(result),
    })),
  } as unknown as SupabaseClient;

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [SupabaseSurveyRepository, { provide: SUPABASE_CLIENT, useValue: client }],
  });

  return TestBed.inject(SupabaseSurveyRepository);
}

function dateFromToday(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
