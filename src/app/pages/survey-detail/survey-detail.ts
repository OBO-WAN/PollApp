import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { Survey, SurveyAnswer, SurveyQuestion } from '../../surveys/survey.model';
import { SurveyStore } from '../../surveys/survey-store';

@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink],
  templateUrl: './survey-detail.html',
  styleUrls: [
    './survey-detail.css',
    './styles/questions.css',
    './styles/results.css',
    './styles/responsive.css',
  ],
})
export class SurveyDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyStore = inject(SurveyStore);
  private readonly surveyId = toSignal(
    this.route.paramMap.pipe(map((parameters) => parameters.get('surveyId'))),
    { initialValue: this.route.snapshot.paramMap.get('surveyId') },
  );

  protected readonly survey = computed(() => this.surveyStore.getSurveyById(this.surveyId()));

  protected endDateLabel(survey: Survey): string {
    if (!survey.endDate) {
      return 'No deadline';
    }

    const [year, month, day] = survey.endDate.split('-');

    return `Ends on ${day}.${month}.${year}`;
  }

  protected resultPercentage(question: SurveyQuestion, answer: SurveyAnswer): number {
    const totalVotes = question.answers.reduce((total, current) => total + current.voteCount, 0);

    return totalVotes === 0 ? 0 : Math.round((answer.voteCount / totalVotes) * 100);
  }

  protected answerLabel(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }

  protected resultLabel(
    question: SurveyQuestion,
    answer: SurveyAnswer,
    answerIndex: number,
  ): string {
    return `${this.answerLabel(answerIndex)}: ${this.resultPercentage(question, answer)} percent`;
  }
}
