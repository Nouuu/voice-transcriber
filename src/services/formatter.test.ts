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
				max_tokens: 1000,
			});
		});

		it("should return original text when disabled", async () => {
			const disabledService = new FormatterService({
				apiKey: "test-key",
				enabled: false,
			});

			const result = await disabledService.formatText("test text");

			expect(result.success).toBe(true);
			expect(result.text).toBe("test text");
			expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
		});

		it("should handle API errors", async () => {
			mockOpenAI.chat.completions.create.mockRejectedValueOnce(
				new Error("API Error"),
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
