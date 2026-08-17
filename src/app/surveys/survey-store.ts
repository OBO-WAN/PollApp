import { Injectable, signal } from '@angular/core';

import { INITIAL_SURVEYS } from './survey-fixtures';
import { CreateSurveyInput, Survey } from './survey.model';

let temporaryId = 10;

@Injectable({ providedIn: 'root' })
export class SurveyStore {
  private readonly surveysState = signal<readonly Survey[]>(INITIAL_SURVEYS);

  readonly surveys = this.surveysState.asReadonly();

  getSurveyById(id: string | null): Survey | undefined {
    return id ? this.surveysState().find((survey) => survey.id === id) : undefined;
  }

  async createSurvey(input: CreateSurveyInput): Promise<Survey> {
    const survey: Survey = {
      id: nextTemporaryId('survey'),
      category: input.category,
      title: input.title,
      description: input.description,
      endDate: input.endDate,
      daysRemaining: calculateDaysRemaining(input.endDate),
      status: 'active',
      questions: input.questions.map((question) => ({
        id: nextTemporaryId('question'),
        prompt: question.prompt,
        allowMultiple: question.allowMultiple,
        answers: question.answers.map((answer) => ({
          id: nextTemporaryId('answer'),
          text: answer,
          voteCount: 0,
        })),
      })),
    };

    this.surveysState.update((surveys) => [...surveys, survey]);

    return survey;
  }
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
