export type SurveyStatus = 'active' | 'past';

export interface SurveyAnswer {
  readonly id: string;
  readonly text: string;
}

export interface SurveyQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly allowMultiple: boolean;
  readonly answers: readonly SurveyAnswer[];
}

export interface Survey {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly endDate: string | null;
  readonly daysRemaining: number | null;
  readonly status: SurveyStatus;
  readonly featured: boolean;
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

export const SURVEY_CATEGORIES = [
  'Team activities',
  'Gaming',
  'Healthy Lifestyle',
  'Workplace culture',
] as const;
