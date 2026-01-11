// Different LLMConfig type for this file - specific to LLM providers
import { MAX_OUTPUT_TOKENS } from '@/constants';

import { getProxyAgent } from './utils/http-proxy-agent';

interface LLMProviderConfig {
	apiKey: string;
	baseUrl?: string;
	headers?: Record<string, string>;
}

export const o4mini = async (config: LLMProviderConfig) => {
	const { ChatOpenAI } = await import('@langchain/openai');
	return new ChatOpenAI({
		model: 'gpt-4o-mini',
		apiKey: config.apiKey,
		configuration: {
			baseURL: config.baseUrl,
			defaultHeaders: config.headers,
			fetchOptions: {
				dispatcher: getProxyAgent(config.baseUrl ?? 'https://api.openai.com/v1'),
			},
		},
	});
};

export const gpt41mini = async (config: LLMProviderConfig) => {
	const { ChatOpenAI } = await import('@langchain/openai');
	return new ChatOpenAI({
		model: 'gpt-4o-mini',
		apiKey: config.apiKey,
		temperature: 0,
		maxTokens: -1,
		configuration: {
			baseURL: config.baseUrl,
			defaultHeaders: config.headers,
			fetchOptions: {
				dispatcher: getProxyAgent(config.baseUrl ?? 'https://api.openai.com/v1'),
			},
		},
	});
};

export const gpt41 = async (config: LLMProviderConfig) => {
	const { ChatOpenAI } = await import('@langchain/openai');
	return new ChatOpenAI({
		model: 'gpt-4o',
		apiKey: config.apiKey,
		temperature: 0.3,
		maxTokens: -1,
		configuration: {
			baseURL: config.baseUrl,
			defaultHeaders: config.headers,
			fetchOptions: {
				dispatcher: getProxyAgent(config.baseUrl ?? 'https://api.openai.com/v1'),
			},
		},
	});
};

export const anthropicClaudeSonnet45 = async (config: LLMProviderConfig) => {
	const { ChatAnthropic } = await import('@langchain/anthropic');
	const model = new ChatAnthropic({
		model: 'claude-3-5-sonnet-20241022',
		apiKey: config.apiKey,
		temperature: 0,
		maxTokens: MAX_OUTPUT_TOKENS,
		anthropicApiUrl: config.baseUrl,
		clientOptions: {
			defaultHeaders: config.headers,
			fetchOptions: {
				dispatcher: getProxyAgent(config.baseUrl),
			},
		},
	});

	// Remove Langchain default topP parameter since Sonnet 3.5 doesn't allow setting both temperature and topP
	delete model.topP;

	return model;
};

export const anthropicHaiku45 = async (config: LLMProviderConfig) => {
	const { ChatAnthropic } = await import('@langchain/anthropic');
	const model = new ChatAnthropic({
		model: 'claude-3-5-haiku-20241022',
		apiKey: config.apiKey,
		temperature: 0,
		maxTokens: MAX_OUTPUT_TOKENS,
		anthropicApiUrl: config.baseUrl,
		clientOptions: {
			defaultHeaders: config.headers,
			fetchOptions: {
				dispatcher: getProxyAgent(config.baseUrl),
			},
		},
	});

	// Remove Langchain default topP parameter since Sonnet 3.5 doesn't allow setting both temperature and topP
	delete model.topP;

	return model;
};

export const anthropicOpus45Thinking = async (config: LLMProviderConfig) => {
	const { ChatAnthropic } = await import('@langchain/anthropic');

	// Opus 4.5 with Extended Thinking support
	// Extended thinking requires temperature=1 and special beta header
	const model = new ChatAnthropic({
		model: 'claude-opus-4-5-20251101',
		apiKey: config.apiKey,
		temperature: 1, // Required for extended thinking
		maxTokens: MAX_OUTPUT_TOKENS,
		anthropicApiUrl: config.baseUrl,
		clientOptions: {
			defaultHeaders: {
				...config.headers,
				// Enable extended thinking beta feature
				// eslint-disable-next-line @typescript-eslint/naming-convention
				'anthropic-beta': 'thinking-2025-04-30,prompt-caching-2024-07-31',
			},
			fetchOptions: {
				dispatcher: getProxyAgent(config.baseUrl),
			},
		},
		// Extended thinking configuration
		thinking: {
			type: 'enabled',
			budget_tokens: 10000, // Budget for thinking tokens
		},
	});

	// Remove Langchain default topP parameter
	delete model.topP;

	return model;
};
