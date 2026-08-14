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
  });

  it('finds a survey by its route id', () => {
    const survey = store.getSurveyById('1');

    expect(survey?.title).toBe('Let’s Plan the Next Team Event Together');
    expect(survey?.questions).toHaveLength(3);
    expect(store.getSurveyById('missing')).toBeUndefined();
    expect(store.getSurveyById(null)).toBeUndefined();
  });
});
