import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('exposes the SVG control as a named button and starts survey creation', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const button = fixture.nativeElement.querySelector('.primary-button') as HTMLButtonElement;
    const images = button.querySelectorAll('img');

    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('New survey');
    expect(images).toHaveLength(2);
    expect([...images].every((image) => image.alt === '')).toBe(true);
    expect([...images].map((image) => image.getAttribute('src'))).toEqual([
      'assets/images/new-survey-default.svg',
      'assets/images/new-survey-hover.svg',
    ]);

    button.click();

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/surveys/new');
  });

  it('shows the three earliest active surveys in deadline order', () => {
    const highlightLinks = [
      ...fixture.nativeElement.querySelectorAll('.highlight-card'),
    ] as HTMLAnchorElement[];
    const surveyLink = fixture.nativeElement.querySelector(
      '.survey-list-card',
    ) as HTMLAnchorElement;

    expect(highlightLinks).toHaveLength(3);
    expect(highlightLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/surveys/1',
      '/surveys/4',
      '/surveys/2',
    ]);
    expect(highlightLinks.map((link) => link.querySelector('h4')?.textContent?.trim())).toEqual([
      'Let’s Plan the Next Team Event Together',
      'Healthier future: Fit & wellness survey!',
      'Gaming habits and favorite games!',
    ]);
    expect(surveyLink.getAttribute('href')).toBe('/surveys/1');
  });
});
