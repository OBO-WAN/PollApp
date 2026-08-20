import { mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { loadSupabaseRuntimeConfig } from './app/config/supabase-runtime-config';
import { provideSurveyRepository } from './app/surveys/survey-repository.providers';

loadSupabaseRuntimeConfig()
  .then((supabaseConfig) =>
    bootstrapApplication(
      App,
      mergeApplicationConfig(appConfig, {
        providers: [provideSurveyRepository(supabaseConfig)],
      }),
    ),
  )
  .catch((error) => console.error(error));
