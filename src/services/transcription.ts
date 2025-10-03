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
		this.config = { ...config };

		this.openai = new OpenAI({
			apiKey: this.config.apiKey,
		});
	}

	/**
	 * Transcribes audio file using OpenAI Whisper API
	 * Uses language and prompt from config to prevent language switching
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
