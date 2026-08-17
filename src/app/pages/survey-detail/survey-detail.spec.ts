import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { SurveyStore } from '../../surveys/survey-store';
import { SurveyDetail } from './survey-detail';

describe('SurveyDetail', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyDetail],
      providers: [
        provideRouter([
          {
            path: 'surveys/:surveyId',
            component: SurveyDetail,
          },
        ]),
      ],
    }).compileComponents();
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
    expect(page.querySelector('.survey-results')?.textContent).toContain('86%');
    expect((page.querySelector('.complete-survey-button') as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(page.querySelector('form')).not.toBeNull();
  });

  it('supports multiple and single selections, records the vote, and updates results', async () => {
    const harness = await RouterTestingHarness.create();
    const store = TestBed.inject(SurveyStore);

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
    harness.detectChanges();

    const updatedSurvey = store.getSurveyById('1');
    const firstResultValues = page
      .querySelectorAll('.result-item')[0]
      .querySelectorAll('.result-value');

    expect(updatedSurvey?.questions[0].answers[0].voteCount).toBe(28);
    expect(updatedSurvey?.questions[0].answers[2].voteCount).toBe(4);
    expect(firstResultValues[2].textContent?.trim()).toBe('4%');
    expect(page.querySelector('#vote-status')?.textContent).toContain(
      'Your vote has been recorded',
    );
    expect(page.querySelectorAll('.answer-option input:disabled')).toHaveLength(16);
    expect(completeButton.disabled).toBe(true);
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
