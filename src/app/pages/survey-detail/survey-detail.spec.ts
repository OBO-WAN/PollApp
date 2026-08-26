import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { provideInMemorySurveyRepository } from '../../surveys/in-memory-survey.repository';
import { SURVEY_REPOSITORY } from '../../surveys/survey.repository';
import { SurveyStore } from '../../surveys/survey-store';
import { SurveyVoteReceipt } from '../../surveys/survey-vote-receipt';
import { SurveyDetail } from './survey-detail';

@Component({
  selector: 'app-test-home',
  template: '<h1>Survey home</h1>',
})
class TestHome {}

describe('SurveyDetail', () => {
  beforeEach(async () => {
    localStorage.removeItem('pollapp.completed-survey-ids');

    await TestBed.configureTestingModule({
      imports: [SurveyDetail, TestHome],
      providers: [
        provideRouter([
          {
            path: '',
            component: TestHome,
          },
          {
            path: 'surveys/:surveyId',
            component: SurveyDetail,
          },
        ]),
        provideInMemorySurveyRepository(),
      ],
    }).compileComponents();

    await TestBed.inject(SurveyStore).loadSurveys();
  });

  it('renders the selected survey as an accessible voting form', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/surveys/1', SurveyDetail);

    const page = harness.routeNativeElement as HTMLElement;
    const inputs = [...page.querySelectorAll('.answer-option input')] as HTMLInputElement[];

    expect(page.querySelector('h1')?.textContent).toContain(
      'Let’s Plan the Next Team Event Together',
    );
    expect(page.querySelectorAll('.question-item')).toHaveLength(4);
    expect(inputs).toHaveLength(16);
    expect(inputs.filter((input) => input.type === 'checkbox')).toHaveLength(9);
    expect(inputs.filter((input) => input.type === 'radio')).toHaveLength(7);
    expect(inputs.every((input) => !input.disabled)).toBe(true);
    expect(page.querySelectorAll('.answer-list[role="group"]')).toHaveLength(4);
    expect(page.querySelectorAll('.result-item')).toHaveLength(4);
    expect(page.querySelector('.survey-results')?.getAttribute('data-realtime-status')).toBe(
      'disabled',
    );
    expect(page.querySelector('.survey-results')?.textContent).toContain('86%');
    expect((page.querySelector('.complete-survey-button') as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(page.querySelector('.create-survey-link__icon')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(page.querySelector('.create-survey-link__glyph')).not.toBeNull();
    expect(page.querySelector('form')).not.toBeNull();
  });

  it('records the vote, shows feedback, then returns home and stays completed', async () => {
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    const store = TestBed.inject(SurveyStore);
    const voteReceipt = TestBed.inject(SurveyVoteReceipt);

    await harness.navigateByUrl('/surveys/1', SurveyDetail);

    const page = harness.routeNativeElement as HTMLElement;
    const questions = [...page.querySelectorAll('.question-item')];
    const multipleAnswers = questions[0].querySelectorAll('input');
    const singleAnswers = questions[2].querySelectorAll('input');
    const completeButton = page.querySelector('.complete-survey-button') as HTMLButtonElement;

    (multipleAnswers[0] as HTMLInputElement).click();
    (multipleAnswers[2] as HTMLInputElement).click();
    (singleAnswers[0] as HTMLInputElement).click();
    (singleAnswers[1] as HTMLInputElement).click();
    (questions[1].querySelector('input') as HTMLInputElement).click();
    (questions[3].querySelector('input') as HTMLInputElement).click();
    harness.detectChanges();

    expect((multipleAnswers[0] as HTMLInputElement).checked).toBe(true);
    expect((multipleAnswers[2] as HTMLInputElement).checked).toBe(true);
    expect((singleAnswers[0] as HTMLInputElement).checked).toBe(false);
    expect((singleAnswers[1] as HTMLInputElement).checked).toBe(true);
    expect(completeButton.disabled).toBe(false);

    completeButton.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    const updatedSurvey = store.getSurveyById('1');

    expect(updatedSurvey?.questions[0].answers[0].voteCount).toBe(28);
    expect(updatedSurvey?.questions[0].answers[2].voteCount).toBe(4);
    expect(voteReceipt.has('1')).toBe(true);
    expect(page.querySelector('.survey-success-notice')?.textContent).toContain(
      'Your vote was submitted successfully',
    );
    expect(router.url).toBe('/surveys/1');

    await waitForSuccessRedirect();
    harness.detectChanges();

    expect(router.url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Survey home');

    await harness.navigateByUrl('/surveys/1', SurveyDetail);

    const revisitedPage = harness.routeNativeElement as HTMLElement;
    const revisitedInputs = [
      ...revisitedPage.querySelectorAll('.answer-option input'),
    ] as HTMLInputElement[];
    const revisitedButton = revisitedPage.querySelector(
      '.complete-survey-button',
    ) as HTMLButtonElement;

    expect(revisitedPage.querySelector('.survey-completed-notice')?.textContent).toContain(
      'already completed this survey',
    );
    expect(revisitedInputs.every((input) => input.disabled)).toBe(true);
    expect(revisitedButton.textContent).toContain('Survey completed');
    expect(revisitedButton.disabled).toBe(true);
    expect(
      revisitedPage.querySelectorAll('.result-item')[0].querySelectorAll('.result-value')[2]
        .textContent,
    ).toContain('4%');
  });

  it('shows an accessible retryable error when vote persistence fails', async () => {
    const repository = TestBed.inject(SURVEY_REPOSITORY);
    vi.spyOn(repository, 'submitVote').mockRejectedValue(new Error('offline'));
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/surveys/1', SurveyDetail);

    const page = harness.routeNativeElement as HTMLElement;
    const questions = [...page.querySelectorAll('.question-item')];
    const initialResults = [...page.querySelectorAll('.result-value')].map((result) =>
      result.textContent?.trim(),
    );

    for (const question of questions) {
      (question.querySelector('input') as HTMLInputElement).click();
    }
    harness.detectChanges();

    const previewResults = [...page.querySelectorAll('.result-value')].map((result) =>
      result.textContent?.trim(),
    );

    expect(previewResults).not.toEqual(initialResults);

    const completeButton = page.querySelector('.complete-survey-button') as HTMLButtonElement;
    completeButton.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    const error = page.querySelector('#vote-error') as HTMLElement;
    const inputs = [...page.querySelectorAll('.answer-option input')] as HTMLInputElement[];
    const currentResults = [...page.querySelectorAll('.result-value')].map((result) =>
      result.textContent?.trim(),
    );

    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain('Unable to submit your vote.');
    expect(page.querySelector('form')?.getAttribute('aria-describedby')).toContain('vote-error');
    expect(inputs.every((input) => !input.disabled)).toBe(true);
    expect(completeButton.disabled).toBe(false);
    expect(currentResults).toEqual(previewResults);
    expect(TestBed.inject(SurveyVoteReceipt).has('1')).toBe(false);
  });

  it('toggles the responsive results panel accessibly', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/surveys/1', SurveyDetail);

    const page = harness.routeNativeElement as HTMLElement;
    const toggle = page.querySelector('.results-toggle') as HTMLButtonElement;
    const panel = page.querySelector('#survey-results-panel') as HTMLElement;

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.classList.contains('results-panel--expanded')).toBe(true);

    toggle.click();
    harness.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.classList.contains('results-panel--expanded')).toBe(false);
  });

  const additionalSurveyCases = [
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

  for (const surveyCase of additionalSurveyCases) {
    it(`renders unique voting content for survey ${surveyCase.id}`, async () => {
      const harness = await RouterTestingHarness.create();

      await harness.navigateByUrl(`/surveys/${surveyCase.id}`, SurveyDetail);

      const page = harness.routeNativeElement as HTMLElement;
      expect(page.querySelector('h1')?.textContent).toContain(surveyCase.title);
      expect(page.querySelectorAll('.question-item')).toHaveLength(4);
      expect(page.querySelectorAll('.answer-option')).toHaveLength(surveyCase.answerCount);
      expect(page.querySelector('.question-item h2')?.textContent).toContain(
        surveyCase.firstQuestion,
      );
      expect(page.querySelectorAll('.result-item')).toHaveLength(4);
    });
  }

  it('shows a completed survey and its final results as read-only', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/surveys/7', SurveyDetail);

    const page = harness.routeNativeElement as HTMLElement;
    const inputs = [...page.querySelectorAll('.answer-option input')] as HTMLInputElement[];
    const completeButton = page.querySelector('.complete-survey-button') as HTMLButtonElement;

    expect(page.querySelector('h1')?.textContent).toContain('How do you feel about remote work?');
    expect(page.querySelector('.published-badge')?.textContent).toContain('Past survey');
    expect(page.querySelector('.survey-heading__meta')?.textContent).toContain('Ended on');
    expect(page.querySelectorAll('.question-item')).toHaveLength(2);
    expect(page.querySelectorAll('.result-item')).toHaveLength(2);
    expect(inputs).toHaveLength(7);
    expect(inputs.every((input) => input.disabled)).toBe(true);
    expect(completeButton.textContent).toContain('Survey closed');
    expect(completeButton.disabled).toBe(true);
    expect(page.querySelector('.survey-closed-notice')?.textContent).toContain(
      'Final results are shown below',
    );
    expect(page.querySelector('#survey-results-title')?.textContent).not.toContain('LIVE');
  });

  it('shows a useful not-found state for an unknown survey id', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/surveys/unknown', SurveyDetail);

    const page = harness.routeNativeElement as HTMLElement;
    expect(page.querySelector('#not-found-title')?.textContent).toContain(
      'This survey is no longer available',
    );
    expect(page.querySelector('.not-found a')?.getAttribute('href')).toBe('/');
  });
});

function waitForSuccessRedirect(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1600));
}
