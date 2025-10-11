import { createReadStream, existsSync, statSync } from "node:fs";
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
			apiKey: this.fasterWhisperAPIKey,
			baseURL: this.fasterWhisperURL,
		});
		// Note: For local deployment of Faster Whisper, we need to call POST http://localhost:8000/v1/models/{model_id} to load the model first
		// Model is Systran/faster-whisper-small
		const request = new Request(
			`${this.fasterWhisperURL}models/${this.fasterWhisperModel}`,
			{
				headers: {
					Authorization: `Bearer ${this.fasterWhisperAPIKey}`,
				},
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
			const fileSize = statSync(filePath).size;
			const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

			logger.debug(`Starting OpenAI transcription for file: ${filePath}`);
			logger.debug(`File size: ${fileSizeMB} MB (${fileSize} bytes)`);

			const audioFile = createReadStream(filePath);
			const startTime = Date.now();
			const uploadStartTime = Date.now();

			const response = await this.openai.audio.transcriptions.create({
				file: audioFile,
				model: "whisper-1",
				language: this.config.language,
				prompt: this.config.prompt,
			});

			const endTime = Date.now();
			const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

			// Estimation : ~80% du temps pour upload/traitement, reste pour réception
			const estimatedUploadTime = (
				((endTime - uploadStartTime) * 0.3) /
				1000
			).toFixed(2);
			const estimatedProcessingTime = (
				((endTime - uploadStartTime) * 0.6) /
				1000
			).toFixed(2);
			const estimatedReceiveTime = (
				((endTime - uploadStartTime) * 0.1) /
				1000
			).toFixed(2);

			if (!response.text || response.text.trim().length === 0) {
				return {
					success: false,
					error: "No transcription text received",
				};
			}

			logger.info(`OpenAI transcription completed in ${totalDuration}s`);
			logger.debug(
				`  └─ Estimated breakdown: upload ~${estimatedUploadTime}s, processing ~${estimatedProcessingTime}s, receive ~${estimatedReceiveTime}s`
			);
			logger.debug(
				`  └─ Transcription length: ${response.text.length} characters`
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
			const fileSize = statSync(filePath).size;
			const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

			logger.debug(
				`Starting Faster Whisper transcription for file: ${filePath}`
			);
			logger.debug(`File size: ${fileSizeMB} MB (${fileSize} bytes)`);

			const audioFile = createReadStream(filePath);
			const startTime = Date.now();
			const uploadStartTime = Date.now();

			const response =
				await this.fasterWhispper.audio.transcriptions.create({
					file: audioFile,
					model: this.fasterWhisperModel,
					language: this.config.language,
				});

			const endTime = Date.now();
			const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

			// Estimation : ~30% upload, ~60% processing, ~10% receive
			const estimatedUploadTime = (
				((endTime - uploadStartTime) * 0.3) /
				1000
			).toFixed(2);
			const estimatedProcessingTime = (
				((endTime - uploadStartTime) * 0.6) /
				1000
			).toFixed(2);
			const estimatedReceiveTime = (
				((endTime - uploadStartTime) * 0.1) /
				1000
			).toFixed(2);

			if (!response.text || response.text.trim().length === 0) {
				return {
					success: false,
					error: "No transcription text received",
				};
			}

			logger.info(
				`Faster Whisper transcription completed in ${totalDuration}s`
			);
			logger.debug(
				`  └─ Estimated breakdown: upload ~${estimatedUploadTime}s, processing ~${estimatedProcessingTime}s, receive ~${estimatedReceiveTime}s`
			);
			logger.debug(
				`  └─ Transcription length: ${response.text.length} characters`
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
