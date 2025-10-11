#!/usr/bin/env node
import { Config } from "./config/config";
import { AudioRecorder } from "./services/audio-recorder";
import { AudioProcessor } from "./services/audio-processor";
import { ClipboardService } from "./services/clipboard";
import { FormatterService } from "./services/formatter";
import { SystemTrayService, TrayState } from "./services/system-tray";
import { TranscriptionService } from "./services/transcription";
import { logger, LogLevel } from "./utils/logger";

export class VoiceTranscriberApp {
	private config: Config;
	private audioRecorder: AudioRecorder;
	private audioProcessor: AudioProcessor;
	private transcriptionService: TranscriptionService;
	private formatterService: FormatterService;
	private clipboardService: ClipboardService;
	private systemTrayService: SystemTrayService;

	constructor(configPath?: string) {
		this.config = new Config(configPath);
		this.audioRecorder = new AudioRecorder();
		this.clipboardService = new ClipboardService();

		// These will be initialized after config loads
		this.audioProcessor = null as any;
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

			// Initialize transcription service with full config
			const transcriptionConfig = this.config.getTranscriptionConfig();
			this.transcriptionService = new TranscriptionService({
				apiKey: transcriptionConfig.apiKey,
				language: transcriptionConfig.language,
				prompt: transcriptionConfig.prompt,
				backend: transcriptionConfig.backend,
				model: transcriptionConfig.model,
				speachesUrl: transcriptionConfig.speachesUrl,
			});

			// Notify user about model preloading for Speaches
			// Preload Speaches model if needed (Speaches backend or Benchmark mode)
			if (
				transcriptionConfig.backend === "speaches" ||
				this.config.benchmarkMode
			) {
				logger.info(
					`⏳ Preloading Speaches model: ${transcriptionConfig.model}...`
				);
				const warmupResult = await this.transcriptionService.warmup(
					this.config.benchmarkMode
				);
				if (!warmupResult.success) {
					logger.warn(
						`⚠️  Failed to preload model: ${warmupResult.error}`
					);
					logger.warn("First transcription may be slower");
				}
			}

			const formatterConfig = this.config.getFormatterConfig();
			this.formatterService = new FormatterService({
				apiKey: formatterConfig.apiKey,
				enabled: formatterConfig.enabled,
				language: formatterConfig.language,
				prompt: formatterConfig.prompt,
			});

			// Initialize audio processor
			this.audioProcessor = new AudioProcessor({
				config: this.config,
				transcriptionService: this.transcriptionService,
				formatterService: this.formatterService,
				clipboardService: this.clipboardService,
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
			logger.info(
				`Transcription backend: ${transcriptionConfig.backend}`
			);
			logger.info(`Model: ${transcriptionConfig.model}`);
			if (this.config.benchmarkMode) {
				logger.info("🔬 Benchmark mode enabled");
			}
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

			// Use benchmark mode if enabled, otherwise use normal processing
			if (this.config.benchmarkMode) {
				await this.audioProcessor.processBenchmark(stopResult.filePath);
			} else {
				await this.audioProcessor.processAudioFile(stopResult.filePath);
			}

			await this.systemTrayService.setState(TrayState.IDLE);
		} catch (error) {
			logger.error(`Recording stop error: ${error}`);
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
	// Check for --debug flag
	const args = process.argv.slice(2);
	if (args.includes("--debug") || args.includes("-d")) {
		logger.setLogLevel(LogLevel.DEBUG);
		logger.info("Debug mode enabled");
	}

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
