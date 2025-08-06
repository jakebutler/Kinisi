import { fetchPromptFromRegistry } from '../../../utils/promptlayer';

// Mock global fetch
const globalAny: any = global;
const OLD_ENV = process.env;
let promptlayerModule: typeof import('../../../utils/promptlayer');

describe('fetchPromptFromRegistry', () => {
  const PROMPT_ID = 80123;
  const PROMPT_NAME = 'Personalized Assessment';
  const PROMPT_TEMPLATE = 'Prompt template text';
  const API_URL = 'https://api.promptlayer.com/rest/get-prompt-template';

  beforeEach(async () => {
    jest.resetModules();
    // Re-import the module to clear the cache between tests
    promptlayerModule = await import('../../../utils/promptlayer');
    // Clear the internal prompt cache
    const cache = (promptlayerModule as any).PROMPT_CACHE;
    if (cache) {
      Object.keys(cache).forEach(key => delete cache[key]);
    }
    globalAny.fetch = jest.fn();
    process.env = { ...OLD_ENV, PROMPTLAYER_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  it('fetches prompt successfully from PromptLayer', async () => {
    (globalAny.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        prompt_template: {
          messages: [
            { prompt: { template: PROMPT_TEMPLATE } }
          ]
        }
      })
    });
    const result = await promptlayerModule.fetchPromptFromRegistry(PROMPT_ID);
    expect(result).toBe(PROMPT_TEMPLATE);
    expect(globalAny.fetch).toHaveBeenCalledWith(API_URL, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'X-API-KEY': 'test-key' }),
      body: JSON.stringify({ prompt_name: PROMPT_NAME })
    }));
  });

  it('throws if PROMPTLAYER_API_KEY is missing', async () => {
    process.env = { ...OLD_ENV };
    await expect(promptlayerModule.fetchPromptFromRegistry(PROMPT_ID)).rejects.toThrow('PROMPTLAYER_API_KEY environment variable is not set');
  });

  it('throws if prompt ID is unknown', async () => {
    await expect(promptlayerModule.fetchPromptFromRegistry(999999)).rejects.toThrow('Unknown prompt ID');
  });

  it('throws if API returns an error', async () => {
    (globalAny.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found'
    });
    await expect(promptlayerModule.fetchPromptFromRegistry(PROMPT_ID)).rejects.toThrow("Failed to fetch prompt template 'Personalized Assessment' from PromptLayer: 404 Not Found");
  });

  it('throws if response is missing template content', async () => {
    (globalAny.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ prompt_template: { messages: [{}] } })
    });
    await expect(promptlayerModule.fetchPromptFromRegistry(PROMPT_ID)).rejects.toThrow('No content found in prompt template');
  });

  it('returns cached result if available and not expired', async () => {
    // Prime the cache
    (globalAny.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        prompt_template: {
          messages: [
            { prompt: { template: PROMPT_TEMPLATE } }
          ]
        }
      })
    });
    const first = await promptlayerModule.fetchPromptFromRegistry(PROMPT_ID);
    expect(first).toBe(PROMPT_TEMPLATE);
    // Should not call fetch again
    (globalAny.fetch as jest.Mock).mockImplementation(() => { throw new Error('Should not fetch again'); });
    const second = await promptlayerModule.fetchPromptFromRegistry(PROMPT_ID);
    expect(second).toBe(PROMPT_TEMPLATE);
  });
});
