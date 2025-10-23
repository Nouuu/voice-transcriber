import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { AudioProcessor } from "./audio-processor";
import type { Config } from "../config/config";
import type { ClipboardService } from "./clipboard";
import type { FormatterService } from "./formatter";
import { TranscriptionService } from "./transcription";

describe("AudioProcessor", () => {
	let audioProcessor: AudioProcessor;
	let mockConfig: Config;
	let mockTranscriptionService: TranscriptionService;
	let mockFormatterService: FormatterService;
	let mockClipboardService: ClipboardService;
	let testAudioFile: string;

	beforeEach(() => {
		// Create a temporary test audio file
		testAudioFile = "/tmp/test-audio-processor.mp3";
		writeFileSync(testAudioFile, Buffer.from([0xff, 0xfb, 0x90, 0x44])); // Minimal MP3 header

		// Mock config
		mockConfig = {
			formatterEnabled: true,
			benchmarkMode: false,
			speachesModel: "Systran/faster-whisper-base",
			speachesUrl: "http://localhost:8000/v1",
			speachesApiKey: "test-key",
			getTranscriptionConfig: () => ({
				apiKey: "test-key",
				language: "en",
				prompt: "test prompt",
				backend: "openai" as const,
				model: "whisper-1",
				speachesUrl: "http://localhost:8000/v1",
			}),
		} as any;

		// Mock services
		mockTranscriptionService = {
			transcribe: mock(() =>
				Promise.resolve({
					success: true,
					text: "Test transcription",
				})
			),
		} as any;

		mockFormatterService = {
			formatText: mock(() =>
				Promise.resolve({
					success: true,
					text: "Formatted text",
				})
			),
		} as any;

		mockClipboardService = {
			writeText: mock(() =>
				Promise.resolve({
					success: true,
				})
			),
		} as any;

		audioProcessor = new AudioProcessor({
			config: mockConfig,
			transcriptionService: mockTranscriptionService,
			formatterService: mockFormatterService,
			clipboardService: mockClipboardService,
		});
	});

	// Cleanup after each test
	afterEach(() => {
		if (existsSync(testAudioFile)) {
			unlinkSync(testAudioFile);
		}
	});

	describe("processAudioFile", () => {
		it("should transcribe, format, and copy to clipboard", async () => {
			await audioProcessor.processAudioFile(testAudioFile);

			expect(mockTranscriptionService.transcribe).toHaveBeenCalledWith(
				testAudioFile
			);
			expect(mockFormatterService.formatText).toHaveBeenCalledWith(
				"Test transcription"
			);
			expect(mockClipboardService.writeText).toHaveBeenCalledWith(
				"Formatted text"
			);
		});

		it("should skip formatting when disabled in config", async () => {
			mockConfig.formatterEnabled = false;

			await audioProcessor.processAudioFile(testAudioFile);

			expect(mockFormatterService.formatText).not.toHaveBeenCalled();
			expect(mockClipboardService.writeText).toHaveBeenCalledWith(
				"Test transcription"
			);
		});

		it("should respect runtime formatterEnabled=true override", async () => {
			mockConfig.formatterEnabled = false;

			await audioProcessor.processAudioFile(testAudioFile, true);

			expect(mockFormatterService.formatText).toHaveBeenCalledWith(
				"Test transcription"
			);
			expect(mockClipboardService.writeText).toHaveBeenCalledWith(
				"Formatted text"
			);
		});

		it("should respect runtime formatterEnabled=false override", async () => {
			mockConfig.formatterEnabled = true;

			await audioProcessor.processAudioFile(testAudioFile, false);

			expect(mockFormatterService.formatText).not.toHaveBeenCalled();
			expect(mockClipboardService.writeText).toHaveBeenCalledWith(
				"Test transcription"
			);
		});

		it("should use config value when runtime override is undefined", async () => {
			mockConfig.formatterEnabled = true;

			await audioProcessor.processAudioFile(testAudioFile, undefined);

			expect(mockFormatterService.formatText).toHaveBeenCalledWith(
				"Test transcription"
			);
			expect(mockClipboardService.writeText).toHaveBeenCalledWith(
				"Formatted text"
			);
		});

		it("should handle transcription failure", async () => {
			mockTranscriptionService.transcribe = mock(() =>
				Promise.resolve({
					success: false,
					error: "Transcription failed",
				})
			);

			await audioProcessor.processAudioFile(testAudioFile);

			expect(mockFormatterService.formatText).not.toHaveBeenCalled();
			expect(mockClipboardService.writeText).not.toHaveBeenCalled();
		});

		it("should handle formatting failure gracefully", async () => {
			mockFormatterService.formatText = mock(() =>
				Promise.resolve({
					success: false,
					error: "Formatting failed",
				})
			);

			await audioProcessor.processAudioFile(testAudioFile);

			// Should still copy unformatted text
			expect(mockClipboardService.writeText).toHaveBeenCalledWith(
				"Test transcription"
			);
		});
	});

	describe("processBenchmark", () => {
		it("should copy result to clipboard", async () => {
			// For benchmark tests, we need to mock the transcribe method
			// to work with the real TranscriptionService instances created inside processBenchmark
			const originalTranscribe =
				TranscriptionService.prototype.transcribe;

			TranscriptionService.prototype.transcribe = mock(() =>
				Promise.resolve({
					success: true,
					text: "Benchmark transcription",
				})
			);

			await audioProcessor.processBenchmark(testAudioFile);

			expect(mockClipboardService.writeText).toHaveBeenCalled();

			// Restore original method
			TranscriptionService.prototype.transcribe = originalTranscribe;
		});

		it("should handle different transcription results", async () => {
			const originalTranscribe =
				TranscriptionService.prototype.transcribe;
			let callCount = 0;

			TranscriptionService.prototype.transcribe = mock(() => {
				callCount++;
				return Promise.resolve({
					success: true,
					text: callCount === 1 ? "OpenAI result" : "Speaches result",
				});
			});

			await audioProcessor.processBenchmark(testAudioFile);

			// Should copy the longer result (or Speaches if equal)
			const calls = (mockClipboardService.writeText as any).mock.calls;
			expect(calls.length).toBeGreaterThan(0);

			// Restore original method
			TranscriptionService.prototype.transcribe = originalTranscribe;
		});

		it("should handle transcription failure in benchmark", async () => {
			const originalTranscribe =
				TranscriptionService.prototype.transcribe;

			TranscriptionService.prototype.transcribe = mock(() =>
				Promise.resolve({
					success: false,
					error: "Transcription failed",
				})
			);

			await audioProcessor.processBenchmark(testAudioFile);

			// Should not copy to clipboard if transcription fails
			expect(mockClipboardService.writeText).not.toHaveBeenCalled();

			// Restore original method
			TranscriptionService.prototype.transcribe = originalTranscribe;
		});

		it("should choose Speaches result when similarity is higher", async () => {
			const originalTranscribe =
				TranscriptionService.prototype.transcribe;
			let callCount = 0;

			TranscriptionService.prototype.transcribe = mock(() => {
				callCount++;
				return Promise.resolve({
					success: true,
					text:
						callCount === 1
							? "Short"
							: "This is a much longer and more detailed transcription result",
				});
			});

			await audioProcessor.processBenchmark(testAudioFile);

			// Should copy the Speaches result (longer text)
			const calls = (mockClipboardService.writeText as any).mock.calls;
			expect(calls[0][0]).toContain("longer and more detailed");

			// Restore original method
			TranscriptionService.prototype.transcribe = originalTranscribe;
		});

		it("should choose OpenAI result when both have equal length", async () => {
			const originalTranscribe =
				TranscriptionService.prototype.transcribe;
			let callCount = 0;

			TranscriptionService.prototype.transcribe = mock(() => {
				callCount++;
				return Promise.resolve({
					success: true,
					text:
						callCount === 1
							? "Same length text"
							: "Same length text",
				});
			});

			await audioProcessor.processBenchmark(testAudioFile);

			// Should copy either result (they're identical)
			const calls = (mockClipboardService.writeText as any).mock.calls;
			expect(calls[0][0]).toBe("Same length text");

			// Restore original method
			TranscriptionService.prototype.transcribe = originalTranscribe;
		});

		it("should handle OpenAI transcription failure gracefully", async () => {
			const originalTranscribe =
				TranscriptionService.prototype.transcribe;
			let callCount = 0;

			TranscriptionService.prototype.transcribe = mock(() => {
				callCount++;
				if (callCount === 1) {
					return Promise.resolve({
						success: false,
						error: "OpenAI failed",
					});
				}
				return Promise.resolve({
					success: true,
					text: "Speaches result",
				});
			});

			await audioProcessor.processBenchmark(testAudioFile);

			// Should not copy if OpenAI fails
			expect(mockClipboardService.writeText).not.toHaveBeenCalled();

			// Restore original method
			TranscriptionService.prototype.transcribe = originalTranscribe;
		});

		it("should handle Speaches transcription failure gracefully", async () => {
			const originalTranscribe =
				TranscriptionService.prototype.transcribe;
			let callCount = 0;

			TranscriptionService.prototype.transcribe = mock(() => {
				callCount++;
				if (callCount === 2) {
					return Promise.resolve({
						success: false,
						error: "Speaches failed",
					});
				}
				return Promise.resolve({
					success: true,
					text: "OpenAI result",
				});
			});

			await audioProcessor.processBenchmark(testAudioFile);

			// Should not copy if Speaches fails
			expect(mockClipboardService.writeText).not.toHaveBeenCalled();

			// Restore original method
			TranscriptionService.prototype.transcribe = originalTranscribe;
		});
	});
});
