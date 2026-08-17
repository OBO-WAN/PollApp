import { TestBed } from '@angular/core/testing';

import { SurveyStore } from './survey-store';

describe('SurveyStore', () => {
  let store: SurveyStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(SurveyStore);
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

    expect(survey?.title).toBe('Let’s Plan the Next Team Event Together');
    expect(survey?.endDate).toBe('2025-09-01');
    expect(survey?.questions).toHaveLength(4);
    expect(survey?.questions[0].answers[1].voteCount).toBe(44);
    expect(store.getSurveyById('missing')).toBeUndefined();
    expect(store.getSurveyById(null)).toBeUndefined();
  });

  it('records a valid vote in memory without mutating unrelated answers', () => {
    const survey = store.getSurveyById('1');
    const selections =
      survey?.questions.map((question) => ({
        questionId: question.id,
        answerIds: [question.answers[0].id],
      })) ?? [];

    expect(store.submitVote('1', selections)).toBe(true);

    const updatedSurvey = store.getSurveyById('1');
    expect(updatedSurvey?.questions[0].answers[0].voteCount).toBe(28);
    expect(updatedSurvey?.questions[0].answers[1].voteCount).toBe(44);
    expect(store.getSurveyById('2')?.questions[0].answers[0].voteCount).toBe(32);
  });

  it('rejects incomplete or invalid vote selections', () => {
    const survey = store.getSurveyById('1');
    const initialVoteCount = survey?.questions[0].answers[0].voteCount;

    expect(store.submitVote('1', [])).toBe(false);
    expect(
      store.submitVote(
        '1',
        survey?.questions.map((question) => ({
          questionId: question.id,
          answerIds: ['unknown-answer'],
        })) ?? [],
      ),
    ).toBe(false);
    expect(store.getSurveyById('1')?.questions[0].answers[0].voteCount).toBe(initialVoteCount);
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
});
