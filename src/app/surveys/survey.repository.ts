import { InjectionToken } from '@angular/core';

import { CreateSurveyInput, Survey, SurveyVoteSelection } from './survey.model';

export interface SurveyReader {
  listSurveys(): Promise<readonly Survey[]>;
  getSurveyById(id: string): Promise<Survey | undefined>;
}

export interface SurveyRepository extends SurveyReader {
  createSurvey(input: CreateSurveyInput): Promise<Survey>;
  submitVote(
    surveyId: string,
    selections: readonly SurveyVoteSelection[],
  ): Promise<Survey | undefined>;
}

export const SURVEY_REPOSITORY = new InjectionToken<SurveyRepository>('SURVEY_REPOSITORY');
