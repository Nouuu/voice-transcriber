import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TranscriptionService } from "./transcription";
import { logger, LogLevel } from "../utils/logger";

// Mock OpenAI (example from docs)
const mockOpenAI = {
	audio: {
		transcriptions: {
			create: mock(),
		},
	},
};

// Create a unique temp directory for this test suite
let testTempDir: string;
let tmpFile: string;

describe("TranscriptionService", () => {
	let consoleMocks: any;
	let originalFetch: any;

	beforeEach(() => {
		// Create unique temp directory for each test
		testTempDir = mkdtempSync(join(tmpdir(), "transcription-test-"));
		tmpFile = join(testTempDir, "test_audio.dat");

		consoleMocks = {
			log: mock(() => {}),
			info: mock(() => {}),
			warn: mock(() => {}),
			error: mock(() => {}),
		};
		console.log = consoleMocks.log;
		console.info = consoleMocks.info;
		console.warn = consoleMocks.warn;
		console.error = consoleMocks.error;

		// Ensure temp file exists for transcription
		writeFileSync(tmpFile, "dummy audio content");

		// Preserve original fetch for Speaches tests
		originalFetch = (global as any).fetch;
	});

	afterEach(async () => {
		// reset logger to default
		logger.setLogLevel(LogLevel.INFO);
		logger.setTruncateThreshold(1000);

		// restore fetch
		(global as any).fetch = originalFetch;
		// reset mocks
		mockOpenAI.audio.transcriptions.create.mockReset();

		// Clean up temp directory after a small delay to avoid Bun watcher issues
		// The OS will clean up /tmp anyway, so this is just for tidiness
		await new Promise(resolve => setTimeout(resolve, 10));
		try {
			if (existsSync(testTempDir)) {
				rmSync(testTempDir, { recursive: true, force: true });
			}
		} catch {
			// Ignore cleanup errors - OS will clean up /tmp
		}
	});

	it("should handle missing file", async () => {
		const svc = new TranscriptionService({
			apiKey: "test",
			backend: "openai",
			model: "whisper-1",
		});
		const result = await svc.transcribe("/nonexistent/file.wav");

		expect(result.success).toBe(false);
		expect(String(result.error)).toContain("does not exist");
	});

	it("should handle empty transcription response", async () => {
		const svc = new TranscriptionService({
			apiKey: "test",
			backend: "openai",
			model: "whisper-1",
		});

		// fake client returning empty text
		const fakeClient = {
			audio: { transcriptions: { create: async () => ({ text: "" }) } },
		};
		(svc as any).getClient = async () => ({
			success: true,
			client: fakeClient,
		});

		const res = await svc.transcribe(tmpFile);
		expect(res.success).toBe(false);
		expect(String(res.error)).toContain("No transcription text received");
	});

	it("should transcribe successfully with OpenAI", async () => {
		const svc = new TranscriptionService({
			apiKey: "test",
			backend: "openai",
			model: "whisper-1",
		});

		const fakeClient = {
			audio: {
				transcriptions: {
					create: async () => ({
						text: "  Test transcription result  ",
					}),
				},
			},
		};
		(svc as any).getClient = async () => ({
			success: true,
			client: fakeClient,
		});

		const res = await svc.transcribe(tmpFile);
		expect(res.success).toBe(true);
		expect(res.text).toBe("Test transcription result");
	});

	it("should pass language and prompt to OpenAI", async () => {
		const svc = new TranscriptionService({
			apiKey: "test",
			backend: "openai",
			model: "whisper-1",
			language: "fr",
			prompt: "Test prompt",
		});
		// inject mock client
		(svc as any).openaiClient = mockOpenAI;

		// Ensure mock resolves
		mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce({
			text: "Test result",
		});

		await svc.transcribe(tmpFile);

		// verify the create was called with an object containing language and prompt
		const calls = mockOpenAI.audio.transcriptions.create.mock.calls;
		expect(calls.length).toBeGreaterThan(0);
		const callArg = calls[0]?.[0];
		expect(callArg).toBeDefined();
		expect(callArg.model).toBe("whisper-1");
		expect(callArg.language).toBe("fr");
		expect(callArg.prompt).toBe("Test prompt");
	});

	it("logs transcription text in INFO for short texts", async () => {
		const svc = new TranscriptionService({
			apiKey: "test",
			language: "en",
			prompt: "",
			backend: "openai",
			model: "whisper-1",
		});

		// Mock getClient to return a fake client
		const fakeClient = {
			audio: {
				transcriptions: {
					create: async () => ({ text: "short transcription" }),
				},
			},
		};

		// replace getClient on the instance
		(svc as any).getClient = async () => ({
			success: true,
			client: fakeClient,
		});

		const res = await svc.transcribe(tmpFile);
		expect(res.success).toBe(true);
		expect(res.text).toBe("short transcription");

		// Ensure at least one info call contains the transcription text
		const found = consoleMocks.info.mock.calls.some(
			(c: any) =>
				c[0].includes("Transcription text") ||
				c[0].includes("short transcription")
		);
		expect(found).toBe(true);
	});

	it("logs full transcription in DEBUG and truncated info for long texts", async () => {
		// set debug to enable debug output
		logger.setLogLevel(LogLevel.DEBUG);
		logger.setTruncateThreshold(1000);

		const svc = new TranscriptionService({
			apiKey: "test",
			language: "en",
			prompt: "",
			backend: "openai",
			model: "whisper-1",
		});

		const longText = "a".repeat(1500);
		const fakeClient = {
			audio: {
				transcriptions: {
					create: async () => ({ text: longText }),
				},
			},
		};

		(svc as any).getClient = async () => ({
			success: true,
			client: fakeClient,
		});

		const res = await svc.transcribe(tmpFile);
		expect(res.success).toBe(true);
		expect(res.text).toBe(longText);

		// debug uses console.log
		const debugFound = consoleMocks.log.mock.calls.some(
			(c: any) =>
				c[0].includes("Transcription text (full):") ||
				c[0].includes(longText)
		);
		const infoFound = consoleMocks.info.mock.calls.some(
			(c: any) =>
				c[0].includes("... (truncated, total") ||
				c[0].includes("Transcription text")
		);

		expect(debugFound).toBe(true);
		expect(infoFound).toBe(true);
	});

	// Speaches backend tests (warmup + preload handling)
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
			(global as any).fetch = mockFetch;

			speachesService = new TranscriptionService({
				apiKey: "speaches-key",
				backend: "speaches",
				model: "Systran/faster-whisper-base",
				speachesUrl: "http://localhost:8000/v1",
			});
		});

		afterEach(() => {
			(global as any).fetch = originalFetch;
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
			expect(String(result.error)).toContain(
				"Failed to preload Speaches model"
			);
			expect(String(result.error)).toContain("500");
		});

		it("should handle network error during model preload", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));
			const result = await speachesService.warmup();
			expect(result.success).toBe(false);
			expect(String(result.error)).toContain("Network error");
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
			expect(String(result.error)).toContain(
				"Speaches URL not configured"
			);
		});

		it("should not send prompt to Speaches backend", async () => {
			const tmpSpeachesFile = join(testTempDir, "speaches_test.txt");
			const serviceWithPrompt = new TranscriptionService({
				apiKey: "speaches-key",
				backend: "speaches",
				model: "Systran/faster-whisper-base",
				speachesUrl: "http://localhost:8000/v1",
				prompt: "Should not be sent",
			});
			(serviceWithPrompt as any).speachesClient = mockOpenAI;

			writeFileSync(tmpSpeachesFile, "test audio content");

			mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce({
				text: "Test result",
			});

			await serviceWithPrompt.transcribe(tmpSpeachesFile);
			// last call argument
			const calls = mockOpenAI.audio.transcriptions.create.mock.calls;
			expect(calls.length).toBeGreaterThan(0);
			const lastArg = calls[0]?.[0];
			expect(lastArg).toBeDefined();
			expect(lastArg.prompt).toBeUndefined();
		});
	});

	describe("MockOpenAI documentation example", () => {
		let service: TranscriptionService;

		beforeEach(() => {
			// Reset mock between tests
			mockOpenAI.audio.transcriptions.create.mockReset();

			// Create service
			service = new TranscriptionService({
				apiKey: "test-key",
				language: "en",
				prompt: "",
				backend: "openai",
				model: "whisper-1",
			});

			// Inject mock (bypassing private field)
			(service as any).openaiClient = mockOpenAI;
		});

		it("should handle API errors", async () => {
			// Setup mock to throw error
			mockOpenAI.audio.transcriptions.create.mockRejectedValueOnce(
				new Error("API Error")
			);

			const result = await service.transcribe(tmpFile);

			// Verify error handling
			expect(result.success).toBe(false);
			expect(String(result.error)).toContain("API Error");
		});
	});
});
