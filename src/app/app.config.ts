import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideInMemorySurveyRepository } from './surveys/in-memory-survey.repository';
import { SurveyStore } from './surveys/survey-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideInMemorySurveyRepository(),
    provideAppInitializer(() =>
      inject(SurveyStore)
        .loadSurveys()
        .catch(() => undefined),
    ),
  ],
};
