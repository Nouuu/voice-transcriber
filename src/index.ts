#!/usr/bin/env node
import { Config } from "./config/config";
import { AudioRecorder } from "./services/audio-recorder";
import { ClipboardService } from "./services/clipboard";
import { FormatterService } from "./services/formatter";
import { SystemTrayService, TrayState } from "./services/system-tray";
import { TranscriptionService } from "./services/transcription";
import { logger } from "./utils/logger";

export class VoiceTranscriberApp {
	private config: Config;
	private audioRecorder: AudioRecorder;
	private transcriptionService: TranscriptionService;
	private formatterService: FormatterService;
	private clipboardService: ClipboardService;
	private systemTrayService: SystemTrayService;

	constructor(configPath?: string) {
		this.config = new Config(configPath);
		this.audioRecorder = new AudioRecorder();
		this.clipboardService = new ClipboardService();

		// These will be initialized after config loads
		this.transcriptionService = null as any;
		this.formatterService = null as any;
		this.systemTrayService = null as any;
	}

	public async initialize(): Promise<{ success: boolean; error?: string }> {
		try {
			// Load configuration
			await this.config.loadWithSetup();

			if (!this.config.openaiApiKey) {
				return {
					success: false,
					error: "OpenAI API key not configured. Please add it to config.json",
				};
			}

			// Initialize OpenAI services
			const transcriptionConfig = this.config.getTranscriptionConfig();
			this.transcriptionService = new TranscriptionService({
				apiKey: transcriptionConfig.apiKey,
				language: transcriptionConfig.language,
				prompt: transcriptionConfig.prompt,
			});

			const formatterConfig = this.config.getFormatterConfig();
			this.formatterService = new FormatterService({
				apiKey: formatterConfig.apiKey,
				enabled: formatterConfig.enabled,
				language: formatterConfig.language,
				prompt: formatterConfig.prompt,
			});

			// Initialize system tray
			this.systemTrayService = new SystemTrayService({
				callbacks: {
					onRecordingStart: () => this.handleRecordingStart(),
					onRecordingStop: () => this.handleRecordingStop(),
					onQuit: () => this.handleQuit(),
				},
			});

			const trayResult = await this.systemTrayService.initialize();
			if (!trayResult.success) {
				return {
					success: false,
					error: `System tray failed: ${trayResult.error}`,
				};
			}

			logger.info("Voice Transcriber initialized successfully");
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to initialize: ${error}` };
		}
	}

	private async handleRecordingStart(): Promise<void> {
		try {
			if (this.audioRecorder.isRecording()) {
				return;
			}

			logger.info("Starting recording...");
			await this.systemTrayService.setState(TrayState.RECORDING);

			const result = await this.audioRecorder.startRecording();
			if (!result.success) {
				logger.error(`Recording failed: ${result.error}`);
				await this.systemTrayService.setState(TrayState.IDLE);
			}
		} catch (error) {
			logger.error(`Recording start error: ${error}`);
			await this.systemTrayService.setState(TrayState.IDLE);
		}
	}

	private async handleRecordingStop(): Promise<void> {
		try {
			if (!this.audioRecorder.isRecording()) {
				return;
			}

			logger.info("Stopping recording...");
			await this.systemTrayService.setState(TrayState.PROCESSING);

			const stopResult = await this.audioRecorder.stopRecording();
			if (!stopResult.success || !stopResult.filePath) {
				logger.error(`Stop recording failed: ${stopResult.error}`);
				await this.systemTrayService.setState(TrayState.IDLE);
				return;
			}
			// Process the audio file
			await this.processAudioFile(stopResult.filePath);
		} catch (error) {
			logger.error(`Recording stop error: ${error}`);
			await this.systemTrayService.setState(TrayState.IDLE);
		}
	}

	private async processAudioFile(filePath: string): Promise<void> {
		try {
			logger.info("Transcribing audio...");

			// Transcribe audio
			const transcriptionResult =
				await this.transcriptionService.transcribe(filePath);
			if (!transcriptionResult.success || !transcriptionResult.text) {
				logger.error(
					`Transcription failed: ${transcriptionResult.error}`
				);
				await this.systemTrayService.setState(TrayState.IDLE);
				return;
			}

			let finalText = transcriptionResult.text;

			// Format text if enabled
			if (this.config.formatterEnabled) {
				logger.info("Formatting text...");
				const formatResult =
					await this.formatterService.formatText(finalText);
				if (formatResult.success && formatResult.text) {
					finalText = formatResult.text;
				}
			}

			// Copy to clipboard
			logger.info("Copying to clipboard...");
			const clipboardResult =
				await this.clipboardService.writeText(finalText);
			if (!clipboardResult.success) {
				logger.error(`Clipboard failed: ${clipboardResult.error}`);
			} else {
				logger.info("Text copied to clipboard successfully");
			}

			await this.systemTrayService.setState(TrayState.IDLE);
		} catch (error) {
			logger.error(`Processing error: ${error}`);
			await this.systemTrayService.setState(TrayState.IDLE);
		}
	}

	private async handleQuit(): Promise<void> {
		logger.info("Shutting down...");
		await this.shutdown();
		process.exit(0);
	}

	public async shutdown(): Promise<void> {
		try {
			if (this.audioRecorder.isRecording()) {
				await this.audioRecorder.stopRecording();
			}

			if (this.systemTrayService) {
				await this.systemTrayService.shutdown();
			}

			logger.info("Shutdown complete");
		} catch (error) {
			logger.error(`Shutdown error: ${error}`);
		}
	}
}

// Main entry point
async function main() {
	const app = new VoiceTranscriberApp();

	logger.info("Starting Voice Transcriber...");

	const result = await app.initialize();
	if (!result.success) {
		console.error(`Failed to start: ${result.error}`);
		logger.error(`Failed to start: ${result.error}`);
		process.exit(1);
	}

	logger.info("App started successfully. System tray should be visible.");
	logger.info("If you can't see the system tray icon:");
	logger.info("1. Check your system tray area");
	logger.info("2. Try right-clicking in the system tray area");
	logger.info("3. Your desktop environment might not show system tray icons");

	// Keep the process alive
	logger.info("App is running... Press Ctrl+C to exit");

	// Keep the process alive by preventing stdin from ending
	process.stdin.resume();

	// Handle graceful shutdown
	process.on("SIGINT", async () => {
		logger.info("Received SIGINT, shutting down...");
		await app.shutdown();
		process.exit(0);
	});

	process.on("SIGTERM", async () => {
		logger.info("Received SIGTERM, shutting down...");
		await app.shutdown();
		process.exit(0);
	});
}

// Start the application only if this is the main module
if (import.meta.main) {
	main().catch(error => {
		console.error("Application failed:", error);
		process.exit(1);
	});
}
