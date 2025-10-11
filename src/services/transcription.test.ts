import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { writeFileSync } from "node:fs";
import { TranscriptionService } from "./transcription";

// Mock OpenAI
const mockOpenAI = {
	audio: {
		transcriptions: {
			create: mock(),
		},
	},
};

// Mock fetch for Speaches model preloading
const originalFetch = global.fetch;

describe("TranscriptionService", () => {
	let service: TranscriptionService;

	beforeEach(() => {
		mockOpenAI.audio.transcriptions.create.mockReset();

		service = new TranscriptionService({
			apiKey: "test-key",
			backend: "openai",
			model: "whisper-1",
		});

		// Inject mock OpenAI
		(service as any).openaiClient = mockOpenAI;
	});

	describe("transcribe", () => {
		it("should handle missing file", async () => {
			const result = await service.transcribe("/nonexistent/file.wav");

			expect(result.success).toBe(false);
			expect(result.error).toContain("does not exist");
		});

		it("should handle empty transcription response", async () => {
			// Create a temp file for testing
			const tempFile = "/tmp/test-transcription.txt";
			writeFileSync(tempFile, "test audio content");

			mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce({
				text: "",
			});

			const result = await service.transcribe(tempFile);

			expect(result.success).toBe(false);
			expect(result.error).toContain("No transcription text received");
		});

		it("should handle API errors", async () => {
			// Create a temp file for testing
			const tempFile = "/tmp/test-transcription-2.txt";
			writeFileSync(tempFile, "test audio content");

			mockOpenAI.audio.transcriptions.create.mockRejectedValueOnce(
				new Error("API Error")
			);

			const result = await service.transcribe(tempFile);

			expect(result.success).toBe(false);
			expect(result.error).toContain("API Error");
		});

		it("should transcribe successfully with OpenAI", async () => {
			const tempFile = "/tmp/test-transcription-success.txt";
			writeFileSync(tempFile, "test audio content");

			mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce({
				text: "  Test transcription result  ",
			});

			const result = await service.transcribe(tempFile);

			expect(result.success).toBe(true);
			expect(result.text).toBe("Test transcription result");
		});

		it("should pass language and prompt to OpenAI", async () => {
			const serviceWithPrompt = new TranscriptionService({
				apiKey: "test-key",
				backend: "openai",
				model: "whisper-1",
				language: "fr",
				prompt: "Test prompt",
			});
			(serviceWithPrompt as any).openaiClient = mockOpenAI;

			const tempFile = "/tmp/test-transcription-prompt.txt";
			writeFileSync(tempFile, "test audio content");

			mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce({
				text: "Test result",
			});

			await serviceWithPrompt.transcribe(tempFile);

			expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith(
				expect.objectContaining({
					model: "whisper-1",
					language: "fr",
					prompt: "Test prompt",
				})
			);
		});
	});

	describe("Speaches backend", () => {
		let speachesService: TranscriptionService;
		let mockFetch: any;

		beforeEach(() => {
			mockFetch = mock(() =>
				Promise.resolve({
					ok: true,
					text: () => Promise.resolve("Model loaded"),
				})
			);
			global.fetch = mockFetch as any;

			speachesService = new TranscriptionService({
				apiKey: "speaches-key",
				backend: "speaches",
				model: "Systran/faster-whisper-base",
				speachesUrl: "http://localhost:8000/v1",
			});
		});

		afterEach(() => {
			global.fetch = originalFetch;
		});

		it("should initialize Speaches client and preload model", async () => {
			const result = await speachesService.warmup();

			expect(result.success).toBe(true);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining(
					"/v1/models/Systran/faster-whisper-base"
				),
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: "Bearer speaches-key",
					}),
				})
			);
		});

		it("should use URL constructor for model path", async () => {
			await speachesService.warmup();

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toBe(
				"http://localhost:8000/v1/models/Systran/faster-whisper-base"
			);
		});

		it("should handle Speaches URL without trailing slash", async () => {
			const service = new TranscriptionService({
				apiKey: "speaches-key",
				backend: "speaches",
				model: "Systran/faster-whisper-base",
				speachesUrl: "http://localhost:8000/v1/",
			});

			await service.warmup();

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toBe(
				"http://localhost:8000/v1/models/Systran/faster-whisper-base"
			);
		});

		it("should handle model preload failure", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				text: () => Promise.resolve("Server error"),
			});

			const result = await speachesService.warmup();

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to preload Speaches model");
			expect(result.error).toContain("500");
		});

		it("should handle network error during model preload", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const result = await speachesService.warmup();

			expect(result.success).toBe(false);
			expect(result.error).toContain("Network error");
		});

		it("should not preload model twice", async () => {
			await speachesService.warmup();
			mockFetch.mockClear();

			await speachesService.warmup();

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("should fail if Speaches URL is not configured", async () => {
			const serviceWithoutUrl = new TranscriptionService({
				apiKey: "test-key",
				backend: "speaches",
				model: "test-model",
			});

			const result = await serviceWithoutUrl.warmup();

			expect(result.success).toBe(false);
			expect(result.error).toContain("Speaches URL not configured");
		});

		it("should not send prompt to Speaches backend", async () => {
			const serviceWithPrompt = new TranscriptionService({
				apiKey: "speaches-key",
				backend: "speaches",
				model: "Systran/faster-whisper-base",
				speachesUrl: "http://localhost:8000/v1",
				prompt: "Should not be sent",
			});

			await serviceWithPrompt.warmup();
			(serviceWithPrompt as any).speachesClient = mockOpenAI;

			const tempFile = "/tmp/test-speaches-prompt.txt";
			writeFileSync(tempFile, "test audio content");

			mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce({
				text: "Test result",
			});

			await serviceWithPrompt.transcribe(tempFile);

			expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith(
				expect.not.objectContaining({
					prompt: expect.anything(),
				})
			);
		});
	});

	describe("warmup", () => {
		it("should not preload for OpenAI backend by default", async () => {
			const openaiService = new TranscriptionService({
				apiKey: "test-key",
				backend: "openai",
				model: "whisper-1",
			});

			const result = await openaiService.warmup();

			expect(result.success).toBe(true);
		});

		it("should force Speaches preload when requested", async () => {
			const mockFetch = mock(() =>
				Promise.resolve({
					ok: true,
					text: () => Promise.resolve("Model loaded"),
				})
			);
			global.fetch = mockFetch as any;

			const openaiService = new TranscriptionService({
				apiKey: "test-key",
				backend: "openai",
				model: "whisper-1",
				speachesUrl: "http://localhost:8000/v1",
			});

			await openaiService.warmup(true);

			expect(mockFetch).toHaveBeenCalled();
			global.fetch = originalFetch;
		});
	});
});
