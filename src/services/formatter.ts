import OpenAI from "openai";

import { logger } from "../utils/logger";

export interface FormatterConfig {
	apiKey: string;
	enabled: boolean;
	language: string;
	prompt: string;
	personalities: Record<
		string,
		{ name: string; description?: string; prompt?: string | null }
	>;
	maxPromptLength?: number;
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
	 * Get the prompt for a specific personality.
	 * Falls back to the config prompt if personality not found.
	 */
	public getPersonalityPrompt(personality: string): string {
		const preset = this.config.personalities[personality];
		if (preset?.prompt) {
			logger.debug(`Using ${preset.name} personality prompt`);
			return preset.prompt;
		}
		logger.debug(
			`Personality '${personality}' not found or no prompt, using config prompt`
		);
		return this.config.prompt;
	}

	/**
	 * Build a composite prompt by concatenating multiple personality prompts.
	 * Respects the maxPromptLength limit if configured.
	 *
	 * @param personalities - Array of personality IDs to concatenate
	 * @returns Concatenated prompt string, or empty string if no personalities
	 */
	public buildCompositePrompt(personalities: string[]): string {
		if (!personalities || personalities.length === 0) {
			return "";
		}

		const prompts: string[] = [];
		let totalLength = 0;
		const separator = "\n\n---\n\n";
		const separatorLength = separator.length;
		const maxLength = this.config.maxPromptLength || 4000;

		for (const personality of personalities) {
			const prompt = this.getPersonalityPrompt(personality);
			if (!prompt || prompt.trim().length === 0) {
				continue;
			}

			// Calculate what the new total would be
			const promptLength = prompt.length;
			const newTotal =
				totalLength +
				(prompts.length > 0 ? separatorLength : 0) +
				promptLength;

			// If adding this prompt would exceed the limit, stop
			if (newTotal > maxLength) {
				logger.warn(
					`Prompt length limit reached (${maxLength} chars). ` +
						`Stopping at personality: ${personality}`
				);
				break;
			}

			prompts.push(prompt);
			totalLength = newTotal;
		}

		return prompts.join(separator);
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

			// Log original input and formatted output using central logger
			logger.logConditional("Original", text);
			logger.logConditional("Formatted", formattedText);

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
