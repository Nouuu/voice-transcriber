import OpenAI from "openai";

import { logger } from "../utils/logger";

export interface FormatterConfig {
	apiKey: string;
	enabled: boolean;
	language: string;
	prompt: string;
}

export interface FormatResult {
	success: boolean;
	text?: string;
	error?: string;
}

export interface FormatOptions {
	promptOverride?: string;
}

export class FormatterService {
	private openai: OpenAI;
	private config: FormatterConfig;

	constructor(config: FormatterConfig) {
		this.config = { ...config };

		this.openai = new OpenAI({
			apiKey: this.config.apiKey,
		});
	}

	/**
	 * Formats text using GPT.
	 *
	 * Note: This method assumes the caller has already decided whether formatting
	 * should occur (i.e. checked runtime/config state). It will always attempt to
	 * format the provided text and return the formatted result or an error.
	 */
	public async formatText(
		text: string,
		options: FormatOptions = {}
	): Promise<FormatResult> {
		// Caller must check whether formatting is enabled (runtime/config).

		if (!text || text.trim().length === 0) {
			logger.error("Cannot format empty text");
			return { success: false, error: "Text cannot be empty" };
		}

		const promptToUse = options.promptOverride || this.config.prompt;

		logger.debug(`Formatting text (${text.length} chars)`);
		logger.debug(`Language: ${this.config.language}`);
		logger.debug(`Model: gpt-3.5-turbo`);

		try {
			const startTime = Date.now();

			const response = await this.openai.chat.completions.create({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "user",
						content: `${promptToUse}\n\n${text}`,
					},
				],
				temperature: 0.3,
				max_completion_tokens: 1000,
			});

			const duration = Date.now() - startTime;
			const formattedText = response.choices[0]?.message?.content?.trim();

			if (!formattedText) {
				logger.error("No formatted text received from GPT");
				return { success: false, error: "No formatted text received" };
			}

			logger.debug(`Formatting completed in ${duration}ms`);
			// Show full original and formatted strings (user requested full sentences in logs).
			// Note: this may produce long log lines for large texts.
			logger.debug(`Original: "${text}"`);
			logger.debug(`Formatted: "${formattedText}"`);

			return { success: true, text: formattedText };
		} catch (error) {
			logger.error(`Formatting failed: ${error}`);
			return {
				success: false,
				error: `Failed to format text: ${error}`,
			};
		}
	}
}
