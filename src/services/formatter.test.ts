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
			personalities: {
				professional: {
					name: "Professional",
					prompt: "Use professional tone.",
				},
				creative: {
					name: "Creative",
					prompt: "Use creative and expressive language.",
				},
				technical: {
					name: "Technical",
					prompt: "Use technical terminology.",
				},
			},
			maxPromptLength: 100,
		});

		// Inject mock
		(service as any).openai = mockOpenAI;
	});

	describe("buildCompositePrompt", () => {
		it("should concatenate multiple prompts with separator", () => {
			const personalities = ["professional", "creative"];
			const result = service.buildCompositePrompt(personalities);

			expect(result).toBe(
				"Use professional tone.\n\n---\n\nUse creative and expressive language."
			);
		});

		it("should handle single personality", () => {
			const result = service.buildCompositePrompt(["professional"]);
			expect(result).toBe("Use professional tone.");
		});

		it("should handle empty array", () => {
			const result = service.buildCompositePrompt([]);
			expect(result).toBe("");
		});

		it("should skip personalities with no prompt", () => {
			const serviceWithEmptyPrompt = new FormatterService({
				apiKey: "test-key",
				enabled: true,
				language: "en",
				prompt: "default prompt",
				personalities: {
					withPrompt: { name: "With", prompt: "Has prompt" },
					noPrompt: { name: "No", prompt: null },
					emptyPrompt: { name: "Empty", prompt: "" },
				},
			});

			const result = serviceWithEmptyPrompt.buildCompositePrompt([
				"withPrompt",
			]);

			// Only personalities with actual prompts are included
			expect(result).toBe("Has prompt");
		});

		it("should respect maxPromptLength limit", () => {
			const serviceWithShortLimit = new FormatterService({
				apiKey: "test-key",
				enabled: true,
				language: "en",
				prompt: "default",
				personalities: {
					p1: { name: "P1", prompt: "Short prompt." },
					p2: { name: "P2", prompt: "Another short prompt." },
					p3: { name: "P3", prompt: "Yet another prompt." },
				},
				maxPromptLength: 30,
			});

			const result = serviceWithShortLimit.buildCompositePrompt([
				"p1",
				"p2",
				"p3",
			]);

			// Should only include first prompt (13 chars) as adding separator (7 chars)
			// + second prompt (21 chars) = 41 chars > 30 limit
			expect(result).toBe("Short prompt.");
		});

		it("should use default maxPromptLength if not configured", () => {
			const serviceNoLimit = new FormatterService({
				apiKey: "test-key",
				enabled: true,
				language: "en",
				prompt: "default",
				personalities: {
					p1: { name: "P1", prompt: "Prompt 1" },
					p2: { name: "P2", prompt: "Prompt 2" },
				},
			});

			const result = serviceNoLimit.buildCompositePrompt(["p1", "p2"]);
			expect(result).toBe("Prompt 1\n\n---\n\nPrompt 2");
		});

		it("should handle unknown personalities gracefully", () => {
			const result = service.buildCompositePrompt([
				"professional",
				"unknown",
			]);

			// Unknown personality should fall back to config prompt
			expect(result).toContain("Use professional tone.");
			expect(result).toContain("Format this text with proper grammar:");
		});
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
				personalities: {},
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
