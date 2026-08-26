export type SurveyStatus = 'active' | 'past';

export interface SurveyAnswer {
  readonly id: string;
  readonly text: string;
  readonly voteCount: number;
}

export interface SurveyQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly allowMultiple: boolean;
  readonly answers: readonly SurveyAnswer[];
}

export interface SurveyVoteSelection {
  readonly questionId: string;
  readonly answerIds: readonly string[];
}

export interface Survey {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly endDate: string | null;
  readonly daysRemaining: number | null;
  readonly status: SurveyStatus;
  readonly questions: readonly SurveyQuestion[];
}

export interface CreateSurveyQuestionInput {
  readonly prompt: string;
  readonly allowMultiple: boolean;
  readonly answers: readonly string[];
}

export interface CreateSurveyInput {
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly endDate: string | null;
  readonly questions: readonly CreateSurveyQuestionInput[];
}

export const MAX_SURVEY_ANSWERS = 6;
export const MAX_SURVEY_ANSWER_LENGTH = 240;
export const MAX_SURVEY_DESCRIPTION_LENGTH = 2000;
export const MAX_SURVEY_QUESTIONS = 20;
export const MAX_SURVEY_QUESTION_LENGTH = 240;
export const MAX_SURVEY_TITLE_LENGTH = 160;

export const SURVEY_CATEGORIES = [
  'Team activities',
  'Gaming & Entertainment',
  'Health & Wellness',
  'Workplace culture',
] as const;
