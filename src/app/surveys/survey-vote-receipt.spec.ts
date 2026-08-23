import { SurveyVoteReceipt } from './survey-vote-receipt';

describe('SurveyVoteReceipt', () => {
  afterEach(() => {
    localStorage.removeItem('pollapp.completed-survey-ids');
    vi.restoreAllMocks();
  });

  it('persists and restores completed survey IDs', () => {
    const receipt = new SurveyVoteReceipt();

    expect(receipt.has('survey-1')).toBe(false);

    receipt.record('survey-1');
    receipt.record('survey-1');

    expect(receipt.has('survey-1')).toBe(true);
    expect(new SurveyVoteReceipt().has('survey-1')).toBe(true);
    expect(JSON.parse(localStorage.getItem('pollapp.completed-survey-ids') ?? '[]')).toEqual([
      'survey-1',
    ]);
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('pollapp.completed-survey-ids', '{invalid');

    expect(new SurveyVoteReceipt().has('survey-1')).toBe(false);
  });

  it('keeps an application-lifetime receipt when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const receipt = new SurveyVoteReceipt();
    receipt.record('survey-1');

    expect(receipt.has('survey-1')).toBe(true);
  });
});
