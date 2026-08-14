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
    expect(page.querySelectorAll('.question-card')).toHaveLength(3);
    expect(page.querySelectorAll('.answer-option')).toHaveLength(10);
    expect(page.querySelector('form')).toBeNull();
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
