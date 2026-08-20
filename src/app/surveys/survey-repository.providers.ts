import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

import { SupabaseRuntimeConfig } from '../config/supabase-runtime-config';
import { FallbackSurveyRepository } from './fallback-survey.repository';
import { InMemorySurveyRepository } from './in-memory-survey.repository';
import { SURVEY_REPOSITORY } from './survey.repository';
import { SUPABASE_CLIENT, SupabaseSurveyRepository } from './supabase-survey.repository';

export function provideSurveyRepository(
  config: SupabaseRuntimeConfig | null,
): EnvironmentProviders {
  if (!config) {
    return makeEnvironmentProviders([
      InMemorySurveyRepository,
      { provide: SURVEY_REPOSITORY, useExisting: InMemorySurveyRepository },
    ]);
  }

  const client = createClient(config.url, config.publishableKey, {
    db: {
      retry: false,
    },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return makeEnvironmentProviders([
    InMemorySurveyRepository,
    SupabaseSurveyRepository,
    FallbackSurveyRepository,
    { provide: SUPABASE_CLIENT, useValue: client },
    { provide: SURVEY_REPOSITORY, useExisting: FallbackSurveyRepository },
  ]);
}
