import { computed, inject, Injectable, signal } from '@angular/core';

import { CreateSurveyInput, Survey, SurveyVoteSelection } from './survey.model';
import { SURVEY_REPOSITORY } from './survey.repository';

@Injectable({ providedIn: 'root' })
export class SurveyStore {
  private readonly repository = inject(SURVEY_REPOSITORY);
  private readonly surveysState = signal<readonly Survey[]>([]);
  private readonly pendingRequests = signal(0);
  private readonly errorState = signal<string | null>(null);

  readonly surveys = this.surveysState.asReadonly();
  readonly isLoading = computed(() => this.pendingRequests() > 0);
  readonly error = this.errorState.asReadonly();

  async loadSurveys(): Promise<void> {
    const surveys = await this.execute('Unable to load surveys.', () =>
      this.repository.listSurveys(),
    );

    this.surveysState.set(surveys);
  }

  async loadSurvey(id: string | null): Promise<Survey | undefined> {
    if (!id) {
      return undefined;
    }

    const cachedSurvey = this.getSurveyById(id);

    if (cachedSurvey) {
      return cachedSurvey;
    }

    const survey = await this.execute('Unable to load this survey.', () =>
      this.repository.getSurveyById(id),
    );

    if (survey) {
      this.upsertSurvey(survey);
    }

    return survey;
  }

  getSurveyById(id: string | null): Survey | undefined {
    return id ? this.surveysState().find((survey) => survey.id === id) : undefined;
  }

  async createSurvey(input: CreateSurveyInput): Promise<Survey> {
    const survey = await this.execute('Unable to create the survey.', () =>
      this.repository.createSurvey(input),
    );

    this.upsertSurvey(survey);

    return survey;
  }

  async submitVote(surveyId: string, selections: readonly SurveyVoteSelection[]): Promise<boolean> {
    const survey = await this.execute('Unable to submit your vote.', () =>
      this.repository.submitVote(surveyId, selections),
    );

    if (!survey) {
      return false;
    }

    this.upsertSurvey(survey);

    return true;
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private upsertSurvey(survey: Survey): void {
    this.surveysState.update((surveys) => {
      const surveyExists = surveys.some((currentSurvey) => currentSurvey.id === survey.id);

      return surveyExists
        ? surveys.map((currentSurvey) => (currentSurvey.id === survey.id ? survey : currentSurvey))
        : [...surveys, survey];
    });
  }

  private async execute<T>(message: string, operation: () => Promise<T>): Promise<T> {
    this.pendingRequests.update((pendingRequests) => pendingRequests + 1);
    this.errorState.set(null);

    try {
      return await operation();
    } catch (error) {
      this.errorState.set(message);
      throw error;
    } finally {
      this.pendingRequests.update((pendingRequests) => pendingRequests - 1);
    }
  }
}
