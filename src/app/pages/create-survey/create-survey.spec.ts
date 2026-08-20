import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideInMemorySurveyRepository } from '../../surveys/in-memory-survey.repository';
import { SURVEY_REPOSITORY, SurveyRepository } from '../../surveys/survey.repository';
import { SurveyStore } from '../../surveys/survey-store';
import { CreateSurvey } from './create-survey';

describe('CreateSurvey', () => {
  let fixture: ComponentFixture<CreateSurvey>;
  let repository: SurveyRepository;
  let store: SurveyStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSurvey],
      providers: [provideRouter([]), provideInMemorySurveyRepository()],
    }).compileComponents();

    repository = TestBed.inject(SURVEY_REPOSITORY);
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

  it('publishes a valid survey into the shared store', async () => {
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
    expect(store.surveys().at(-1)?.title).toBe('Team lunch');
    expect(fixture.nativeElement.querySelector('.published-notice')?.textContent).toContain(
      'Your survey is now published',
    );
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

  function setField(selector: string, value: string, eventType = 'input'): void {
    const field = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event(eventType, { bubbles: true }));
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
});
