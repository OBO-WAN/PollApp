import { TestBed } from '@angular/core/testing';

import { provideInMemorySurveyRepository } from './in-memory-survey.repository';
import { SurveyStore } from './survey-store';
import { SURVEY_REPOSITORY, SurveyRepository } from './survey.repository';

describe('SurveyStore', () => {
  let store: SurveyStore;
  let repository: SurveyRepository;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideInMemorySurveyRepository()] });
    store = TestBed.inject(SurveyStore);
    repository = TestBed.inject(SURVEY_REPOSITORY);
    await store.loadSurveys();
  });

  it('adds a created survey to the shared in-memory collection', async () => {
    const initialCount = store.surveys().length;

    const created = await store.createSurvey({
      category: 'Team activities',
      title: 'Friday lunch',
      description: '',
      endDate: null,
      questions: [
        {
          prompt: 'Where should we eat?',
          allowMultiple: false,
          answers: ['Cafe', 'Park'],
        },
      ],
    });

    expect(store.surveys()).toHaveLength(initialCount + 1);
    expect(store.surveys().at(-1)).toEqual(created);
    expect(created.daysRemaining).toBeNull();
    expect(created.questions[0].answers).toHaveLength(2);
    expect(created.questions[0].answers.every((answer) => answer.voteCount === 0)).toBe(true);
  });

  it('finds a survey by its route id', () => {
    const survey = store.getSurveyById('1');
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(survey?.title).toBe('Let’s Plan the Next Team Event Together');
    expect(survey?.endDate).toBe(formatDate(tomorrow));
    expect(survey?.daysRemaining).toBe(1);
    expect(survey?.questions).toHaveLength(4);
    expect(survey?.questions[0].answers[1].voteCount).toBe(44);
    expect(store.getSurveyById('missing')).toBeUndefined();
    expect(store.getSurveyById(null)).toBeUndefined();
  });

  it('records a valid vote in memory without mutating unrelated answers', async () => {
    const survey = store.getSurveyById('1');
    const selections =
      survey?.questions.map((question) => ({
        questionId: question.id,
        answerIds: [question.answers[0].id],
      })) ?? [];

    await expect(store.submitVote('1', selections)).resolves.toBe(true);

    const updatedSurvey = store.getSurveyById('1');
    expect(updatedSurvey?.questions[0].answers[0].voteCount).toBe(28);
    expect(updatedSurvey?.questions[0].answers[1].voteCount).toBe(44);
    expect(store.getSurveyById('2')?.questions[0].answers[0].voteCount).toBe(32);
  });

  it('updates one answer result immutably for realtime events', () => {
    const surveysBefore = store.surveys();
    const firstSurveyBefore = store.getSurveyById('1');
    const secondSurveyBefore = store.getSurveyById('2');
    const answerId = firstSurveyBefore?.questions[0].answers[0].id;

    expect(answerId).toBeDefined();

    store.updateAnswerResult(answerId ?? '', 99);

    const surveysAfter = store.surveys();
    const firstSurveyAfter = store.getSurveyById('1');

    expect(surveysAfter).not.toBe(surveysBefore);
    expect(firstSurveyAfter).not.toBe(firstSurveyBefore);
    expect(firstSurveyAfter?.questions[0].answers[0].voteCount).toBe(99);
    expect(firstSurveyAfter?.questions[0].answers[1]).toBe(
      firstSurveyBefore?.questions[0].answers[1],
    );
    expect(store.getSurveyById('2')).toBe(secondSurveyBefore);

    store.updateAnswerResult(answerId ?? '', 99);
    expect(store.surveys()).toBe(surveysAfter);
  });

  it('rejects incomplete or invalid vote selections', async () => {
    const survey = store.getSurveyById('1');
    const initialVoteCount = survey?.questions[0].answers[0].voteCount;

    await expect(store.submitVote('1', [])).resolves.toBe(false);
    await expect(
      store.submitVote(
        '1',
        survey?.questions.map((question) => ({
          questionId: question.id,
          answerIds: ['unknown-answer'],
        })) ?? [],
      ),
    ).resolves.toBe(false);
    expect(store.getSurveyById('1')?.questions[0].answers[0].voteCount).toBe(initialVoteCount);
  });

  it('rejects votes for a past survey without changing its final results', async () => {
    const survey = store.getSurveyById('7');
    const selections =
      survey?.questions.map((question) => ({
        questionId: question.id,
        answerIds: [question.answers[0].id],
      })) ?? [];
    const initialVoteCount = survey?.questions[0].answers[0].voteCount;

    await expect(store.submitVote('7', selections)).resolves.toBe(false);
    expect(store.getSurveyById('7')?.questions[0].answers[0].voteCount).toBe(initialVoteCount);
  });

  const detailedSurveyCases = [
    {
      id: '1',
      title: 'Let’s Plan the Next Team Event Together',
      firstQuestion: 'Which date would work best for you?',
      answerCount: 16,
    },
    {
      id: '2',
      title: 'Gaming habits and favorite games!',
      firstQuestion: 'How often do you play video games?',
      answerCount: 17,
    },
    {
      id: '4',
      title: 'Healthier future: Fit & wellness survey!',
      firstQuestion: 'Which wellness goals are most important to you?',
      answerCount: 16,
    },
  ] as const;

  for (const surveyCase of detailedSurveyCases) {
    it(`provides unique detail content for survey ${surveyCase.id}`, () => {
      const survey = store.getSurveyById(surveyCase.id);

      expect(survey?.title).toBe(surveyCase.title);
      expect(survey?.description).not.toBe('');
      expect(survey?.questions).toHaveLength(4);
      expect(survey?.questions[0].prompt).toBe(surveyCase.firstQuestion);
      expect(
        survey?.questions.reduce((count, question) => count + question.answers.length, 0),
      ).toBe(surveyCase.answerCount);
    });
  }

  it('keeps every ending-soon question unique to its survey', () => {
    const surveys = ['1', '4', '2'].map((id) => store.getSurveyById(id));
    const prompts = surveys.flatMap((survey) =>
      survey ? survey.questions.map((question) => question.prompt) : [],
    );

    expect(surveys.every((survey) => survey !== undefined)).toBe(true);
    expect(prompts).toHaveLength(12);
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it('provides final results for every past survey', () => {
    const pastSurveys = ['7', '8', '9'].map((id) => store.getSurveyById(id));

    expect(pastSurveys.every((survey) => survey?.status === 'past')).toBe(true);
    expect(pastSurveys.every((survey) => survey?.description !== '')).toBe(true);
    expect(pastSurveys.every((survey) => survey?.questions.length === 2)).toBe(true);
  });

  it('exposes repository loading and error state', async () => {
    const currentSurveys = store.surveys();
    let finishLoading: ((surveys: readonly (typeof currentSurveys)[number][]) => void) | undefined;
    const pendingSurveys = new Promise<readonly (typeof currentSurveys)[number][]>((resolve) => {
      finishLoading = resolve;
    });

    vi.spyOn(repository, 'listSurveys').mockReturnValueOnce(pendingSurveys);

    const loading = store.loadSurveys();

    expect(store.isLoading()).toBe(true);
    expect(store.error()).toBeNull();

    finishLoading?.(currentSurveys);
    await loading;

    expect(store.isLoading()).toBe(false);

    vi.spyOn(repository, 'listSurveys').mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(store.loadSurveys()).rejects.toThrow('Network unavailable');
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBe('Unable to load surveys.');

    store.clearError();
    expect(store.error()).toBeNull();
  });
});

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
