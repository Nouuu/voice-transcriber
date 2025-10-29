import { createReadStream, existsSync, statSync } from "node:fs";
import OpenAI from "openai";
import { logger } from "../utils/logger";

// Constants for timing estimation ratios
const UPLOAD_TIME_RATIO = 0.3;
const PROCESSING_TIME_RATIO = 0.6;
const RECEIVE_TIME_RATIO = 0.1;

export interface TranscriptionConfig {
	apiKey: string;
	language?: string;
	prompt?: string;
	backend: "openai" | "speaches";
	model: string;
	speachesUrl?: string;
}

export interface TranscriptionResult {
	success: boolean;
	text?: string;
	error?: string;
}

export class TranscriptionService {
	private openaiClient: OpenAI | null = null;
	private speachesClient: OpenAI | null = null;
	private speachesModelLoaded = false;
	private config: TranscriptionConfig;

	constructor(config: TranscriptionConfig) {
		this.config = { ...config };
	}

	/**
	 * Gets or creates the appropriate OpenAI client based on backend configuration
	 * Uses lazy initialization to avoid unnecessary setup
	 */
	private async getClient(
		backend: "openai" | "speaches"
	): Promise<
		{ success: true; client: OpenAI } | { success: false; error: string }
	> {
		if (backend === "openai") {
			if (!this.openaiClient) {
				this.openaiClient = new OpenAI({
					apiKey: this.config.apiKey,
				});
				logger.debug("OpenAI client initialized");
			}
			return { success: true, client: this.openaiClient };
		}

		// Speaches backend
		if (!this.speachesClient) {
			const initResult = await this.initializeSpeaches();
			if (!initResult.success) {
				return {
					success: false,
					error: initResult.error || "Unknown error",
				};
			}
		}

		if (!this.speachesClient) {
			return {
				success: false,
				error: "Speaches client failed to initialize",
			};
		}

		return { success: true, client: this.speachesClient };
	}

	/**
	 * Initializes Speaches client and preloads the model
	 */
	private async initializeSpeaches(): Promise<{
		success: boolean;
		error?: string;
	}> {
		if (!this.config.speachesUrl) {
			return { success: false, error: "Speaches URL not configured" };
		}

		this.speachesClient = new OpenAI({
			apiKey: this.config.apiKey,
			baseURL: this.config.speachesUrl,
		});

		logger.debug(
			`Speaches client initialized with URL: ${this.config.speachesUrl}`
		);

		// Preload the model - this is critical
		return await this.loadSpeachesModel();
	}

	/**
	 * Preloads the Speaches model for faster transcription
	 * This keeps the model in memory for zero-latency transcription
	 */
	private async loadSpeachesModel(): Promise<{
		success: boolean;
		error?: string;
	}> {
		if (!this.config.speachesUrl || !this.speachesClient) {
			return { success: false, error: "Speaches client not initialized" };
		}

		if (this.speachesModelLoaded) {
			return { success: true };
		}

		try {
			const baseUrl = this.config.speachesUrl;
			const modelPath = `/v1/models/${this.config.model}`;
			const modelUrl = new URL(modelPath, baseUrl).toString();
			logger.debug(`Preloading Speaches model: ${this.config.model}`);

			const response = await fetch(modelUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					success: false,
					error: `Failed to preload Speaches model: ${response.status} ${response.statusText} - ${errorText}`,
				};
			}

			this.speachesModelLoaded = true;
			logger.info(
				`Speaches model preloaded successfully: ${this.config.model}`
			);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: `Failed to preload Speaches model: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Transcribes audio file using the configured backend (OpenAI or Speaches)
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

			const backendName =
				this.config.backend === "openai" ? "OpenAI" : "Speaches";
			logger.debug(
				`Starting ${backendName} transcription for file: ${filePath}`
			);
			logger.debug(`File size: ${fileSizeMB} MB (${fileSize} bytes)`);
			logger.debug(`Model: ${this.config.model}`);

			const clientResult = await this.getClient(this.config.backend);
			if (!clientResult.success) {
				return {
					success: false,
					error: clientResult.error,
				};
			}

			const audioFile = createReadStream(filePath);
			const startTime = Date.now();

			const response =
				await clientResult.client.audio.transcriptions.create({
					file: audioFile,
					model: this.config.model,
					language: this.config.language,
					...(this.config.prompt &&
						this.config.backend === "openai" && {
							prompt: this.config.prompt,
						}),
				});

			const endTime = Date.now();
			const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

			// Estimation: ~30% upload, ~60% processing, ~10% receive
			const estimatedUploadTime = (
				((endTime - startTime) * UPLOAD_TIME_RATIO) /
				1000
			).toFixed(2);
			const estimatedProcessingTime = (
				((endTime - startTime) * PROCESSING_TIME_RATIO) /
				1000
			).toFixed(2);
			const estimatedReceiveTime = (
				((endTime - startTime) * RECEIVE_TIME_RATIO) /
				1000
			).toFixed(2);

			if (!response.text || response.text.trim().length === 0) {
				return {
					success: false,
					error: "No transcription text received",
				};
			}

			logger.info(
				`${backendName} transcription completed in ${totalDuration}s`
			);
			logger.debug(
				`  └─ Estimated breakdown: upload ~${estimatedUploadTime}s, processing ~${estimatedProcessingTime}s, receive ~${estimatedReceiveTime}s`
			);
			logger.debug(
				`  └─ Transcription length: ${response.text.length} characters`
			);

			// Log transcription text with the conditional rule
			logger.logConditional("Transcription text", response.text);

			return {
				success: true,
				text: response.text.trim(),
			};
		} catch (error) {
			const backendName =
				this.config.backend === "openai" ? "OpenAI" : "Speaches";
			return {
				success: false,
				error: `Failed to transcribe audio with ${backendName}: ${error}`,
			};
		}
	}

	/**
	 * Preload model at startup for faster first transcription
	 * Call this after creating the service if using Speaches backend or benchmark mode
	 */
	public async warmup(
		forceSpeaches = false
	): Promise<{ success: boolean; error?: string }> {
		// Preload Speaches if:
		// 1. Speaches is the configured backend, OR
		// 2. Caller explicitly requests it (e.g., benchmark mode)
		if (this.config.backend === "speaches" || forceSpeaches) {
			return await this.initializeSpeaches();
		}
		return { success: true };
	}

	// NOTE: utility functions for text differences and file cleanup are handled
	// in AudioProcessor; not needed here to avoid duplication.
}
