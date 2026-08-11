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
});
