import { SurveyQuestion } from './survey.model';

export const REMOTE_WORK_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'remote-work-location',
    prompt: 'Where did you work most often?',
    allowMultiple: false,
    answers: [
      { id: 'remote-work-location-1', text: 'Mostly from home', voteCount: 46 },
      { id: 'remote-work-location-2', text: 'Mostly from the office', voteCount: 18 },
      { id: 'remote-work-location-3', text: 'A balanced mix of both', voteCount: 36 },
    ],
  },
  {
    id: 'remote-work-benefits',
    prompt: 'Which aspects of remote work helped you most?',
    allowMultiple: true,
    answers: [
      { id: 'remote-work-benefit-1', text: 'More focused work time', voteCount: 38 },
      { id: 'remote-work-benefit-2', text: 'A flexible daily schedule', voteCount: 34 },
      { id: 'remote-work-benefit-3', text: 'Less commuting', voteCount: 22 },
      { id: 'remote-work-benefit-4', text: 'A better work-life balance', voteCount: 29 },
    ],
  },
];

export const SUMMER_EVENT_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'summer-event-rating',
    prompt: 'How would you rate the summer team event?',
    allowMultiple: false,
    answers: [
      { id: 'summer-event-rating-1', text: 'Excellent', voteCount: 41 },
      { id: 'summer-event-rating-2', text: 'Good', voteCount: 37 },
      { id: 'summer-event-rating-3', text: 'Okay', voteCount: 15 },
      { id: 'summer-event-rating-4', text: 'Needs improvement', voteCount: 7 },
    ],
  },
  {
    id: 'summer-event-highlights',
    prompt: 'Which parts of the event did you enjoy most?',
    allowMultiple: true,
    answers: [
      { id: 'summer-event-highlight-1', text: 'Outdoor activities', voteCount: 32 },
      { id: 'summer-event-highlight-2', text: 'Food and drinks', voteCount: 28 },
      { id: 'summer-event-highlight-3', text: 'Time with the team', voteCount: 44 },
      { id: 'summer-event-highlight-4', text: 'Music and entertainment', voteCount: 19 },
    ],
  },
];

export const WELLNESS_CHECK_IN_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'wellness-check-in-energy',
    prompt: 'How was your energy level this week?',
    allowMultiple: false,
    answers: [
      { id: 'wellness-check-in-energy-1', text: 'High', voteCount: 24 },
      { id: 'wellness-check-in-energy-2', text: 'Mostly steady', voteCount: 48 },
      { id: 'wellness-check-in-energy-3', text: 'Low', voteCount: 28 },
    ],
  },
  {
    id: 'wellness-check-in-support',
    prompt: 'What supported your well-being this week?',
    allowMultiple: true,
    answers: [
      { id: 'wellness-check-in-support-1', text: 'Regular breaks', voteCount: 31 },
      { id: 'wellness-check-in-support-2', text: 'Movement or exercise', voteCount: 27 },
      { id: 'wellness-check-in-support-3', text: 'Connecting with colleagues', voteCount: 22 },
      { id: 'wellness-check-in-support-4', text: 'A manageable workload', voteCount: 35 },
    ],
  },
];
