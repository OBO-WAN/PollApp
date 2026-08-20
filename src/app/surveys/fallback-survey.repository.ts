import { inject, Injectable } from '@angular/core';

import { InMemorySurveyRepository } from './in-memory-survey.repository';
import { CreateSurveyInput, Survey, SurveyVoteSelection } from './survey.model';
import { SurveyDataStatus } from './survey-data-status';
import { SurveyRepository } from './survey.repository';
import { SupabaseSurveyRepository } from './supabase-survey.repository';

@Injectable()
export class FallbackSurveyRepository implements SurveyRepository {
  private readonly primary = inject(SupabaseSurveyRepository);
  private readonly fallback = inject(InMemorySurveyRepository);
  private readonly dataStatus = inject(SurveyDataStatus);

  async listSurveys(): Promise<readonly Survey[]> {
    this.dataStatus.markLoading();

    try {
      const surveys = await this.primary.listSurveys();
      this.dataStatus.markSupabase();
      return surveys;
    } catch {
      this.dataStatus.markFallback();
      return this.fallback.listSurveys();
    }
  }

  async getSurveyById(id: string): Promise<Survey | undefined> {
    this.dataStatus.markLoading();

    try {
      const survey = await this.primary.getSurveyById(id);
      this.dataStatus.markSupabase();
      return survey;
    } catch {
      this.dataStatus.markFallback();
      return this.fallback.getSurveyById(id);
    }
  }

  createSurvey(input: CreateSurveyInput): Promise<Survey> {
    return this.primary.createSurvey(input);
  }

  submitVote(
    surveyId: string,
    selections: readonly SurveyVoteSelection[],
  ): Promise<Survey | undefined> {
    return this.fallback.submitVote(surveyId, selections);
  }
}
