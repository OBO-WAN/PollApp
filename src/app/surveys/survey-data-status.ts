import { Injectable, signal } from '@angular/core';

export type SurveyDataSource = 'loading' | 'supabase' | 'fixtures';

@Injectable({ providedIn: 'root' })
export class SurveyDataStatus {
  private readonly sourceState = signal<SurveyDataSource>('fixtures');
  private readonly warningState = signal<string | null>(null);

  readonly source = this.sourceState.asReadonly();
  readonly warning = this.warningState.asReadonly();

  markLoading(): void {
    this.sourceState.set('loading');
    this.warningState.set(null);
  }

  markSupabase(): void {
    this.sourceState.set('supabase');
    this.warningState.set(null);
  }

  markFallback(): void {
    this.sourceState.set('fixtures');
    this.warningState.set('Live survey data is unavailable. Showing sample surveys.');
  }
}
