import { TestBed } from '@angular/core/testing';

import { FallbackSurveyRepository } from './fallback-survey.repository';
import { InMemorySurveyRepository } from './in-memory-survey.repository';
import { Survey } from './survey.model';
import { SurveyDataStatus } from './survey-data-status';
import { SupabaseSurveyRepository } from './supabase-survey.repository';

describe('FallbackSurveyRepository', () => {
  let repository: FallbackSurveyRepository;
  let dataStatus: SurveyDataStatus;
  let fallback: InMemorySurveyRepository;
  let primary: {
    listSurveys: ReturnType<typeof vi.fn>;
    getSurveyById: ReturnType<typeof vi.fn>;
    createSurvey: ReturnType<typeof vi.fn>;
    submitVote: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    primary = {
      listSurveys: vi.fn(),
      getSurveyById: vi.fn(),
      createSurvey: vi.fn(),
      submitVote: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FallbackSurveyRepository,
        InMemorySurveyRepository,
        { provide: SupabaseSurveyRepository, useValue: primary },
      ],
    });

    repository = TestBed.inject(FallbackSurveyRepository);
    fallback = TestBed.inject(InMemorySurveyRepository);
    dataStatus = TestBed.inject(SurveyDataStatus);
  });

  it('uses a successful Supabase response even when it is empty', async () => {
    primary.listSurveys.mockResolvedValue([]);

    await expect(repository.listSurveys()).resolves.toEqual([]);
    expect(dataStatus.source()).toBe('supabase');
    expect(dataStatus.warning()).toBeNull();
  });

  it('uses fixtures and exposes a warning when Supabase is unavailable', async () => {
    primary.listSurveys.mockRejectedValue(new Error('offline'));

    const surveys = await repository.listSurveys();

    expect(surveys).toHaveLength(9);
    expect(dataStatus.source()).toBe('fixtures');
    expect(dataStatus.warning()).toContain('Showing sample surveys');
  });

  it('delegates survey creation to Supabase without using the fixture repository', async () => {
    const input = {
      category: 'Workplace culture',
      title: 'Supabase write',
      description: '',
      endDate: null,
      questions: [
        {
          prompt: 'Choose one',
          allowMultiple: false,
          answers: ['A', 'B'],
        },
      ],
    };
    const createdSurvey: Survey = {
      id: 'created-survey',
      category: input.category,
      title: input.title,
      description: '',
      endDate: null,
      daysRemaining: null,
      status: 'active',
      questions: [],
    };
    const fallbackCreate = vi.spyOn(fallback, 'createSurvey');

    primary.createSurvey.mockResolvedValue(createdSurvey);

    await expect(repository.createSurvey(input)).resolves.toBe(createdSurvey);
    expect(primary.createSurvey).toHaveBeenCalledWith(input);
    expect(fallbackCreate).not.toHaveBeenCalled();
  });

  it('surfaces Supabase creation failures instead of creating a fixture-only survey', async () => {
    const fallbackCreate = vi.spyOn(fallback, 'createSurvey');
    primary.createSurvey.mockRejectedValue(new Error('offline'));

    await expect(
      repository.createSurvey({
        category: 'Workplace culture',
        title: 'Do not fake success',
        description: '',
        endDate: null,
        questions: [
          {
            prompt: 'Choose one',
            allowMultiple: false,
            answers: ['A', 'B'],
          },
        ],
      }),
    ).rejects.toThrow('offline');

    expect(fallbackCreate).not.toHaveBeenCalled();
  });

  it('delegates vote submission to Supabase without mutating fixtures', async () => {
    const selections = [{ questionId: 'question-1', answerIds: ['answer-1'] }];
    const persistedSurvey: Survey = {
      id: 'survey-1',
      category: 'Team activities',
      title: 'Persisted vote',
      description: '',
      endDate: null,
      daysRemaining: null,
      status: 'active',
      questions: [],
    };
    const fallbackSubmit = vi.spyOn(fallback, 'submitVote');
    primary.submitVote.mockResolvedValue(persistedSurvey);

    await expect(repository.submitVote('survey-1', selections)).resolves.toBe(persistedSurvey);
    expect(primary.submitVote).toHaveBeenCalledWith('survey-1', selections);
    expect(fallbackSubmit).not.toHaveBeenCalled();
  });

  it('surfaces Supabase vote failures without reporting fixture success', async () => {
    const fallbackSubmit = vi.spyOn(fallback, 'submitVote');
    primary.submitVote.mockRejectedValue(new Error('duplicate vote'));

    await expect(repository.submitVote('survey-1', [])).rejects.toThrow('duplicate vote');
    expect(fallbackSubmit).not.toHaveBeenCalled();
  });
});
