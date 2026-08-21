import { inject, Injectable, InjectionToken } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

import { AnonymousVoterToken } from './anonymous-voter-token';
import {
  CreateSurveyInput,
  Survey,
  SurveyAnswer,
  SurveyQuestion,
  SurveyVoteSelection,
} from './survey.model';
import { SurveyRepository } from './survey.repository';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT');

const SURVEY_SELECT = `
  id,
  category,
  title,
  description,
  end_date,
  created_at,
  questions (
    id,
    prompt,
    allow_multiple,
    position,
    answers (
      id,
      text,
      position,
      answer_results (vote_count)
    )
  )
`;

interface AnswerResultRow {
  readonly vote_count: number | string;
}

interface AnswerRow {
  readonly id: string;
  readonly text: string;
  readonly position: number;
  readonly answer_results: AnswerResultRow | readonly AnswerResultRow[] | null;
}

interface QuestionRow {
  readonly id: string;
  readonly prompt: string;
  readonly allow_multiple: boolean;
  readonly position: number;
  readonly answers: readonly AnswerRow[] | null;
}

export interface SupabaseSurveyRow {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly description: string | null;
  readonly end_date: string | null;
  readonly created_at: string;
  readonly questions: readonly QuestionRow[] | null;
}

@Injectable()
export class SupabaseSurveyRepository implements SurveyRepository {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly anonymousVoterToken = inject(AnonymousVoterToken);

  async createSurvey(input: CreateSurveyInput): Promise<Survey> {
    const { data: surveyId, error } = await this.client.rpc('create_survey', {
      p_payload: input,
    });

    if (error) {
      throw new Error('Supabase could not create the survey.', { cause: error });
    }

    if (typeof surveyId !== 'string' || surveyId.length === 0) {
      throw new Error('Supabase did not return the created survey ID.');
    }

    const survey = await this.getSurveyById(surveyId);

    if (!survey) {
      throw new Error('Supabase created the survey but could not load it.');
    }

    return survey;
  }

  async listSurveys(): Promise<readonly Survey[]> {
    const { data, error } = await this.client.from('surveys').select(SURVEY_SELECT);

    if (error) {
      throw new Error('Supabase could not load surveys.', { cause: error });
    }

    return mapSupabaseSurveys((data ?? []) as unknown as readonly SupabaseSurveyRow[]);
  }

  async getSurveyById(id: string): Promise<Survey | undefined> {
    const { data, error } = await this.client
      .from('surveys')
      .select(SURVEY_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error('Supabase could not load the survey.', { cause: error });
    }

    return data ? mapSupabaseSurvey(data as unknown as SupabaseSurveyRow) : undefined;
  }

  async submitVote(surveyId: string, selections: readonly SurveyVoteSelection[]): Promise<Survey> {
    const { data: submitted, error } = await this.client.rpc('submit_survey_vote', {
      p_survey_id: surveyId,
      p_anonymous_token: this.anonymousVoterToken.value,
      p_selections: selections,
    });

    if (error) {
      throw new Error('Supabase could not submit the vote.', { cause: error });
    }

    if (submitted !== true) {
      throw new Error('Supabase did not confirm the submitted vote.');
    }

    const survey = await this.getSurveyById(surveyId);

    if (!survey) {
      throw new Error('Supabase recorded the vote but could not load the survey.');
    }

    return survey;
  }
}

export function mapSupabaseSurveys(rows: readonly SupabaseSurveyRow[]): readonly Survey[] {
  return [...rows]
    .sort(
      (first, second) =>
        first.created_at.localeCompare(second.created_at) || first.id.localeCompare(second.id),
    )
    .map(mapSupabaseSurvey);
}

export function mapSupabaseSurvey(row: SupabaseSurveyRow): Survey {
  const daysRemaining = calculateDaysRemaining(row.end_date);

  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description ?? '',
    endDate: row.end_date,
    daysRemaining,
    status: daysRemaining === null || daysRemaining >= 0 ? 'active' : 'past',
    questions: [...(row.questions ?? [])].sort(byPosition).map<SurveyQuestion>((question) => ({
      id: question.id,
      prompt: question.prompt,
      allowMultiple: question.allow_multiple,
      answers: [...(question.answers ?? [])].sort(byPosition).map<SurveyAnswer>((answer) => ({
        id: answer.id,
        text: answer.text,
        voteCount: readVoteCount(answer.answer_results),
      })),
    })),
  };
}

function byPosition(first: { readonly position: number }, second: { readonly position: number }) {
  return first.position - second.position;
}

function readVoteCount(results: AnswerRow['answer_results']): number {
  const result = Array.isArray(results) ? results[0] : results;
  return Number(result?.vote_count ?? 0);
}

function calculateDaysRemaining(endDate: string | null): number | null {
  if (!endDate) {
    return null;
  }

  const [year, month, day] = endDate.split('-').map(Number);
  const today = new Date();
  const todayTimestamp = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineTimestamp = Date.UTC(year, month - 1, day);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((deadlineTimestamp - todayTimestamp) / millisecondsPerDay);
}
