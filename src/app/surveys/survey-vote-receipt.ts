import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'pollapp.completed-survey-ids';

@Injectable({ providedIn: 'root' })
export class SurveyVoteReceipt {
  private readonly completedSurveyIds = signal<readonly string[]>(readCompletedSurveyIds());

  has(surveyId: string): boolean {
    return this.completedSurveyIds().includes(surveyId);
  }

  record(surveyId: string): void {
    if (this.has(surveyId)) {
      return;
    }

    const completedSurveyIds = [...this.completedSurveyIds(), surveyId];
    this.completedSurveyIds.set(completedSurveyIds);
    storeCompletedSurveyIds(completedSurveyIds);
  }
}

function readCompletedSurveyIds(): readonly string[] {
  try {
    const storedValue = globalThis.localStorage.getItem(STORAGE_KEY);
    const parsedValue: unknown = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (surveyId): surveyId is string => typeof surveyId === 'string' && surveyId.length > 0,
        )
      : [];
  } catch {
    return [];
  }
}

function storeCompletedSurveyIds(surveyIds: readonly string[]): void {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(surveyIds));
  } catch {
    // The service instance retains the receipt when browser storage is unavailable.
  }
}
