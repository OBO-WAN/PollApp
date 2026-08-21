import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SurveyResultsRealtime } from './survey-results-realtime';
import { SUPABASE_CLIENT } from './supabase-survey.repository';
import { SurveyStore } from './survey-store';

type ChangeHandler = (payload: { readonly new: Record<string, unknown> }) => void;
type StatusHandler = (status: string) => void;

describe('SurveyResultsRealtime', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('subscribes to aggregate updates and applies valid payloads', () => {
    const source = signal<'supabase' | 'fixtures'>('supabase');
    const updateAnswerResult = vi.fn();
    const realtime = configureRealtime(source, updateAnswerResult);

    realtime.service.connect();

    expect(realtime.service.status()).toBe('connecting');
    expect(realtime.client.channel).toHaveBeenCalledWith('survey-answer-results');
    expect(realtime.channel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'answer_results' },
      expect.any(Function),
    );

    realtime.statusHandler?.('SUBSCRIBED');
    realtime.changeHandler?.({
      new: { answer_id: 'answer-1', vote_count: '12' },
    });

    expect(realtime.service.status()).toBe('connected');
    expect(updateAnswerResult).toHaveBeenCalledWith('answer-1', 12);
  });

  it('ignores fixture-mode and malformed result events', () => {
    const source = signal<'supabase' | 'fixtures'>('fixtures');
    const updateAnswerResult = vi.fn();
    const realtime = configureRealtime(source, updateAnswerResult);

    realtime.service.connect();
    realtime.changeHandler?.({
      new: { answer_id: 'answer-1', vote_count: 12 },
    });
    source.set('supabase');
    realtime.changeHandler?.({
      new: { answer_id: '', vote_count: 12 },
    });
    realtime.changeHandler?.({
      new: { answer_id: 'answer-1', vote_count: -1 },
    });
    realtime.changeHandler?.({
      new: { answer_id: 'answer-1', vote_count: 1.5 },
    });

    expect(updateAnswerResult).not.toHaveBeenCalled();
  });

  it('stays disabled when no Supabase client is configured', () => {
    const updateAnswerResult = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        SurveyResultsRealtime,
        {
          provide: SurveyStore,
          useValue: {
            dataSource: signal<'fixtures'>('fixtures'),
            updateAnswerResult,
          },
        },
      ],
    });

    const service = TestBed.inject(SurveyResultsRealtime);
    service.connect();

    expect(service.status()).toBe('disabled');
    expect(updateAnswerResult).not.toHaveBeenCalled();
  });

  it('surfaces channel errors and removes the channel on disconnect', () => {
    const realtime = configureRealtime(signal<'supabase'>('supabase'), vi.fn());

    realtime.service.connect();
    realtime.statusHandler?.('CHANNEL_ERROR');

    expect(realtime.service.status()).toBe('error');

    realtime.service.disconnect();

    expect(realtime.client.removeChannel).toHaveBeenCalledWith(realtime.channel);
    expect(realtime.service.status()).toBe('disabled');
  });
});

function configureRealtime(
  source:
    ReturnType<typeof signal<'supabase' | 'fixtures'>> | ReturnType<typeof signal<'supabase'>>,
  updateAnswerResult: ReturnType<typeof vi.fn>,
) {
  let changeHandler: ChangeHandler | undefined;
  let statusHandler: StatusHandler | undefined;
  const channel = {
    on: vi.fn(),
    subscribe: vi.fn(),
  };
  const client = {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(async () => 'ok'),
  };

  channel.on.mockImplementation(
    (_event: string, _filter: Record<string, string>, handler: ChangeHandler) => {
      changeHandler = handler;
      return channel;
    },
  );
  channel.subscribe.mockImplementation((handler: StatusHandler) => {
    statusHandler = handler;
    return channel;
  });

  TestBed.configureTestingModule({
    providers: [
      SurveyResultsRealtime,
      {
        provide: SurveyStore,
        useValue: {
          dataSource: source,
          updateAnswerResult,
        },
      },
      { provide: SUPABASE_CLIENT, useValue: client as unknown as SupabaseClient },
    ],
  });

  return {
    service: TestBed.inject(SurveyResultsRealtime),
    client,
    channel,
    get changeHandler() {
      return changeHandler;
    },
    get statusHandler() {
      return statusHandler;
    },
  };
}
