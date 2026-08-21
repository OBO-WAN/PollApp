import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { SUPABASE_CLIENT } from './supabase-survey.repository';
import { SurveyStore } from './survey-store';

export type SurveyRealtimeStatus = 'disabled' | 'connecting' | 'connected' | 'error';

@Injectable({ providedIn: 'root' })
export class SurveyResultsRealtime {
  private readonly client = inject(SUPABASE_CLIENT, { optional: true });
  private readonly store = inject(SurveyStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly statusState = signal<SurveyRealtimeStatus>('disabled');
  private channel: RealtimeChannel | null = null;

  readonly status = this.statusState.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  connect(): void {
    if (!this.client || this.channel) {
      return;
    }

    this.statusState.set('connecting');
    this.channel = this.client
      .channel('survey-answer-results')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'answer_results' },
        ({ new: result }) => this.applyResultUpdate(result),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.statusState.set('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.statusState.set('error');
        } else if (status === 'CLOSED') {
          this.statusState.set('disabled');
        }
      });
  }

  disconnect(): void {
    const channel = this.channel;

    this.channel = null;
    this.statusState.set('disabled');

    if (this.client && channel) {
      void this.client.removeChannel(channel);
    }
  }

  private applyResultUpdate(result: Record<string, unknown>): void {
    if (this.store.dataSource() !== 'supabase') {
      return;
    }

    const answerId = typeof result['answer_id'] === 'string' ? result['answer_id'] : '';
    const voteCount = Number(result['vote_count']);

    if (!answerId || !Number.isSafeInteger(voteCount) || voteCount < 0) {
      return;
    }

    this.store.updateAnswerResult(answerId, voteCount);
  }
}
