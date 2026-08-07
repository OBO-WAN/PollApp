import { Component, computed, signal } from '@angular/core';

type SurveyStatus = 'active' | 'past';

interface SurveySummary {
  readonly id: number;
  readonly category: string;
  readonly title: string;
  readonly daysRemaining: number;
  readonly status: SurveyStatus;
  readonly featured: boolean;
}

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly surveys: readonly SurveySummary[] = [
    {
      id: 1,
      category: 'Team activities',
      title: 'Let’s Plan the Next Team Event Together',
      daysRemaining: 1,
      status: 'active',
      featured: true,
    },
    {
      id: 2,
      category: 'Gaming',
      title: 'Gaming habits and favorite games!',
      daysRemaining: 3,
      status: 'active',
      featured: true,
    },
    {
      id: 3,
      category: 'Gaming',
      title: 'Gaming habits and favorite games!',
      daysRemaining: 3,
      status: 'active',
      featured: false,
    },
    {
      id: 4,
      category: 'Healthy Lifestyle',
      title: 'Healthier future: Fit & wellness survey!',
      daysRemaining: 2,
      status: 'active',
      featured: true,
    },
    {
      id: 5,
      category: 'Healthy Lifestyle',
      title: 'Healthier future: Fit & wellness survey!',
      daysRemaining: 2,
      status: 'active',
      featured: false,
    },
    {
      id: 6,
      category: 'Team activities',
      title: 'Let’s Plan the Next Team Event Together',
      daysRemaining: 1,
      status: 'active',
      featured: false,
    },
    {
      id: 7,
      category: 'Workplace culture',
      title: 'How do you feel about remote work?',
      daysRemaining: -4,
      status: 'past',
      featured: false,
    },
    {
      id: 8,
      category: 'Team activities',
      title: 'Summer team event retrospective',
      daysRemaining: -7,
      status: 'past',
      featured: false,
    },
    {
      id: 9,
      category: 'Healthy Lifestyle',
      title: 'Weekly wellness check-in',
      daysRemaining: -12,
      status: 'past',
      featured: false,
    },
  ];

  protected readonly endingSoonSurveys = [...this.surveys]
    .filter((survey) => survey.status === 'active' && survey.featured)
    .sort((first, second) => first.daysRemaining - second.daysRemaining);

  protected readonly categories: readonly string[] = [
    'All',
    ...new Set(this.surveys.map((survey) => survey.category)),
  ];

  protected readonly selectedStatus = signal<SurveyStatus>('active');
  protected readonly selectedCategory = signal('All');

  protected readonly visibleSurveys = computed(() => {
    const status = this.selectedStatus();
    const category = this.selectedCategory();

    return this.surveys.filter((survey) => {
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

  protected deadlineLabel(survey: SurveySummary): string {
    const days = Math.abs(survey.daysRemaining);
    const unit = days === 1 ? 'Day' : 'Days';

    return survey.status === 'active'
      ? `Ends in ${days} ${unit}`
      : `Ended ${days} ${unit} ago`;
  }
}