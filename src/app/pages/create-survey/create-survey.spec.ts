import { provideRouter, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideInMemorySurveyRepository } from '../../surveys/in-memory-survey.repository';
import { SURVEY_REPOSITORY, SurveyRepository } from '../../surveys/survey.repository';
import { SurveyStore } from '../../surveys/survey-store';
import {
  MAX_SURVEY_ANSWER_LENGTH,
  MAX_SURVEY_DESCRIPTION_LENGTH,
  MAX_SURVEY_QUESTION_LENGTH,
  MAX_SURVEY_QUESTIONS,
  MAX_SURVEY_TITLE_LENGTH,
} from '../../surveys/survey.model';
import { CreateSurvey } from './create-survey';

describe('CreateSurvey', () => {
  let fixture: ComponentFixture<CreateSurvey>;
  let repository: SurveyRepository;
  let router: Router;
  let store: SurveyStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSurvey],
      providers: [provideRouter([]), provideInMemorySurveyRepository()],
    }).compileComponents();

    repository = TestBed.inject(SURVEY_REPOSITORY);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    store = TestBed.inject(SurveyStore);
    await store.loadSurveys();
    fixture = TestBed.createComponent(CreateSurvey);
    fixture.detectChanges();
  });

  it('shows validation errors instead of publishing an incomplete survey', async () => {
    const initialCount = store.surveys().length;

    submitForm();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.surveys()).toHaveLength(initialCount);
    expect(fixture.nativeElement.querySelectorAll('[aria-invalid="true"]').length).toBeGreaterThan(
      0,
    );
    expect(fixture.nativeElement.querySelector('.published-notice')).toBeNull();
  });

  it('shows publishing feedback before opening the new survey', async () => {
    const initialCount = store.surveys().length;

    setField('#survey-title', 'Team lunch');
    setField('#question-0', 'Where should we eat?');
    setField('#answer-0-0', 'Cafe');
    setField('#answer-0-1', 'Park');
    setField('#survey-category', 'Team activities', 'change');

    submitForm();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.surveys()).toHaveLength(initialCount + 1);
    const createdSurvey = store.surveys().at(-1);
    expect(createdSurvey?.title).toBe('Team lunch');
    expect(fixture.nativeElement.querySelector('.published-notice')?.textContent).toContain(
      'Your survey is now published',
    );
    expect(router.navigate).not.toHaveBeenCalled();

    await waitForSuccessRedirect();

    expect(router.navigate).toHaveBeenCalledWith(['/surveys', createdSurvey?.id]);
  });

  it('shows an accessible error when publishing fails', async () => {
    vi.spyOn(repository, 'createSurvey').mockRejectedValueOnce(new Error('offline'));

    setField('#survey-title', 'Team lunch');
    setField('#question-0', 'Where should we eat?');
    setField('#answer-0-0', 'Cafe');
    setField('#answer-0-1', 'Park');
    setField('#survey-category', 'Team activities', 'change');

    submitForm();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to create the survey.',
    );
    expect(fixture.nativeElement.querySelector('.published-notice')).toBeNull();
  });

  it('rejects an end date in the past', async () => {
    const initialCount = store.surveys().length;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    setField('#survey-title', 'Team lunch');
    setField('#survey-end-date', formatDate(yesterday));
    setField('#question-0', 'Where should we eat?');
    setField('#answer-0-0', 'Cafe');
    setField('#answer-0-1', 'Park');
    setField('#survey-category', 'Team activities', 'change');

    submitForm();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.surveys()).toHaveLength(initialCount);
    expect(fixture.nativeElement.querySelector('#survey-end-date-error')?.textContent).toContain(
      'Choose today or a later date',
    );
  });

  it('adds answers and questions while preserving their minimum counts', () => {
    expect(fixture.nativeElement.querySelectorAll('.answer-row')).toHaveLength(2);
    expect(
      (fixture.nativeElement.querySelector('.answer-row .icon-button') as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    (fixture.nativeElement.querySelector('.text-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.answer-row')).toHaveLength(3);

    (fixture.nativeElement.querySelector('.secondary-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.question-card')).toHaveLength(2);

    (fixture.nativeElement.querySelectorAll('.question-delete')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.question-card')).toHaveLength(1);
  });

  it('limits every question to six answers', () => {
    const addAnswer = fixture.nativeElement.querySelector('.text-action') as HTMLButtonElement;

    for (let answerCount = 2; answerCount < 6; answerCount += 1) {
      addAnswer.click();
      fixture.detectChanges();
    }

    expect(fixture.nativeElement.querySelectorAll('.answer-row')).toHaveLength(6);
    expect(addAnswer.disabled).toBe(true);

    addAnswer.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.answer-row')).toHaveLength(6);
  });

  it('exposes the database-backed character limits on every text field', () => {
    expect(field('#survey-title').maxLength).toBe(MAX_SURVEY_TITLE_LENGTH);
    expect(field('#survey-description').maxLength).toBe(MAX_SURVEY_DESCRIPTION_LENGTH);
    expect(field('#question-0').maxLength).toBe(MAX_SURVEY_QUESTION_LENGTH);
    expect(field('#answer-0-0').maxLength).toBe(MAX_SURVEY_ANSWER_LENGTH);
  });

  it('shows field-specific length errors without calling the repository', async () => {
    const createSurvey = vi.spyOn(repository, 'createSurvey');
    fillValidSurvey();

    const cases = [
      {
        selector: '#survey-title',
        validValue: 'Team lunch',
        invalidValue: 'T'.repeat(MAX_SURVEY_TITLE_LENGTH + 1),
        errorSelector: '#survey-title-error',
        expectedMessage: `up to ${MAX_SURVEY_TITLE_LENGTH} characters`,
      },
      {
        selector: '#survey-description',
        validValue: '',
        invalidValue: 'D'.repeat(MAX_SURVEY_DESCRIPTION_LENGTH + 1),
        errorSelector: '#survey-description-error',
        expectedMessage: `up to ${MAX_SURVEY_DESCRIPTION_LENGTH} characters`,
      },
      {
        selector: '#question-0',
        validValue: 'Where should we eat?',
        invalidValue: 'Q'.repeat(MAX_SURVEY_QUESTION_LENGTH + 1),
        errorSelector: '#question-error-0',
        expectedMessage: `up to ${MAX_SURVEY_QUESTION_LENGTH} characters`,
      },
      {
        selector: '#answer-0-0',
        validValue: 'Cafe',
        invalidValue: 'A'.repeat(MAX_SURVEY_ANSWER_LENGTH + 1),
        errorSelector: '#answer-error-0-0',
        expectedMessage: `up to ${MAX_SURVEY_ANSWER_LENGTH} characters`,
      },
    ];

    for (const testCase of cases) {
      setField(testCase.selector, testCase.invalidValue);
      submitForm();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector(testCase.errorSelector)?.textContent).toContain(
        testCase.expectedMessage,
      );
      expect(createSurvey).not.toHaveBeenCalled();

      setField(testCase.selector, testCase.validValue);
      fixture.detectChanges();
    }
  });

  it('limits a survey to twenty questions', () => {
    const addQuestion = fixture.nativeElement.querySelector(
      '.secondary-action',
    ) as HTMLButtonElement;

    for (let questionCount = 1; questionCount < MAX_SURVEY_QUESTIONS; questionCount += 1) {
      addQuestion.click();
      fixture.detectChanges();
    }

    expect(fixture.nativeElement.querySelectorAll('.question-card')).toHaveLength(
      MAX_SURVEY_QUESTIONS,
    );
    expect(addQuestion.disabled).toBe(true);

    addQuestion.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.question-card')).toHaveLength(
      MAX_SURVEY_QUESTIONS,
    );
  });

  function setField(selector: string, value: string, eventType = 'input'): void {
    const element = field(selector);
    element.value = value;
    element.dispatchEvent(new Event(eventType, { bubbles: true }));
  }

  function field(selector: string): HTMLInputElement | HTMLTextAreaElement {
    return fixture.nativeElement.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
  }

  function fillValidSurvey(): void {
    setField('#survey-title', 'Team lunch');
    setField('#question-0', 'Where should we eat?');
    setField('#answer-0-0', 'Cafe');
    setField('#answer-0-1', 'Park');
    setField('#survey-category', 'Team activities', 'change');
  }

  function submitForm(): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function waitForSuccessRedirect(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1600));
  }
});
