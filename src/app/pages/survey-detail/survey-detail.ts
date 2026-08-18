import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import {
  Survey,
  SurveyAnswer,
  SurveyQuestion,
  SurveyVoteSelection,
} from '../../surveys/survey.model';
import { SurveyStore } from '../../surveys/survey-store';

@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink],
  templateUrl: './survey-detail.html',
  styleUrls: [
    './survey-detail.css',
    './styles/questions.css',
    './styles/voting.css',
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
  private readonly selectedAnswersState = signal<Readonly<Record<string, readonly string[]>>>({});
  private readonly submittedSurveyId = signal<string | null>(null);

  protected readonly resultsExpanded = signal(true);
  protected readonly survey = computed(() => this.surveyStore.getSurveyById(this.surveyId()));
  protected readonly isReadOnly = computed(() => this.survey()?.status === 'past');
  protected readonly canSubmit = computed(() => {
    const survey = this.survey();
    const selectedAnswers = this.selectedAnswersState();

    return (
      !!survey &&
      survey.status === 'active' &&
      survey.questions.length > 0 &&
      survey.questions.every((question) => (selectedAnswers[question.id]?.length ?? 0) > 0)
    );
  });
  protected readonly hasSubmitted = computed(() => this.submittedSurveyId() === this.survey()?.id);

  protected endDateLabel(survey: Survey): string {
    if (!survey.endDate) {
      return 'No deadline';
    }

    const [year, month, day] = survey.endDate.split('-');

    return `${survey.status === 'past' ? 'Ended' : 'Ends'} on ${day}.${month}.${year}`;
  }

  protected resultPercentage(question: SurveyQuestion, answer: SurveyAnswer): number {
    const totalVotes = question.answers.reduce((total, current) => total + current.voteCount, 0);

    return totalVotes === 0 ? 0 : Math.round((answer.voteCount / totalVotes) * 100);
  }

  protected answerLabel(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }

  protected isAnswerSelected(questionId: string, answerId: string): boolean {
    return this.selectedAnswersState()[questionId]?.includes(answerId) ?? false;
  }

  protected selectAnswer(question: SurveyQuestion, answerId: string): void {
    if (this.isReadOnly() || this.hasSubmitted()) {
      return;
    }

    this.selectedAnswersState.update((currentSelections) => {
      const selectedForQuestion = currentSelections[question.id] ?? [];
      const nextSelection = question.allowMultiple
        ? toggleAnswer(selectedForQuestion, answerId)
        : [answerId];

      return {
        ...currentSelections,
        [question.id]: nextSelection,
      };
    });
  }

  protected async submitVote(event: Event): Promise<void> {
    event.preventDefault();

    const survey = this.survey();

    if (!survey || this.isReadOnly() || !this.canSubmit() || this.hasSubmitted()) {
      return;
    }

    const selections: readonly SurveyVoteSelection[] = survey.questions.map((question) => ({
      questionId: question.id,
      answerIds: this.selectedAnswersState()[question.id] ?? [],
    }));

    if (await this.surveyStore.submitVote(survey.id, selections)) {
      this.submittedSurveyId.set(survey.id);
    }
  }

  protected toggleResults(): void {
    this.resultsExpanded.update((isExpanded) => !isExpanded);
  }

  protected resultLabel(
    question: SurveyQuestion,
    answer: SurveyAnswer,
    answerIndex: number,
  ): string {
    return `${this.answerLabel(answerIndex)}: ${this.resultPercentage(question, answer)} percent`;
  }
}

function toggleAnswer(selectedAnswers: readonly string[], answerId: string): readonly string[] {
  return selectedAnswers.includes(answerId)
    ? selectedAnswers.filter((selectedAnswerId) => selectedAnswerId !== answerId)
    : [...selectedAnswers, answerId];
}
