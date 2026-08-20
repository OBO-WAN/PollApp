import { TestBed } from '@angular/core/testing';

import { FallbackSurveyRepository } from './fallback-survey.repository';
import { InMemorySurveyRepository } from './in-memory-survey.repository';
import { Survey } from './survey.model';
import { SurveyDataStatus } from './survey-data-status';
import { SupabaseSurveyRepository } from './supabase-survey.repository';

describe('FallbackSurveyRepository', () => {
  let repository: FallbackSurveyRepository;
  let dataStatus: SurveyDataStatus;
  let primary: {
    listSurveys: ReturnType<typeof vi.fn>;
    getSurveyById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    primary = {
      listSurveys: vi.fn(),
      getSurveyById: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FallbackSurveyRepository,
        InMemorySurveyRepository,
        { provide: SupabaseSurveyRepository, useValue: primary },
      ],
    });

    repository = TestBed.inject(FallbackSurveyRepository);
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

  it('keeps writes in memory during the read-only integration', async () => {
    const survey = await repository.createSurvey({
      category: 'Workplace culture',
      title: 'Local write',
      description: '',
      endDate: null,
      questions: [
        {
          prompt: 'Choose one',
          allowMultiple: false,
          answers: ['A', 'B'],
        },
      ],
    });

    expect(survey).toMatchObject<Partial<Survey>>({
      title: 'Local write',
      status: 'active',
    });
  });
});
