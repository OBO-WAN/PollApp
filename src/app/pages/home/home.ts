import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Survey, SurveyStatus } from '../../surveys/survey.model';
import { SurveyStore } from '../../surveys/survey-store';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css', './styles/surveys.css', './styles/motion.css', './styles/button.css'],
})
export class Home {
  private readonly router = inject(Router);
  private readonly surveyStore = inject(SurveyStore);
  private readonly surveys = this.surveyStore.surveys;

  protected readonly endingSoonSurveys = computed(() =>
    [...this.surveys()]
      .filter(
        (survey) => survey.status === 'active' && survey.featured && survey.daysRemaining !== null,
      )
      .sort(
        (first, second) =>
          (first.daysRemaining ?? Number.POSITIVE_INFINITY) -
          (second.daysRemaining ?? Number.POSITIVE_INFINITY),
      ),
  );

  protected readonly categories = computed<readonly string[]>(() => [
    'All',
    ...new Set(this.surveys().map((survey) => survey.category)),
  ]);

  protected readonly selectedStatus = signal<SurveyStatus>('active');
  protected readonly selectedCategory = signal('All');

  protected readonly visibleSurveys = computed(() => {
    const status = this.selectedStatus();
    const category = this.selectedCategory();

    return this.surveys().filter((survey) => {
      const matchesStatus = survey.status === status;
      const matchesCategory = category === 'All' || survey.category === category;

      return matchesStatus && matchesCategory;
    });
  });

  protected selectStatus(status: SurveyStatus): void {
    this.selectedStatus.set(status);
    this.selectedCategory.set('All');
  }

  protected selectCategory(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCategory.set(selectElement.value);
  }

  protected startSurveyCreation(): void {
    void this.router.navigateByUrl('/surveys/new');
  }

  protected deadlineLabel(survey: Survey): string {
    if (survey.daysRemaining === null) {
      return 'No deadline';
    }

    const days = Math.abs(survey.daysRemaining);
    const unit = days === 1 ? 'Day' : 'Days';

    return survey.status === 'active' ? `Ends in ${days} ${unit}` : `Ended ${days} ${unit} ago`;
  }
}
