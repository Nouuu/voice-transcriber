import { createReadStream, existsSync } from "node:fs";
import OpenAI from "openai";

export interface TranscriptionConfig {
	apiKey: string;
	language?: string;
	prompt?: string;
}

export interface TranscriptionResult {
	success: boolean;
	text?: string;
	error?: string;
}

export class TranscriptionService {
	private openai: OpenAI;
	private config: TranscriptionConfig;

	constructor(config: TranscriptionConfig) {
		this.config = {
			// No language specified = auto-detect (supports French, English, and others)
			// prompt: "Please transcribe this audio exactly as spoken, preserving the spoken language. The speaker may mix and speak mainly French but also English for technical termes in the same sentence. Keep technical terms in their original language (English), but preserve French sentence structure and grammar. Do not translate between languages.",
			...config,
		};

		this.openai = new OpenAI({
			apiKey: this.config.apiKey,
		});
	}

	/**
	 * Transcribes audio file using Whisper (auto-detects French/English)
	 */
	public async transcribe(filePath: string): Promise<TranscriptionResult> {
		if (!filePath || !existsSync(filePath)) {
			return {
				success: false,
				error: "Audio file does not exist",
			};
		}

		try {
			const audioFile = createReadStream(filePath);

			const response = await this.openai.audio.transcriptions.create({
				file: audioFile,
				model: "whisper-1",
				// Omitting language lets Whisper auto-detect French/English/etc.
				language: this.config.language,
				prompt: this.config.prompt,
			});

			if (!response.text || response.text.trim().length === 0) {
				return {
					success: false,
					error: "No transcription text received",
				};
			}

			return {
				success: true,
				text: response.text.trim(),
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to transcribe audio: ${error}`,
			};
		}
	}
}
