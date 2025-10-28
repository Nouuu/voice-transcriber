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
					onSaveAsDefault: async () => {
						await this.handleSaveAsDefault();
					},
					onOpenConfig: () => {
						this.handleOpenConfig();
					},
					onReload: async () => {
						await this.handleReload();
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

	private async handleSaveAsDefault(): Promise<void> {
		try {
			// Sync runtime state back to config before saving
			this.config.activePersonalities = [
				...this.runtimeState.activePersonalities,
			];

			// Save entire configuration to file
			await this.config.save();

			logger.info("✅ Configuration saved to file successfully");
			logger.info(`Config file: ${this.config.getConfigPath()}`);
			logger.info(
				`Active personalities saved: ${this.config.activePersonalities.length > 0 ? this.config.activePersonalities.join(", ") : "none"}`
			);
		} catch (error) {
			logger.error(`❌ Failed to save configuration: ${error}`);
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

	private logConfigChanges(old: {
		oldTranscriptionConfig: {
			apiKey: string;
			language: string;
			prompt: string;
			backend: "openai" | "speaches";
			model: string;
			speachesUrl?: string;
		};
		oldFormatterConfig: {
			apiKey: string;
			language: string;
			activePersonalities: string[];
			builtinPersonalities: Record<
				string,
				{ name: string; description?: string; prompt?: string | null }
			>;
			customPersonalities: Record<
				string,
				{ name: string; description?: string; prompt?: string | null }
			>;
			backend: "openai" | "ollama";
			model: string;
			ollamaUrl?: string;
			prompt?: string | null;
		};
		oldActivePersonalities: string[];
		oldCustomPersonalities: Record<
			string,
			{ name: string; description?: string; prompt?: string | null }
		>;
		oldSelectedPersonalities: string[];
		oldLanguage: string;
		oldBenchmarkMode: boolean;
	}): void {
		const newTranscriptionConfig = this.config.getTranscriptionConfig();
		const newFormatterConfig = this.config.getFormatterConfig();
		const newActivePersonalities = this.config.activePersonalities || [];
		const newCustomPersonalities = this.config.customPersonalities || {};
		const newSelectedPersonalities =
			this.config.selectedPersonalities || [];
		const newLanguage = this.config.language;
		const newBenchmarkMode = this.config.benchmarkMode;

		const changes: string[] = [];

		// Check transcription backend changes
		if (
			old.oldTranscriptionConfig.backend !==
			newTranscriptionConfig.backend
		) {
			changes.push(
				`Transcription backend: ${old.oldTranscriptionConfig.backend} → ${newTranscriptionConfig.backend}`
			);
		}

		// Check transcription model changes
		if (old.oldTranscriptionConfig.model !== newTranscriptionConfig.model) {
			changes.push(
				`Transcription model: ${old.oldTranscriptionConfig.model} → ${newTranscriptionConfig.model}`
			);
		}

		// Check language changes
		if (old.oldLanguage !== newLanguage) {
			changes.push(`Language: ${old.oldLanguage} → ${newLanguage}`);
		}

		// Check formatter backend changes
		if (old.oldFormatterConfig.backend !== newFormatterConfig.backend) {
			changes.push(
				`Formatter backend: ${old.oldFormatterConfig.backend} → ${newFormatterConfig.backend}`
			);
		}

		// Check formatter model changes
		if (old.oldFormatterConfig.model !== newFormatterConfig.model) {
			changes.push(
				`Formatter model: ${old.oldFormatterConfig.model} → ${newFormatterConfig.model}`
			);
		}

		// Check active personalities changes
		const oldActiveSet = new Set(old.oldActivePersonalities);
		const newActiveSet = new Set(newActivePersonalities);

		const activeAdded = newActivePersonalities.filter(
			p => !oldActiveSet.has(p)
		);
		const activeRemoved = old.oldActivePersonalities.filter(
			p => !newActiveSet.has(p)
		);

		if (activeAdded.length > 0 || activeRemoved.length > 0) {
			const oldStr =
				old.oldActivePersonalities.length > 0
					? old.oldActivePersonalities.join(", ")
					: "none";
			const newStr =
				newActivePersonalities.length > 0
					? newActivePersonalities.join(", ")
					: "none";
			changes.push(`Active personalities: ${oldStr} → ${newStr}`);
		}

		// Check custom personalities changes
		const oldCustomKeys = new Set(Object.keys(old.oldCustomPersonalities));
		const newCustomKeys = new Set(Object.keys(newCustomPersonalities));

		const customAdded = Array.from(newCustomKeys).filter(
			k => !oldCustomKeys.has(k)
		);
		const customRemoved = Array.from(oldCustomKeys).filter(
			k => !newCustomKeys.has(k)
		);
		const customModified: string[] = [];

		// Check for modified custom personalities
		for (const key of Array.from(oldCustomKeys)) {
			if (newCustomKeys.has(key)) {
				const oldP = old.oldCustomPersonalities[key];
				const newP = newCustomPersonalities[key];
				if (oldP && newP) {
					if (
						oldP.name !== newP.name ||
						oldP.description !== newP.description ||
						oldP.prompt !== newP.prompt
					) {
						customModified.push(key);
					}
				}
			}
		}

		if (customAdded.length > 0) {
			changes.push(
				`Custom personalities added: ${customAdded.join(", ")}`
			);
		}
		if (customRemoved.length > 0) {
			changes.push(
				`Custom personalities removed: ${customRemoved.join(", ")}`
			);
		}
		if (customModified.length > 0) {
			changes.push(
				`Custom personalities modified: ${customModified.join(", ")}`
			);
		}

		// Check selected personalities changes (menu visibility)
		const oldSelectedSet = new Set(old.oldSelectedPersonalities);
		const newSelectedSet = new Set(newSelectedPersonalities);

		const selectedAdded = newSelectedPersonalities.filter(
			p => !oldSelectedSet.has(p)
		);
		const selectedRemoved = old.oldSelectedPersonalities.filter(
			p => !newSelectedSet.has(p)
		);

		if (selectedAdded.length > 0 || selectedRemoved.length > 0) {
			if (selectedAdded.length > 0) {
				changes.push(
					`Selected personalities added to menu: ${selectedAdded.join(", ")}`
				);
			}
			if (selectedRemoved.length > 0) {
				changes.push(
					`Selected personalities removed from menu: ${selectedRemoved.join(", ")}`
				);
			}
		}

		// Check benchmark mode changes
		if (old.oldBenchmarkMode !== newBenchmarkMode) {
			changes.push(
				`Benchmark mode: ${old.oldBenchmarkMode} → ${newBenchmarkMode}`
			);
		}

		// Check API URL changes (Speaches)
		if (
			old.oldTranscriptionConfig.speachesUrl !==
			newTranscriptionConfig.speachesUrl
		) {
			changes.push(
				`Speaches URL: ${old.oldTranscriptionConfig.speachesUrl} → ${newTranscriptionConfig.speachesUrl}`
			);
		}

		// Check Ollama URL changes
		if (old.oldFormatterConfig.ollamaUrl !== newFormatterConfig.ollamaUrl) {
			changes.push(
				`Ollama URL: ${old.oldFormatterConfig.ollamaUrl} → ${newFormatterConfig.ollamaUrl}`
			);
		}

		// Log results
		if (changes.length > 0) {
			logger.debug("🔄 Configuration changes detected:");
			changes.forEach(change => {
				logger.debug(`  └─ ${change}`);
			});
		} else {
			logger.debug(
				"✓ No configuration changes detected (config file matches live state)"
			);
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
			const oldActivePersonalities = [
				...this.runtimeState.activePersonalities,
			];
			const oldCustomPersonalities = {
				...(this.config.customPersonalities || {}),
			};
			const oldSelectedPersonalities = [
				...(this.config.selectedPersonalities || []),
			];
			const oldLanguage = this.config.language;
			const oldBenchmarkMode = this.config.benchmarkMode;

			try {
				// 3. Reload config from file
				await this.config.load();

				// 3.1. Detect and log configuration changes in debug mode
				this.logConfigChanges({
					oldTranscriptionConfig,
					oldFormatterConfig,
					oldActivePersonalities,
					oldCustomPersonalities,
					oldSelectedPersonalities,
					oldLanguage,
					oldBenchmarkMode,
				});

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
			maxPromptLength: this.config.maxPromptLength,
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
