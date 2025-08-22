import OpenAI from "openai";

export interface FormatterConfig {
	apiKey: string;
	enabled: boolean;
	prompt?: string;
}

export interface FormatResult {
	success: boolean;
	text?: string;
	error?: string;
}

export class FormatterService {
	private openai: OpenAI;
	private config: FormatterConfig;

	constructor(config: FormatterConfig) {
		this.config = {
			prompt: "Please format this transcribed text with proper grammar and punctuation. The text may be in French or English - preserve the original language:",
			...config,
		};

		this.openai = new OpenAI({
			apiKey: this.config.apiKey,
		});
	}

	/**
	 * Formats text using GPT
	 */
	public async formatText(text: string): Promise<FormatResult> {
		if (!this.config.enabled) {
			return { success: true, text };
		}

		if (!text || text.trim().length === 0) {
			return { success: false, error: "Text cannot be empty" };
		}

		try {
			const response = await this.openai.chat.completions.create({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "user",
						content: `${this.config.prompt}\n\n${text}`,
					},
				],
				temperature: 0.3,
				max_tokens: 1000,
			});

			const formattedText = response.choices[0]?.message?.content?.trim();

			if (!formattedText) {
				return { success: false, error: "No formatted text received" };
			}

			return { success: true, text: formattedText };
		} catch (error) {
			return {
				success: false,
				error: `Failed to format text: ${error}`,
			};
		}
	}
}
