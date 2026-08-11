import { Component, ElementRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CreateSurveyInput, SURVEY_CATEGORIES } from '../../surveys/survey.model';
import { SurveyStore } from '../../surveys/survey-store';

type AnswerControl = FormControl<string>;
type ClearableField = 'title' | 'endDate' | 'description';

type QuestionForm = FormGroup<{
  prompt: FormControl<string>;
  allowMultiple: FormControl<boolean>;
  answers: FormArray<AnswerControl>;
}>;

const trimmedRequired: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

const notPastDate: ValidatorFn = (control) => {
  if (typeof control.value !== 'string' || control.value.length === 0) {
    return null;
  }

  return control.value >= formatLocalDate(new Date()) ? null : { pastDate: true };
};

@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-survey.html',
  styleUrls: ['./create-survey.css', './styles/form.css', './styles/responsive.css'],
})
export class CreateSurvey {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly surveyStore = inject(SurveyStore);

  protected readonly categories = SURVEY_CATEGORIES;
  protected readonly isPublishing = signal(false);
  protected readonly published = signal(false);
  protected readonly submitted = signal(false);
  protected readonly minimumEndDate = formatLocalDate(new Date());

  protected readonly surveyForm = this.formBuilder.group({
    title: ['', [trimmedRequired]],
    endDate: ['', [notPastDate]],
    category: ['', [Validators.required]],
    description: [''],
    questions: this.formBuilder.array<QuestionForm>([this.createQuestion()]),
  });

  protected get questions(): FormArray<QuestionForm> {
    return this.surveyForm.controls.questions;
  }

  protected answersFor(questionIndex: number): FormArray<AnswerControl> {
    return this.questions.at(questionIndex).controls.answers;
  }

  protected addQuestion(): void {
    this.questions.push(this.createQuestion());
  }

  protected removeQuestion(questionIndex: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(questionIndex);
    }
  }

  protected addAnswer(questionIndex: number): void {
    this.answersFor(questionIndex).push(this.createAnswer());
  }

  protected removeAnswer(questionIndex: number, answerIndex: number): void {
    const answers = this.answersFor(questionIndex);

    if (answers.length > 2) {
      answers.removeAt(answerIndex);
    }
  }

  protected clearField(field: ClearableField): void {
    this.surveyForm.controls[field].setValue('');
    this.surveyForm.controls[field].markAsTouched();
  }

  protected answerLabel(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitted());
  }

  protected async publish(): Promise<void> {
    if (this.isPublishing() || this.published()) {
      return;
    }

    this.submitted.set(true);
    this.surveyForm.markAllAsTouched();

    if (this.surveyForm.invalid) {
      queueMicrotask(() => {
        this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    this.isPublishing.set(true);

    try {
      await this.surveyStore.createSurvey(this.createSurveyInput());
      this.published.set(true);
    } finally {
      this.isPublishing.set(false);
    }
  }

  protected returnToSurveyList(): void {
    void this.router.navigateByUrl('/');
  }

  private createQuestion(): QuestionForm {
    return this.formBuilder.group({
      prompt: ['', [trimmedRequired]],
      allowMultiple: [false],
      answers: this.formBuilder.array<AnswerControl>([this.createAnswer(), this.createAnswer()]),
    });
  }

  private createAnswer(): AnswerControl {
    return this.formBuilder.control('', [trimmedRequired]);
  }

  private createSurveyInput(): CreateSurveyInput {
    const value = this.surveyForm.getRawValue();

    return {
      title: value.title.trim(),
      endDate: value.endDate || null,
      category: value.category,
      description: value.description.trim(),
      questions: value.questions.map((question) => ({
        prompt: question.prompt.trim(),
        allowMultiple: question.allowMultiple,
        answers: question.answers.map((answer) => answer.trim()),
      })),
    };
  }
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
