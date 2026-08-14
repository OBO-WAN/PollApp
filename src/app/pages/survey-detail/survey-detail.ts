import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { Survey } from '../../surveys/survey.model';
import { SurveyStore } from '../../surveys/survey-store';

@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink],
  templateUrl: './survey-detail.html',
  styleUrls: ['./survey-detail.css', './styles/questions.css', './styles/responsive.css'],
})
export class SurveyDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyStore = inject(SurveyStore);
  private readonly surveyId = toSignal(
    this.route.paramMap.pipe(map((parameters) => parameters.get('surveyId'))),
    { initialValue: this.route.snapshot.paramMap.get('surveyId') },
  );

  protected readonly survey = computed(() => this.surveyStore.getSurveyById(this.surveyId()));

  protected deadlineLabel(survey: Survey): string {
    if (survey.daysRemaining === null) {
      return 'No deadline';
    }

    const days = Math.abs(survey.daysRemaining);
    const unit = days === 1 ? 'day' : 'days';

    return survey.status === 'active' ? `Ends in ${days} ${unit}` : `Ended ${days} ${unit} ago`;
  }

  protected questionCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'question' : 'questions'}`;
  }

  protected answerLabel(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }
}
