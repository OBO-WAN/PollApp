import { Component, computed, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { Survey, SurveyStatus } from '../../surveys/survey.model';
import { SurveyStore } from '../../surveys/survey-store';

@Component({
  selector: 'app-home',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './home.html',
  styleUrls: [
    './home.css',
    './styles/surveys.css',
    './styles/dropdown.css',
    './styles/data-state.css',
    './styles/motion.css',
    './styles/button.css',
    './styles/responsive.css',
  ],
})
export class Home {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly surveyStore = inject(SurveyStore);
  private readonly surveys = this.surveyStore.surveys;

  protected readonly isLoading = this.surveyStore.isLoading;
  protected readonly loadError = this.surveyStore.error;
  protected readonly dataSource = this.surveyStore.dataSource;
  protected readonly dataWarning = this.surveyStore.dataWarning;

  protected readonly endingSoonSurveys = computed(() =>
    [...this.surveys()]
      .filter((survey) => survey.status === 'active' && survey.endDate !== null)
      .sort(compareSurveyDeadlines)
      .slice(0, 3),
  );

  protected readonly categories = computed<readonly string[]>(() => [
    'All',
    ...new Set(this.surveys().map((survey) => survey.category)),
  ]);

  protected readonly selectedStatus = signal<SurveyStatus>('active');
  protected readonly selectedCategory = signal('All');
  protected readonly isCategoryMenuOpen = signal(false);
  protected readonly isCreationModalOpen = signal(false);

  protected readonly visibleSurveys = computed(() => {
    const status = this.selectedStatus();
    const category = this.selectedCategory();

    return this.surveys()
      .filter((survey) => {
        const matchesStatus = survey.status === status;
        const matchesCategory = category === 'All' || survey.category === category;

        return matchesStatus && matchesCategory;
      })
      .sort(compareSurveyDeadlines);
  });

  protected selectStatus(status: SurveyStatus): void {
    this.selectedStatus.set(status);
    this.selectedCategory.set('All');
    this.isCategoryMenuOpen.set(false);
  }

  protected toggleCategoryMenu(): void {
    if (this.isCategoryMenuOpen()) {
      this.isCategoryMenuOpen.set(false);
      return;
    }

    this.openCategoryMenu(this.selectedCategoryIndex());
  }

  protected selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.isCategoryMenuOpen.set(false);
    this.focusCategoryTrigger();
  }

  protected categoryOptionLabel(category: string): string {
    return category === 'All' ? 'All Surveys' : category;
  }

  protected onCategoryTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const focusIndex = event.key === 'ArrowUp' ? this.categories().length - 1 : 0;
      this.openCategoryMenu(focusIndex);
    }

    if (event.key === 'Escape') {
      this.isCategoryMenuOpen.set(false);
    }
  }

  protected onCategoryOptionKeydown(event: KeyboardEvent, optionIndex: number): void {
    const lastIndex = this.categories().length - 1;
    const nextIndexByKey: Readonly<Record<string, number>> = {
      ArrowDown: optionIndex === lastIndex ? 0 : optionIndex + 1,
      ArrowUp: optionIndex === 0 ? lastIndex : optionIndex - 1,
      Home: 0,
      End: lastIndex,
    };
    const nextIndex = nextIndexByKey[event.key];

    if (nextIndex !== undefined) {
      event.preventDefault();
      this.focusCategoryOption(nextIndex);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.isCategoryMenuOpen.set(false);
      this.focusCategoryTrigger();
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectCategory(this.categories()[optionIndex]);
    }

    if (event.key === 'Tab') {
      this.isCategoryMenuOpen.set(false);
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected closeCategoryMenuOnOutsideClick(event: PointerEvent): void {
    const categoryFilter = this.hostElement.nativeElement.querySelector('.category-filter');

    if (!categoryFilter?.contains(event.target as Node)) {
      this.isCategoryMenuOpen.set(false);
    }
  }

  protected startSurveyCreation(): void {
    void this.router.navigateByUrl('/surveys/new');
  }

  protected setCreationModalOpen(isOpen: boolean): void {
    this.isCreationModalOpen.set(isOpen);
  }

  protected deadlineLabel(survey: Survey): string {
    if (survey.daysRemaining === null) {
      return 'No deadline';
    }

    const days = Math.abs(survey.daysRemaining);
    const unit = days === 1 ? 'Day' : 'Days';

    return survey.status === 'active' ? `Ends in ${days} ${unit}` : `Ended ${days} ${unit} ago`;
  }

  private openCategoryMenu(focusIndex: number): void {
    this.isCategoryMenuOpen.set(true);
    this.focusCategoryOption(focusIndex);
  }

  private selectedCategoryIndex(): number {
    return Math.max(0, this.categories().indexOf(this.selectedCategory()));
  }

  private focusCategoryOption(optionIndex: number): void {
    setTimeout(() => {
      const options = this.hostElement.nativeElement.querySelectorAll<HTMLElement>(
        '.category-filter__option',
      );
      options[optionIndex]?.focus();
    });
  }

  private focusCategoryTrigger(): void {
    setTimeout(() => {
      this.hostElement.nativeElement
        .querySelector<HTMLButtonElement>('.category-filter__trigger')
        ?.focus();
    });
  }
}

function compareSurveyDeadlines(first: Survey, second: Survey): number {
  if (first.endDate === null) {
    return second.endDate === null ? 0 : 1;
  }

  if (second.endDate === null) {
    return -1;
  }

  return first.endDate.localeCompare(second.endDate);
}
