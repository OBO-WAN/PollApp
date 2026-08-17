import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

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

  it('renders the selected survey and its answer choices as read-only content', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/surveys/1', SurveyDetail);

    const page = harness.routeNativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain(
      'Let’s Plan the Next Team Event Together',
    );
    expect(page.querySelectorAll('.question-item')).toHaveLength(4);
    expect(page.querySelectorAll('.answer-option')).toHaveLength(16);
    expect(page.querySelectorAll('.answer-option input:disabled')).toHaveLength(16);
    expect(page.querySelectorAll('.result-item')).toHaveLength(4);
    expect(page.querySelector('.survey-results')?.textContent).toContain('86%');
    expect((page.querySelector('.complete-survey-button') as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(page.querySelector('form')).toBeNull();
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
    it(`renders unique read-only content for survey ${surveyCase.id}`, async () => {
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
