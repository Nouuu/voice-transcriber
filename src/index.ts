#!/usr/bin/env node
import { spawn } from "child_process";
import { Config } from "./config/config";
import { AudioRecorder } from "./services/audio-recorder";
import { AudioProcessor } from "./services/audio-processor";
import { ClipboardService } from "./services/clipboard";
import { type FormatterConfig, FormatterService } from "./services/formatter";
import { SystemTrayService, TrayState } from "./services/system-tray";
import { TranscriptionService } from "./services/transcription";
import { logger, LogLevel } from "./utils/logger";

// Runtime state for quick actions (not persisted to config file)
interface RuntimeState {
	activePersonalities: string[]; // Multiple personalities can be active simultaneously
}

export class VoiceTranscriberApp {
	private config: Config;
	private audioRecorder: AudioRecorder;
	private audioProcessor!: AudioProcessor;
	private transcriptionService!: TranscriptionService;
	private formatterService!: FormatterService;
	private clipboardService: ClipboardService;
	private systemTrayService!: SystemTrayService;
	private runtimeState: RuntimeState;

	constructor(configPath?: string) {
		this.config = new Config(configPath);
		this.audioRecorder = new AudioRecorder();
		this.clipboardService = new ClipboardService();

		// Initialize runtime state (will be synced with config during load)
		this.runtimeState = {
			activePersonalities: [], // Will be loaded from config
		};

		// These will be initialized after config loads (definite assignment used)
	}

	public async initialize(): Promise<{ success: boolean; error?: string }> {
		try {
			// Load configuration
			await this.config.loadWithSetup();

			// Apply logger truncation threshold from config
			logger.setTruncateThreshold(this.config.logTruncateThreshold);

			// Sync runtime state with config
			const formatterConfig = this.config.getFormatterConfig();
			// Initialize with personalities that are enabled by default in config
			this.runtimeState.activePersonalities =
				formatterConfig.activePersonalities || [];

			// Initialize transcription service with full config
			const transcriptionConfig = this.config.getTranscriptionConfig();

			// Validate API key for the selected backend
			if (!transcriptionConfig.apiKey) {
				return {
					success: false,
					error: `API key not configured for ${transcriptionConfig.backend} backend. Please add it to config.json`,
				};
			}

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

			// Initialize FormatterService (map config.getFormatterConfig() -> FormatterConfig)
			this.formatterService = new FormatterService(
				this.buildFormatterConfig(
					formatterConfig,
					transcriptionConfig.prompt
				)
			);

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
					onRecordingStart: () => {
						void this.handleRecordingStart();
					},
					onRecordingStop: () => {
						void this.handleRecordingStop();
					},
					onPersonalityToggle: (personality: string) => {
						this.handlePersonalityToggle(personality);
					},
					onOpenConfig: () => {
						this.handleOpenConfig();
					},
					onReload: () => {
						void this.handleReload();
					},
					onQuit: () => {
						void this.handleQuit();
					},
				},
				activePersonalities: this.runtimeState.activePersonalities,
				selectedPersonalities: this.config.selectedPersonalities,
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
				// Use the runtime state exposed by the system tray service (authoritative source)
				const runtime = this.systemTrayService.getRuntimeState();
				await this.audioProcessor.processAudioFile(
					stopResult.filePath,
					runtime.activePersonalities
				);
			}

			await this.systemTrayService.setState(TrayState.IDLE);
		} catch (error) {
			logger.error(`Recording stop error: ${error}`);
			await this.systemTrayService.setState(TrayState.IDLE);
		}
	}

	private handlePersonalityToggle(personality: string): void {
		try {
			// Toggle personality in active list
			const index =
				this.runtimeState.activePersonalities.indexOf(personality);
			if (index === -1) {
				// Add personality
				this.runtimeState.activePersonalities.push(personality);
				logger.info(`Personality activated: ${personality}`);
			} else {
				// Remove personality
				this.runtimeState.activePersonalities.splice(index, 1);
				logger.info(`Personality deactivated: ${personality}`);
			}

			// Update system tray to reflect new state
			this.systemTrayService.updateActivePersonalities(
				this.runtimeState.activePersonalities
			);

			logger.info(
				`Active personalities: ${this.runtimeState.activePersonalities.length > 0 ? this.runtimeState.activePersonalities.join(", ") : "none (formatter disabled)"}`
			);
		} catch (error) {
			logger.error(`Failed to toggle personality: ${error}`);
		}
	}

	private handleOpenConfig(): void {
		try {
			const configPath = this.config.getConfigPath();
			logger.info(`Opening config file: ${configPath}`);

			const child = spawn("xdg-open", [configPath], {
				detached: true,
				stdio: "ignore",
			});
			child.unref();
		} catch (error) {
			logger.error(`Failed to open config file: ${error}`);
		}
	}

	private async handleReload(): Promise<void> {
		try {
			// 1. Validate state - cannot reload during recording or processing
			if (this.audioRecorder.isRecording()) {
				logger.warn("Cannot reload configuration while recording");
				return;
			}

			if (this.systemTrayService) {
				const currentState = this.systemTrayService.getState();
				if (currentState !== TrayState.IDLE) {
					logger.warn(
						`Cannot reload configuration in ${currentState} state`
					);
					return;
				}
			}

			logger.info("Reloading configuration...");

			// 2. Backup current config values in case of failure
			const oldTranscriptionConfig = this.config.getTranscriptionConfig();
			const oldFormatterConfig = this.config.getFormatterConfig();

			try {
				// 3. Reload config from file
				await this.config.load();

				// 4. Validate new config
				const transcriptionConfig =
					this.config.getTranscriptionConfig();
				if (!transcriptionConfig.apiKey) {
					throw new Error(
						`API key not configured for ${transcriptionConfig.backend} backend`
					);
				}

				// 5. Reinitialize services with new config
				this.transcriptionService = new TranscriptionService({
					apiKey: transcriptionConfig.apiKey,
					language: transcriptionConfig.language,
					prompt: transcriptionConfig.prompt,
					backend: transcriptionConfig.backend,
					model: transcriptionConfig.model,
					speachesUrl: transcriptionConfig.speachesUrl,
				});

				const formatterConfig = this.config.getFormatterConfig();
				this.formatterService = new FormatterService(
					this.buildFormatterConfig(
						formatterConfig,
						transcriptionConfig.prompt
					)
				);

				this.audioProcessor = new AudioProcessor({
					config: this.config,
					transcriptionService: this.transcriptionService,
					formatterService: this.formatterService,
					clipboardService: this.clipboardService,
				});

				// 6. Preload model if needed
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
					}
				}

				logger.info("✅ Configuration reloaded successfully");
				logger.info(
					`Transcription backend: ${transcriptionConfig.backend}`
				);
				logger.info(`Model: ${transcriptionConfig.model}`);
				if (this.config.benchmarkMode) {
					logger.info("🔬 Benchmark mode enabled");
				}

				// Sync runtime state with reloaded config (formatterConfig already declared above)
				this.runtimeState.activePersonalities =
					formatterConfig.activePersonalities || [];
				this.systemTrayService.updateActivePersonalities(
					this.runtimeState.activePersonalities
				);
			} catch (error) {
				// 7. Rollback on failure - restore old services
				logger.error(`Failed to reload configuration: ${error}`);
				logger.info("Rolling back to previous configuration...");

				this.transcriptionService = new TranscriptionService({
					apiKey: oldTranscriptionConfig.apiKey,
					language: oldTranscriptionConfig.language,
					prompt: oldTranscriptionConfig.prompt,
					backend: oldTranscriptionConfig.backend,
					model: oldTranscriptionConfig.model,
					speachesUrl: oldTranscriptionConfig.speachesUrl,
				});

				this.formatterService = new FormatterService(
					this.buildFormatterConfig(
						oldFormatterConfig,
						oldTranscriptionConfig.prompt
					)
				);

				this.audioProcessor = new AudioProcessor({
					config: this.config,
					transcriptionService: this.transcriptionService,
					formatterService: this.formatterService,
					clipboardService: this.clipboardService,
				});

				logger.info("Previous configuration restored");
				throw error;
			}
		} catch (error) {
			logger.error(`Reload error: ${error}`);
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

	/**
	 * Convert Config.getFormatterConfig() output into the FormatterService expected config shape.
	 */
	private buildFormatterConfig(
		cfg: ReturnType<Config["getFormatterConfig"]>,
		transcriptionPrompt?: string
	): FormatterConfig {
		// Compose personalities map with keys matching runtime ids (builtin:<key> / custom:<id>)
		const personalities: Record<
			string,
			{ name: string; description?: string; prompt?: string | null }
		> = {};

		const builtin = cfg.builtinPersonalities;
		for (const k of Object.keys(builtin)) {
			const p = builtin[k];
			if (p) {
				personalities[`builtin:${k}`] = {
					name: p.name,
					description: p.description,
					prompt: p.prompt ?? null,
				};
			}
		}

		const custom = cfg.customPersonalities;
		for (const k of Object.keys(custom)) {
			const p = custom[k];
			if (p) {
				personalities[`custom:${k}`] = {
					name: p.name || k,
					description: p.description,
					prompt: p.prompt ?? null,
				};
			}
		}

		return {
			apiKey: cfg.apiKey || "",
			enabled: true,
			language: cfg.language || this.config.language,
			prompt: cfg.prompt ?? transcriptionPrompt ?? "",
			personalities,
		};
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
	process.on("SIGINT", () => {
		void (async () => {
			logger.info("Received SIGINT, shutting down...");
			await app.shutdown();
			process.exit(0);
		})();
	});

	process.on("SIGTERM", () => {
		void (async () => {
			logger.info("Received SIGTERM, shutting down...");
			await app.shutdown();
			process.exit(0);
		})();
	});
}

// Start the application only if this is the main module
if (import.meta.main) {
	main().catch(error => {
		console.error("Application failed:", error);
		process.exit(1);
	});
}
