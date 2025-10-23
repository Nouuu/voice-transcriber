import { beforeEach, describe, expect, it, mock } from "bun:test";
import { FormatterService } from "./formatter";

// Mock OpenAI
const mockOpenAI = {
	chat: {
		completions: {
			create: mock(),
		},
	},
};

describe("FormatterService", () => {
	let service: FormatterService;

	beforeEach(() => {
		mockOpenAI.chat.completions.create.mockReset();

		service = new FormatterService({
			apiKey: "test-key",
			enabled: true,
			language: "en",
			prompt: "Format this text with proper grammar:",
		});

		// Inject mock
		(service as any).openai = mockOpenAI;
	});

	describe("formatText", () => {
		it("should format text successfully", async () => {
			const originalText = "hello world this is a test";
			const formattedText = "Hello world, this is a test.";

			mockOpenAI.chat.completions.create.mockResolvedValueOnce({
				choices: [{ message: { content: formattedText } }],
			});

			const result = await service.formatText(originalText);

			expect(result.success).toBe(true);
			expect(result.text).toBe(formattedText);
			expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "user",
						content: expect.stringContaining(originalText),
					},
				],
				temperature: 0.3,
				max_completion_tokens: 1000,
			});
		});

		it("should attempt formatting even when config.enabled is false (caller controls enablement)", async () => {
			// Create service with enabled=false but inject mock so we don't call real API
			const disabledService = new FormatterService({
				apiKey: "test-key",
				enabled: false,
				language: "en",
				prompt: "Format this text:",
			});

			// Inject mock into the disabled instance
			(disabledService as any).openai = mockOpenAI;

			const formattedText = "Test text formatted.";
			mockOpenAI.chat.completions.create.mockResolvedValueOnce({
				choices: [{ message: { content: formattedText } }],
			});

			const result = await disabledService.formatText("test text");

			expect(result.success).toBe(true);
			expect(result.text).toBe(formattedText);
			expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
		});

		it("should handle API errors", async () => {
			mockOpenAI.chat.completions.create.mockRejectedValueOnce(
				new Error("API Error")
			);

			const result = await service.formatText("test text");

			expect(result.success).toBe(false);
			expect(result.error).toContain("API Error");
		});

		it("should reject empty text", async () => {
			const result = await service.formatText("");

			expect(result.success).toBe(false);
			expect(result.error).toContain("Text cannot be empty");
			expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
		});

		it("should handle empty response", async () => {
			mockOpenAI.chat.completions.create.mockResolvedValueOnce({
				choices: [{ message: { content: "" } }],
			});

			const result = await service.formatText("test text");

			expect(result.success).toBe(false);
			expect(result.error).toContain("No formatted text received");
		});
	});
});
