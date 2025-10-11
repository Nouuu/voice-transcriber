import { beforeEach, describe, expect, it, mock } from "bun:test";
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
	});
});
