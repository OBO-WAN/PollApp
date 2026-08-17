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

  it('opens the category listbox and filters surveys by the selected option', () => {
    const page = fixture.nativeElement as HTMLElement;
    const trigger = page.querySelector('.category-filter__trigger') as HTMLButtonElement;

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(page.querySelector('.category-filter__menu')).toBeNull();

    trigger.click();
    fixture.detectChanges();

    const options = [...page.querySelectorAll('.category-filter__option')] as HTMLElement[];
    const teamActivitiesOption = options.find(
      (option) => option.textContent?.trim() === 'Team activities',
    );

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(page.querySelector('.category-filter__menu')?.getAttribute('role')).toBe('listbox');
    expect(options).toHaveLength(5);

    teamActivitiesOption?.click();
    fixture.detectChanges();

    const visibleCategories = [...page.querySelectorAll('.survey-list-card__category')].map(
      (category) => category.textContent?.trim(),
    );

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(page.querySelector('.category-filter__menu')).toBeNull();
    expect(page.querySelector('.category-filter__selection')?.textContent).toContain(
      'Team activities',
    );
    expect(visibleCategories).toEqual(['Team activities', 'Team activities']);
  });

  it('supports keyboard opening and closing for the category listbox', () => {
    const page = fixture.nativeElement as HTMLElement;
    const trigger = page.querySelector('.category-filter__trigger') as HTMLButtonElement;

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    const firstOption = page.querySelector('.category-filter__option') as HTMLElement;
    firstOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(page.querySelector('.category-filter__menu')).toBeNull();
  });
});
