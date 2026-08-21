import { AnonymousVoterToken } from './anonymous-voter-token';

const STORAGE_KEY = 'pollapp.anonymous-voter-token';
const EXISTING_TOKEN = '11111111-1111-4111-8111-111111111111';
const GENERATED_TOKEN = '22222222-2222-4222-8222-222222222222';

describe('AnonymousVoterToken', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reuses a valid token from browser storage', () => {
    localStorage.setItem(STORAGE_KEY, EXISTING_TOKEN);
    const randomUuid = vi.spyOn(crypto, 'randomUUID');

    expect(new AnonymousVoterToken().value).toBe(EXISTING_TOKEN);
    expect(randomUuid).not.toHaveBeenCalled();
  });

  it('generates and persists a token when none exists', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(GENERATED_TOKEN);

    const token = new AnonymousVoterToken();

    expect(token.value).toBe(GENERATED_TOKEN);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(GENERATED_TOKEN);
  });

  it('replaces an invalid stored token', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-uuid');
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(GENERATED_TOKEN);

    expect(new AnonymousVoterToken().value).toBe(GENERATED_TOKEN);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(GENERATED_TOKEN);
  });

  it('retains an application-lifetime token when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(GENERATED_TOKEN);

    const token = new AnonymousVoterToken();

    expect(token.value).toBe(GENERATED_TOKEN);
    expect(token.value).toBe(GENERATED_TOKEN);
  });
});
