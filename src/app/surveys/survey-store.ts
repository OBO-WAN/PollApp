import { Injectable, signal } from '@angular/core';

import { CreateSurveyInput, Survey, SurveyQuestion } from './survey.model';

const TEAM_EVENT_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'question-1',
    prompt: 'Which date would work best for you?',
    allowMultiple: true,
    answers: [
      { id: 'answer-1', text: '19.09.2025, Friday', voteCount: 27 },
      { id: 'answer-2', text: '10.10.2025, Friday', voteCount: 44 },
      { id: 'answer-3', text: '11.10.2025, Saturday', voteCount: 3 },
      { id: 'answer-4', text: '31.10.2025, Friday', voteCount: 26 },
    ],
  },
  {
    id: 'question-2',
    prompt: 'Choose the activities you prefer',
    allowMultiple: true,
    answers: [
      { id: 'answer-5', text: 'Outdoor adventure like kayaking', voteCount: 60 },
      { id: 'answer-6', text: 'Office Costume Party', voteCount: 0 },
      { id: 'answer-7', text: 'Bowling, mini-golf, volleyball', voteCount: 14 },
      { id: 'answer-8', text: 'Beach party, Music & cocktails', voteCount: 26 },
      { id: 'answer-9', text: 'Escape room', voteCount: 0 },
    ],
  },
  {
    id: 'question-3',
    prompt: 'What’s most important to you in a team event?',
    allowMultiple: false,
    answers: [
      { id: 'answer-10', text: 'Team bonding', voteCount: 44 },
      { id: 'answer-11', text: 'Food and drinks', voteCount: 3 },
      { id: 'answer-12', text: 'Trying something new', voteCount: 26 },
      { id: 'answer-13', text: 'Keeping it low-key and stress-free', voteCount: 27 },
    ],
  },
  {
    id: 'question-4',
    prompt: 'How long would you prefer the event to last?',
    allowMultiple: false,
    answers: [
      { id: 'answer-14', text: 'Half a day', voteCount: 14 },
      { id: 'answer-15', text: 'Full day', voteCount: 86 },
      { id: 'answer-16', text: 'Evening only', voteCount: 0 },
    ],
  },
];

const INITIAL_SURVEYS: readonly Survey[] = [
  createInitialSurvey('1', 'Team activities', 'Let’s Plan the Next Team Event Together', 1, {
    featured: true,
    description:
      'We want to create team activities that everyone will enjoy – share your preferences and ideas in our survey to help us plan better experiences together.',
    endDate: '2025-09-01',
    questions: TEAM_EVENT_QUESTIONS,
  }),
  createInitialSurvey('2', 'Gaming', 'Gaming habits and favorite games!', 3, {
    featured: true,
  }),
  createInitialSurvey('3', 'Gaming', 'Gaming habits and favorite games!', 3),
  createInitialSurvey('4', 'Healthy Lifestyle', 'Healthier future: Fit & wellness survey!', 2, {
    featured: true,
  }),
  createInitialSurvey('5', 'Healthy Lifestyle', 'Healthier future: Fit & wellness survey!', 2),
  createInitialSurvey('6', 'Team activities', 'Let’s Plan the Next Team Event Together', 1),
  createInitialSurvey('7', 'Workplace culture', 'How do you feel about remote work?', -4),
  createInitialSurvey('8', 'Team activities', 'Summer team event retrospective', -7),
  createInitialSurvey('9', 'Healthy Lifestyle', 'Weekly wellness check-in', -12),
];

let temporaryId = 10;

@Injectable({ providedIn: 'root' })
export class SurveyStore {
  private readonly surveysState = signal<readonly Survey[]>(INITIAL_SURVEYS);

  readonly surveys = this.surveysState.asReadonly();

  getSurveyById(id: string | null): Survey | undefined {
    return id ? this.surveysState().find((survey) => survey.id === id) : undefined;
  }

  async createSurvey(input: CreateSurveyInput): Promise<Survey> {
    const survey: Survey = {
      id: nextTemporaryId('survey'),
      category: input.category,
      title: input.title,
      description: input.description,
      endDate: input.endDate,
      daysRemaining: calculateDaysRemaining(input.endDate),
      status: 'active',
      featured: false,
      questions: input.questions.map((question) => ({
        id: nextTemporaryId('question'),
        prompt: question.prompt,
        allowMultiple: question.allowMultiple,
        answers: question.answers.map((answer) => ({
          id: nextTemporaryId('answer'),
          text: answer,
          voteCount: 0,
        })),
      })),
    };

    this.surveysState.update((surveys) => [...surveys, survey]);

    return survey;
  }
}

function createInitialSurvey(
  id: string,
  category: string,
  title: string,
  daysRemaining: number,
  options: {
    readonly description?: string;
    readonly endDate?: string | null;
    readonly featured?: boolean;
    readonly questions?: readonly SurveyQuestion[];
  } = {},
): Survey {
  return {
    id,
    category,
    title,
    description: options.description ?? '',
    endDate: options.endDate ?? null,
    daysRemaining,
    status: daysRemaining >= 0 ? 'active' : 'past',
    featured: options.featured ?? false,
    questions: options.questions ?? [],
  };
}

function nextTemporaryId(prefix: string): string {
  const id = temporaryId;
  temporaryId += 1;

  return `${prefix}-${id}`;
}

function calculateDaysRemaining(endDate: string | null): number | null {
  if (!endDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${endDate}T00:00:00`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / millisecondsPerDay));
}
