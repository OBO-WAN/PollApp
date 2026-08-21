import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { SurveyResultsRealtime } from './surveys/survey-results-realtime';
import { SurveyStore } from './surveys/survey-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideAppInitializer(() => {
      const store = inject(SurveyStore);
      const realtime = inject(SurveyResultsRealtime);

      void store
        .loadSurveys()
        .then(() => {
          if (store.dataSource() === 'supabase') {
            realtime.connect();
          }
        })
        .catch(() => undefined);
    }),
  ],
};
