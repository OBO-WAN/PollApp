import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    children: [
      {
        path: 'surveys/new',
        loadComponent: () =>
          import('./pages/create-survey/create-survey').then(({ CreateSurvey }) => CreateSurvey),
      },
    ],
  },
  {
    path: 'surveys/:surveyId',
    loadComponent: () =>
      import('./pages/survey-detail/survey-detail').then(({ SurveyDetail }) => SurveyDetail),
  },
];
