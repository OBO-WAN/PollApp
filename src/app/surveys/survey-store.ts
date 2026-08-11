import { Injectable, signal } from '@angular/core';

import { CreateSurveyInput, Survey } from './survey.model';

const INITIAL_SURVEYS: readonly Survey[] = [
  createInitialSurvey('1', 'Team activities', 'Let’s Plan the Next Team Event Together', 1, true),
  createInitialSurvey('2', 'Gaming', 'Gaming habits and favorite games!', 3, true),
  createInitialSurvey('3', 'Gaming', 'Gaming habits and favorite games!', 3),
  createInitialSurvey(
    '4',
    'Healthy Lifestyle',
    'Healthier future: Fit & wellness survey!',
    2,
    true,
  ),
  createInitialSurvey('5', 'Healthy Lifestyle', 'Healthier future: Fit & wellness survey!', 2),
  createInitialSurvey('6', 'Team activities', 'Let’s Plan the Next Team Event Together', 1),
  createInitialSurvey('7', 'Workplace culture', 'How do you feel about remote work?', -4),
  createInitialSurvey('8', 'Team activities', 'Summer team event retrospective', -7),
  createInitialSurvey('9', 'Healthy Lifestyle', 'Weekly wellness check-in', -12),
];

let temporaryId = 10;

@Injectable({ providedIn: 'root' })
export class SurveyStore {
  private readonly surveysState = signal<readonly Survey[]>(INITIAL_SURVEYS);

  readonly surveys = this.surveysState.asReadonly();

  async createSurvey(input: CreateSurveyInput): Promise<Survey> {
    const survey: Survey = {
      id: nextTemporaryId('survey'),
      category: input.category,
      title: input.title,
      description: input.description,
      endDate: input.endDate,
      daysRemaining: calculateDaysRemaining(input.endDate),
      status: 'active',
      featured: false,
      questions: input.questions.map((question) => ({
        id: nextTemporaryId('question'),
        prompt: question.prompt,
        allowMultiple: question.allowMultiple,
        answers: question.answers.map((answer) => ({
          id: nextTemporaryId('answer'),
          text: answer,
        })),
      })),
    };

    this.surveysState.update((surveys) => [...surveys, survey]);

    return survey;
  }
}

function createInitialSurvey(
  id: string,
  category: string,
  title: string,
  daysRemaining: number,
  featured = false,
): Survey {
  return {
    id,
    category,
    title,
    description: '',
    endDate: null,
    daysRemaining,
    status: daysRemaining >= 0 ? 'active' : 'past',
    featured,
    questions: [],
  };
}

function nextTemporaryId(prefix: string): string {
  const id = temporaryId;
  temporaryId += 1;

  return `${prefix}-${id}`;
}

function calculateDaysRemaining(endDate: string | null): number | null {
  if (!endDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${endDate}T00:00:00`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / millisecondsPerDay));
}
