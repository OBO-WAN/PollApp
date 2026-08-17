import { Survey, SurveyQuestion } from './survey.model';
import {
  REMOTE_WORK_QUESTIONS,
  SUMMER_EVENT_QUESTIONS,
  WELLNESS_CHECK_IN_QUESTIONS,
} from './past-survey-fixtures';

const TEAM_EVENT_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'team-date',
    prompt: 'Which date would work best for you?',
    allowMultiple: true,
    answers: [
      { id: 'team-date-1', text: '19.09.2025, Friday', voteCount: 27 },
      { id: 'team-date-2', text: '10.10.2025, Friday', voteCount: 44 },
      { id: 'team-date-3', text: '11.10.2025, Saturday', voteCount: 3 },
      { id: 'team-date-4', text: '31.10.2025, Friday', voteCount: 26 },
    ],
  },
  {
    id: 'team-activities',
    prompt: 'Choose the activities you prefer',
    allowMultiple: true,
    answers: [
      { id: 'team-activity-1', text: 'Outdoor adventure like kayaking', voteCount: 60 },
      { id: 'team-activity-2', text: 'Office Costume Party', voteCount: 0 },
      { id: 'team-activity-3', text: 'Bowling, mini-golf, volleyball', voteCount: 14 },
      { id: 'team-activity-4', text: 'Beach party, Music & cocktails', voteCount: 26 },
      { id: 'team-activity-5', text: 'Escape room', voteCount: 0 },
    ],
  },
  {
    id: 'team-priority',
    prompt: 'What’s most important to you in a team event?',
    allowMultiple: false,
    answers: [
      { id: 'team-priority-1', text: 'Team bonding', voteCount: 44 },
      { id: 'team-priority-2', text: 'Food and drinks', voteCount: 3 },
      { id: 'team-priority-3', text: 'Trying something new', voteCount: 26 },
      { id: 'team-priority-4', text: 'Keeping it low-key and stress-free', voteCount: 27 },
    ],
  },
  {
    id: 'team-duration',
    prompt: 'How long would you prefer the event to last?',
    allowMultiple: false,
    answers: [
      { id: 'team-duration-1', text: 'Half a day', voteCount: 14 },
      { id: 'team-duration-2', text: 'Full day', voteCount: 86 },
      { id: 'team-duration-3', text: 'Evening only', voteCount: 0 },
    ],
  },
];

const GAMING_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'gaming-frequency',
    prompt: 'How often do you play video games?',
    allowMultiple: false,
    answers: [
      { id: 'gaming-frequency-1', text: 'Every day', voteCount: 32 },
      { id: 'gaming-frequency-2', text: 'Several times a week', voteCount: 41 },
      { id: 'gaming-frequency-3', text: 'A few times a month', voteCount: 19 },
      { id: 'gaming-frequency-4', text: 'Rarely', voteCount: 8 },
    ],
  },
  {
    id: 'gaming-platforms',
    prompt: 'Which platforms do you use?',
    allowMultiple: true,
    answers: [
      { id: 'gaming-platform-1', text: 'PC', voteCount: 38 },
      { id: 'gaming-platform-2', text: 'PlayStation', voteCount: 29 },
      { id: 'gaming-platform-3', text: 'Xbox', voteCount: 18 },
      { id: 'gaming-platform-4', text: 'Nintendo Switch', voteCount: 15 },
    ],
  },
  {
    id: 'gaming-genres',
    prompt: 'Which game genres do you enjoy most?',
    allowMultiple: true,
    answers: [
      { id: 'gaming-genre-1', text: 'Action and adventure', voteCount: 28 },
      { id: 'gaming-genre-2', text: 'Strategy', voteCount: 22 },
      { id: 'gaming-genre-3', text: 'Role-playing games', voteCount: 24 },
      { id: 'gaming-genre-4', text: 'Sports and racing', voteCount: 18 },
      { id: 'gaming-genre-5', text: 'Cozy and casual games', voteCount: 8 },
    ],
  },
  {
    id: 'gaming-priority',
    prompt: 'What matters most when choosing a game?',
    allowMultiple: false,
    answers: [
      { id: 'gaming-priority-1', text: 'Story and world', voteCount: 31 },
      { id: 'gaming-priority-2', text: 'Playing with friends', voteCount: 37 },
      { id: 'gaming-priority-3', text: 'Challenge and gameplay', voteCount: 25 },
      { id: 'gaming-priority-4', text: 'Visual style', voteCount: 7 },
    ],
  },
];

const WELLNESS_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'wellness-goals',
    prompt: 'Which wellness goals are most important to you?',
    allowMultiple: true,
    answers: [
      { id: 'wellness-goal-1', text: 'Being more active', voteCount: 34 },
      { id: 'wellness-goal-2', text: 'Improving sleep', voteCount: 27 },
      { id: 'wellness-goal-3', text: 'Eating balanced meals', voteCount: 23 },
      { id: 'wellness-goal-4', text: 'Reducing stress', voteCount: 16 },
    ],
  },
  {
    id: 'wellness-frequency',
    prompt: 'How often do you exercise during a typical week?',
    allowMultiple: false,
    answers: [
      { id: 'wellness-frequency-1', text: 'Not currently', voteCount: 12 },
      { id: 'wellness-frequency-2', text: '1–2 days', voteCount: 35 },
      { id: 'wellness-frequency-3', text: '3–4 days', voteCount: 41 },
      { id: 'wellness-frequency-4', text: '5 or more days', voteCount: 12 },
    ],
  },
  {
    id: 'wellness-motivation',
    prompt: 'What helps you stay motivated?',
    allowMultiple: true,
    answers: [
      { id: 'wellness-motivation-1', text: 'Clear personal goals', voteCount: 29 },
      { id: 'wellness-motivation-2', text: 'Exercising with others', voteCount: 34 },
      { id: 'wellness-motivation-3', text: 'Tracking progress', voteCount: 25 },
      { id: 'wellness-motivation-4', text: 'Professional guidance', voteCount: 12 },
    ],
  },
  {
    id: 'wellness-activity',
    prompt: 'Which wellness activity would you most like us to offer?',
    allowMultiple: false,
    answers: [
      { id: 'wellness-activity-1', text: 'Group fitness sessions', voteCount: 26 },
      { id: 'wellness-activity-2', text: 'Healthy cooking workshops', voteCount: 21 },
      { id: 'wellness-activity-3', text: 'Mindfulness sessions', voteCount: 31 },
      { id: 'wellness-activity-4', text: 'Walking or running groups', voteCount: 22 },
    ],
  },
];

export const INITIAL_SURVEYS: readonly Survey[] = [
  createSurveyFixture(
    '1',
    'Team activities',
    'Let’s Plan the Next Team Event Together',
    1,
    'We want to create team activities that everyone will enjoy – share your preferences and ideas in our survey to help us plan better experiences together.',
    TEAM_EVENT_QUESTIONS,
  ),
  createSurveyFixture(
    '2',
    'Gaming & Entertainment',
    'Gaming habits and favorite games!',
    3,
    'We’d like to learn more about your gaming habits, favorite genres and preferred ways to play.',
    GAMING_QUESTIONS,
  ),
  createSurveyFixture(
    '3',
    'Gaming & Entertainment',
    'Which games should we play at our next community night?',
    7,
  ),
  createSurveyFixture(
    '4',
    'Health & Wellness',
    'Healthier future: Fit & wellness survey!',
    2,
    'Help us understand which health and wellness topics matter most to you and what could support a healthier everyday routine.',
    WELLNESS_QUESTIONS,
  ),
  createSurveyFixture(
    '5',
    'Health & Wellness',
    'Which wellness activities should we offer next?',
    9,
  ),
  createSurveyFixture('6', 'Team activities', 'Help us choose the next team-building activity', 12),
  createSurveyFixture(
    '7',
    'Workplace culture',
    'How do you feel about remote work?',
    -4,
    'This survey gathered feedback about remote-work routines, flexibility and the places where our team works best.',
    REMOTE_WORK_QUESTIONS,
  ),
  createSurveyFixture(
    '8',
    'Team activities',
    'Summer team event retrospective',
    -7,
    'Thank you for joining our summer event. These final results show what the team enjoyed and what we can improve next time.',
    SUMMER_EVENT_QUESTIONS,
  ),
  createSurveyFixture(
    '9',
    'Health & Wellness',
    'Weekly wellness check-in',
    -12,
    'This completed check-in reflects how the team felt during the week and which habits supported everyone’s well-being.',
    WELLNESS_CHECK_IN_QUESTIONS,
  ),
];

function createSurveyFixture(
  id: string,
  category: string,
  title: string,
  daysRemaining: number,
  description = '',
  questions: readonly SurveyQuestion[] = [],
): Survey {
  return {
    id,
    category,
    title,
    description,
    endDate: dateFromToday(daysRemaining),
    daysRemaining,
    status: daysRemaining >= 0 ? 'active' : 'past',
    questions,
  };
}

function dateFromToday(daysRemaining: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysRemaining);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
