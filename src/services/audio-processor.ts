import { existsSync, unlinkSync } from "node:fs";
import type { Config } from "../config/config";
import type { ClipboardService } from "./clipboard";
import type { FormatterService } from "./formatter";
import { TranscriptionService } from "./transcription";
import { logger } from "../utils/logger";
import {
	calculateSimilarity,
	findTextDifferences,
} from "../utils/text-similarity";

export interface AudioProcessorConfig {
	config: Config;
	transcriptionService: TranscriptionService;
	formatterService: FormatterService;
	clipboardService: ClipboardService;
}

export class AudioProcessor {
	private config: Config;
	private transcriptionService: TranscriptionService;
	private formatterService: FormatterService;
	private clipboardService: ClipboardService;

	constructor(options: AudioProcessorConfig) {
		this.config = options.config;
		this.transcriptionService = options.transcriptionService;
		this.formatterService = options.formatterService;
		this.clipboardService = options.clipboardService;
	}

	/**
	 * Process audio file: transcribe, format (optional), and copy to clipboard
	 */
	async processAudioFile(filePath: string): Promise<void> {
		try {
			logger.info("Transcribing audio...");

			// Transcribe audio using the configured backend
			const transcriptionResult =
				await this.transcriptionService.transcribe(filePath);
			if (!transcriptionResult.success || !transcriptionResult.text) {
				logger.error(
					`Transcription failed: ${transcriptionResult.error}`
				);
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

			// Delete MP3 file to save space
			this.cleanupAudioFile(filePath);
		} catch (error) {
			logger.error(`Processing error: ${error}`);
			throw error;
		}
	}

	/**
	 * Benchmark mode: compare OpenAI and Speaches backends side-by-side
	 */
	async processBenchmark(filePath: string): Promise<void> {
		try {
			logger.debug("====================================");
			logger.debug("🔬 BENCHMARK: Comparing OpenAI and Speaches");
			logger.debug("====================================");

			// Create two separate TranscriptionService instances for comparison
			const baseConfig = this.config.getTranscriptionConfig();

			// OpenAI service with explicit OpenAI API key
			const openaiService = new TranscriptionService({
				apiKey: this.config.openaiApiKey,
				language: baseConfig.language,
				prompt: baseConfig.prompt,
				backend: "openai",
				model: "whisper-1",
			});

			// Speaches service with explicit Speaches configuration
			const speachesService = new TranscriptionService({
				apiKey: this.config.speachesApiKey,
				language: baseConfig.language,
				prompt: baseConfig.prompt,
				backend: "speaches",
				model: this.config.speachesModel,
				speachesUrl: this.config.speachesUrl,
			});

			// Transcribe with OpenAI Whisper
			logger.debug("Starting OpenAI Whisper transcription...");
			const startOpenAI = Date.now();
			const transcriptionResultOpenAI =
				await openaiService.transcribe(filePath);
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
				return;
			}

			const finalTextOpenAI = transcriptionResultOpenAI.text;

			logger.debug("====================================");

			// Transcribe with Speaches
			logger.debug("Starting Speaches transcription...");
			const startSpeaches = Date.now();
			const transcriptionResultSpeaches =
				await speachesService.transcribe(filePath);
			const durationSpeaches = (
				(Date.now() - startSpeaches) /
				1000
			).toFixed(2);

			if (
				!transcriptionResultSpeaches.success ||
				!transcriptionResultSpeaches.text
			) {
				logger.error(
					`Speaches transcription failed: ${transcriptionResultSpeaches.error}`
				);
				return;
			}

			const finalTextSpeaches = transcriptionResultSpeaches.text;

			// Display comparison results
			this.displayBenchmarkResults(
				finalTextOpenAI,
				finalTextSpeaches,
				durationOpenAI,
				durationSpeaches
			);

			// Choose and copy the best result
			await this.copyBestResult(finalTextOpenAI, finalTextSpeaches);

			// Delete MP3 file to save space
			this.cleanupAudioFile(filePath);
		} catch (error) {
			logger.error(`Benchmark processing error: ${error}`);
			throw error;
		}
	}

	/**
	 * Display detailed benchmark comparison results
	 */
	private displayBenchmarkResults(
		textOpenAI: string,
		textSpeaches: string,
		durationOpenAI: string,
		durationSpeaches: string
	): void {
		logger.debug("====================================");
		logger.debug("📊 COMPARISON RESULTS");
		logger.debug("====================================");

		// Performance comparison
		const speedupRatio = (
			parseFloat(durationOpenAI) / parseFloat(durationSpeaches)
		).toFixed(2);
		const timeDiff = (
			parseFloat(durationOpenAI) - parseFloat(durationSpeaches)
		).toFixed(2);

		logger.debug(`⏱️  Performance:`);
		logger.debug(`   OpenAI Whisper:   ${durationOpenAI}s`);
		logger.debug(`   Speaches:         ${durationSpeaches}s`);
		logger.debug(
			`   Speedup:          ${speedupRatio}x ${parseFloat(timeDiff) > 0 ? "faster" : "slower"} (${Math.abs(parseFloat(timeDiff))}s difference)`
		);

		// Length comparison
		const lengthOpenAI = textOpenAI.length;
		const lengthSpeaches = textSpeaches.length;
		const lengthDiff = Math.abs(lengthOpenAI - lengthSpeaches);
		const lengthDiffPercent = (
			(lengthDiff / Math.max(lengthOpenAI, lengthSpeaches)) *
			100
		).toFixed(1);

		logger.debug(`\n📏 Text Length:`);
		logger.debug(`   OpenAI Whisper:   ${lengthOpenAI} chars`);
		logger.debug(`   Speaches:         ${lengthSpeaches} chars`);
		logger.debug(
			`   Difference:       ${lengthDiff} chars (${lengthDiffPercent}%)`
		);

		// Word count comparison
		const wordsOpenAI = textOpenAI.trim().split(/\s+/).length;
		const wordsSpeaches = textSpeaches.trim().split(/\s+/).length;
		const wordsDiff = Math.abs(wordsOpenAI - wordsSpeaches);

		logger.debug(`\n📝 Word Count:`);
		logger.debug(`   OpenAI Whisper:   ${wordsOpenAI} words`);
		logger.debug(`   Speaches:         ${wordsSpeaches} words`);
		logger.debug(`   Difference:       ${wordsDiff} words`);

		// Similarity analysis
		const similarity = calculateSimilarity(textOpenAI, textSpeaches);
		const similarityPercent = (similarity * 100).toFixed(1);

		logger.debug(`\n🎯 Similarity:`);
		logger.debug(`   Text similarity:  ${similarityPercent}% match`);

		// Show transcription results
		logger.debug(`\n📄 Transcription Results:`);
		logger.debug(`   OpenAI Whisper:`);
		logger.debug(`   "${textOpenAI}"`);
		logger.debug(`\n   Speaches:`);
		logger.debug(`   "${textSpeaches}"`);

		// Show differences if texts are different
		if (textOpenAI !== textSpeaches) {
			logger.debug(`\n⚠️  Differences detected:`);
			this.logTextDifferences(textOpenAI, textSpeaches);
		} else {
			logger.debug(
				`\n✅ Perfect match! Both transcriptions are identical.`
			);
		}

		logger.debug("====================================");
	}

	/**
	 * Choose and copy the best transcription result to clipboard
	 */
	private async copyBestResult(
		textOpenAI: string,
		textSpeaches: string
	): Promise<void> {
		// Choose the best result for clipboard (longer = more complete)
		const useSpeaches = textSpeaches.length >= textOpenAI.length;
		const finalText = useSpeaches ? textSpeaches : textOpenAI;
		const chosenBackend = useSpeaches ? "Speaches" : "OpenAI";

		logger.info(
			`📋 Copying to clipboard (${chosenBackend} result - ${finalText.length} chars)...`
		);
		const clipboardResult =
			await this.clipboardService.writeText(finalText);
		if (!clipboardResult.success) {
			logger.error(`Clipboard failed: ${clipboardResult.error}`);
		} else {
			logger.info(
				`✅ Text copied to clipboard successfully (${chosenBackend})`
			);
		}
	}

	/**
	 * Log word-level differences between two texts
	 */
	private logTextDifferences(text1: string, text2: string): void {
		const differences = findTextDifferences(text1, text2, 10);

		if (differences.length === 0) {
			const words1 = text1.split(/\s+/);
			const maxWords = Math.max(words1.length, text2.split(/\s+/).length);
			if (maxWords > 0) {
				logger.debug(
					`   First 10 words are identical, differences later in text`
				);
			}
		} else {
			differences.forEach(diff => {
				logger.debug(
					`   Position ${diff.position}: "${diff.word1}" vs "${diff.word2}"`
				);
			});
		}

		const totalWords = Math.max(
			text1.split(/\s+/).length,
			text2.split(/\s+/).length
		);
		if (totalWords > 10) {
			logger.debug(
				`   ... (showing first 10 words only, ${totalWords} total)`
			);
		}
	}

	/**
	 * Delete audio file to save disk space
	 */
	private cleanupAudioFile(filePath: string): void {
		if (existsSync(filePath)) {
			unlinkSync(filePath);
			logger.debug(`Deleted MP3 file: ${filePath}`);
		}
	}
}
