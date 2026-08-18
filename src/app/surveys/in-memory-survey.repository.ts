import { Injectable, Provider } from '@angular/core';

import { INITIAL_SURVEYS } from './survey-fixtures';
import { CreateSurveyInput, Survey, SurveyVoteSelection } from './survey.model';
import { SURVEY_REPOSITORY, SurveyRepository } from './survey.repository';

let temporaryId = 10;

@Injectable()
export class InMemorySurveyRepository implements SurveyRepository {
  private surveys: readonly Survey[] = INITIAL_SURVEYS;

  async listSurveys(): Promise<readonly Survey[]> {
    return this.surveys;
  }

  async getSurveyById(id: string): Promise<Survey | undefined> {
    return this.surveys.find((survey) => survey.id === id);
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

    this.surveys = [...this.surveys, survey];

    return survey;
  }

  async submitVote(
    surveyId: string,
    selections: readonly SurveyVoteSelection[],
  ): Promise<Survey | undefined> {
    const survey = await this.getSurveyById(surveyId);

    if (!survey || survey.status !== 'active' || !isValidVote(survey, selections)) {
      return undefined;
    }

    const selectedAnswers = new Map(
      selections.map((selection) => [selection.questionId, new Set(selection.answerIds)]),
    );
    const updatedSurvey: Survey = {
      ...survey,
      questions: survey.questions.map((question) => ({
        ...question,
        answers: question.answers.map((answer) => ({
          ...answer,
          voteCount: answer.voteCount + (selectedAnswers.get(question.id)?.has(answer.id) ? 1 : 0),
        })),
      })),
    };

    this.surveys = this.surveys.map((currentSurvey) =>
      currentSurvey.id === surveyId ? updatedSurvey : currentSurvey,
    );

    return updatedSurvey;
  }
}

export function provideInMemorySurveyRepository(): Provider {
  return {
    provide: SURVEY_REPOSITORY,
    useClass: InMemorySurveyRepository,
  };
}

function isValidVote(survey: Survey, selections: readonly SurveyVoteSelection[]): boolean {
  if (selections.length !== survey.questions.length) {
    return false;
  }

  const selectionsByQuestion = new Map(
    selections.map((selection) => [selection.questionId, selection.answerIds]),
  );

  if (selectionsByQuestion.size !== selections.length) {
    return false;
  }

  return survey.questions.every((question) => {
    const answerIds = selectionsByQuestion.get(question.id);

    if (
      !answerIds ||
      answerIds.length === 0 ||
      (!question.allowMultiple && answerIds.length !== 1)
    ) {
      return false;
    }

    const uniqueAnswerIds = new Set(answerIds);
    const validAnswerIds = new Set(question.answers.map((answer) => answer.id));

    return (
      uniqueAnswerIds.size === answerIds.length &&
      answerIds.every((answerId) => validAnswerIds.has(answerId))
    );
  });
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
