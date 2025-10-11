#!/usr/bin/env node
import { Config } from "./config/config";
import { AudioRecorder } from "./services/audio-recorder";
import { ClipboardService } from "./services/clipboard";
import { FormatterService } from "./services/formatter";
import { SystemTrayService, TrayState } from "./services/system-tray";
import { TranscriptionService } from "./services/transcription";
import { logger, LogLevel } from "./utils/logger";

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
			// await this.processAudioFile(stopResult.filePath);
			logger.info("====================================");
			await this.processBothWhispers(stopResult.filePath);
			logger.info("====================================");
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
			logger.info(`Transcription result: ${finalText}`);

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

	private async processAudioFileFaster(filePath: string): Promise<void> {
		try {
			logger.info("Transcribing audio with Faster Whisper...");
			// Transcribe audio
			const transcriptionResult =
				await this.transcriptionService.transcribeFaster(filePath);
			if (!transcriptionResult.success || !transcriptionResult.text) {
				logger.error(
					`Transcription failed: ${transcriptionResult.error}`
				);
				await this.systemTrayService.setState(TrayState.IDLE);
				return;
			}

			const finalText = transcriptionResult.text;

			logger.info(`Transcription result: ${finalText}`);

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

	private async processBothWhispers(filePath: string): Promise<void> {
		try {
			logger.debug("====================================");
			logger.debug("🔬 BENCHMARK: Comparing both Whisper models");
			logger.debug("====================================");

			// Transcribe with OpenAI Whisper
			const startOpenAI = Date.now();
			const transcriptionResultOpenAI =
				await this.transcriptionService.transcribe(filePath);
			const durationOpenAI = ((Date.now() - startOpenAI) / 1000).toFixed(
				2
			);

			if (
				!transcriptionResultOpenAI.success ||
				!transcriptionResultOpenAI.text
			) {
				logger.error(
					`OpenAI Whisper transcription failed: ${transcriptionResultOpenAI.error}`
				);
				await this.systemTrayService.setState(TrayState.IDLE);
				return;
			}

			const finalTextOpenAI = transcriptionResultOpenAI.text;

			logger.debug("====================================");

			// Transcribe with Faster Whisper
			const startFaster = Date.now();
			const transcriptionResultFaster =
				await this.transcriptionService.transcribeFaster(filePath);
			const durationFaster = ((Date.now() - startFaster) / 1000).toFixed(
				2
			);

			if (
				!transcriptionResultFaster.success ||
				!transcriptionResultFaster.text
			) {
				logger.error(
					`Faster Whisper transcription failed: ${transcriptionResultFaster.error}`
				);
				await this.systemTrayService.setState(TrayState.IDLE);
				return;
			}

			const finalTextFaster = transcriptionResultFaster.text;

			// Comparison Analysis
			logger.debug("====================================");
			logger.debug("📊 COMPARISON RESULTS");
			logger.debug("====================================");

			// Performance comparison
			const speedupRatio = (
				parseFloat(durationOpenAI) / parseFloat(durationFaster)
			).toFixed(2);
			const timeDiff = (
				parseFloat(durationOpenAI) - parseFloat(durationFaster)
			).toFixed(2);

			logger.debug(`⏱️  Performance:`);
			logger.debug(`   OpenAI Whisper:   ${durationOpenAI}s`);
			logger.debug(`   Faster Whisper:   ${durationFaster}s`);
			logger.debug(
				`   Speedup:          ${speedupRatio}x ${parseFloat(timeDiff) > 0 ? "faster" : "slower"} (${Math.abs(parseFloat(timeDiff))}s difference)`
			);

			// Length comparison
			const lengthOpenAI = finalTextOpenAI.length;
			const lengthFaster = finalTextFaster.length;
			const lengthDiff = Math.abs(lengthOpenAI - lengthFaster);
			const lengthDiffPercent = (
				(lengthDiff / Math.max(lengthOpenAI, lengthFaster)) *
				100
			).toFixed(1);

			logger.debug(`\n📏 Text Length:`);
			logger.debug(`   OpenAI Whisper:   ${lengthOpenAI} chars`);
			logger.debug(`   Faster Whisper:   ${lengthFaster} chars`);
			logger.debug(
				`   Difference:       ${lengthDiff} chars (${lengthDiffPercent}%)`
			);

			// Word count comparison
			const wordsOpenAI = finalTextOpenAI.trim().split(/\s+/).length;
			const wordsFaster = finalTextFaster.trim().split(/\s+/).length;
			const wordsDiff = Math.abs(wordsOpenAI - wordsFaster);

			logger.debug(`\n📝 Word Count:`);
			logger.debug(`   OpenAI Whisper:   ${wordsOpenAI} words`);
			logger.debug(`   Faster Whisper:   ${wordsFaster} words`);
			logger.debug(`   Difference:       ${wordsDiff} words`);

			// Similarity analysis
			const similarity = this.calculateSimilarity(
				finalTextOpenAI,
				finalTextFaster
			);
			const similarityPercent = (similarity * 100).toFixed(1);

			logger.debug(`\n🎯 Similarity:`);
			logger.debug(`   Text similarity:  ${similarityPercent}% match`);

			// Show transcription results
			logger.debug(`\n📄 Transcription Results:`);
			logger.debug(`   OpenAI Whisper:`);
			logger.debug(`   "${finalTextOpenAI}"`);
			logger.debug(`\n   Faster Whisper:`);
			logger.debug(`   "${finalTextFaster}"`);

			// Show differences if texts are different
			if (finalTextOpenAI !== finalTextFaster) {
				logger.debug(`\n⚠️  Differences detected:`);
				this.logTextDifferences(finalTextOpenAI, finalTextFaster);
			} else {
				logger.debug(
					`\n✅ Perfect match! Both transcriptions are identical.`
				);
			}

			logger.debug("====================================");

			await this.systemTrayService.setState(TrayState.IDLE);
		} catch (error) {
			logger.error(`Processing error: ${error}`);
			await this.systemTrayService.setState(TrayState.IDLE);
		}
	}

	/**
	 * Calculate similarity between two strings using Levenshtein distance
	 */
	private calculateSimilarity(str1: string, str2: string): number {
		const longer = str1.length > str2.length ? str1 : str2;
		const shorter = str1.length > str2.length ? str2 : str1;

		if (longer.length === 0) return 1.0;

		const distance = this.levenshteinDistance(
			longer.toLowerCase(),
			shorter.toLowerCase()
		);
		return (longer.length - distance) / longer.length;
	}

	/**
	 * Calculate Levenshtein distance between two strings
	 */
	private levenshteinDistance(str1: string, str2: string): number {
		const matrix: number[][] = [];

		for (let i = 0; i <= str2.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= str1.length; j++) {
			if (matrix[0]) {
				matrix[0][j] = j;
			}
		}

		for (let i = 1; i <= str2.length; i++) {
			for (let j = 1; j <= str1.length; j++) {
				if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1]?.[j - 1] ?? 0;
				} else {
					matrix[i][j] = Math.min(
						(matrix[i - 1]?.[j - 1] ?? 0) + 1,
						(matrix[i]?.[j - 1] ?? 0) + 1,
						(matrix[i - 1]?.[j] ?? 0) + 1
					);
				}
			}
		}

		return matrix[str2.length]?.[str1.length] ?? 0;
	}

	/**
	 * Log differences between two texts
	 */
	private logTextDifferences(text1: string, text2: string): void {
		const words1 = text1.split(/\s+/);
		const words2 = text2.split(/\s+/);
		const maxWords = Math.max(words1.length, words2.length);

		let diffCount = 0;
		for (let i = 0; i < Math.min(10, maxWords); i++) {
			const word1 = words1[i] || "(missing)";
			const word2 = words2[i] || "(missing)";

			if (word1 !== word2) {
				diffCount++;
				logger.debug(`   Position ${i + 1}: "${word1}" vs "${word2}"`);
			}
		}

		if (diffCount === 0 && maxWords > 0) {
			logger.debug(
				`   First 10 words are identical, differences later in text`
			);
		}

		if (maxWords > 10) {
			logger.debug(
				`   ... (showing first 10 words only, ${maxWords} total)`
			);
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
