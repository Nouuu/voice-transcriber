import { createReadStream, existsSync } from "node:fs";
import OpenAI from "openai";
import { logger } from "../utils/logger.ts";

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
	private fasterWhispper: OpenAI;
	private readonly fasterWhisperURL = "http://localhost:8000/v1/";
	private readonly fasterWhisperModel = "Systran/faster-whisper-base";
	private config: TranscriptionConfig;

	constructor(config: TranscriptionConfig) {
		this.config = { ...config };

		this.openai = new OpenAI({
			apiKey: this.config.apiKey,
		});
		this.fasterWhispper = new OpenAI({
			apiKey: "none",
			baseURL: this.fasterWhisperURL,
		});
		// Note: For local deployment of Faster Whisper, we need to call POST http://localhost:8000/v1/models/{model_id} to load the model first
		// Model is Systran/faster-whisper-small
		const request = new Request(
			`${this.fasterWhisperURL}models/${this.fasterWhisperModel}`,
			{
				method: "POST",
			}
		);
		fetch(request).then(response => {
			if (!response.ok) {
				logger.error(
					`Failed to load Faster Whisper model: ${response.status} ${response.statusText}`
				);
			} else {
				logger.info("Faster Whisper model loaded successfully");
			}
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
			logger.info(`Starting OpenAI transcription for file: ${filePath}`);
			const audioFile = createReadStream(filePath);
			const startTime = Date.now();

			const response = await this.openai.audio.transcriptions.create({
				file: audioFile,
				model: "whisper-1",
				language: this.config.language,
				prompt: this.config.prompt,
			});

			if (!response.text || response.text.trim().length === 0) {
				return {
					success: false,
					error: "No transcription text received",
				};
			}

			const endTime = Date.now();
			const duration = ((endTime - startTime) / 1000).toFixed(2);
			logger.info(
				`OpenAI transcription completed in ${duration} seconds for file: ${filePath}`
			);

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

	public async transcribeFaster(
		filePath: string
	): Promise<TranscriptionResult> {
		if (!filePath || !existsSync(filePath)) {
			return {
				success: false,
				error: "Audio file does not exist",
			};
		}

		try {
			logger.info(
				`Starting Faster Whisper transcription for file: ${filePath}`
			);
			const audioFile = createReadStream(filePath);
			const startTime = Date.now();

			const response =
				await this.fasterWhispper.audio.transcriptions.create({
					file: audioFile,
					model: this.fasterWhisperModel,
					language: this.config.language,
				});

			if (!response.text || response.text.trim().length === 0) {
				return {
					success: false,
					error: "No transcription text received",
				};
			}

			const endTime = Date.now();
			const duration = ((endTime - startTime) / 1000).toFixed(2);
			logger.info(
				`Faster Whisper transcription completed in ${duration} seconds for file: ${filePath}`
			);

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
