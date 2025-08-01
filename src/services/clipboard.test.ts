import { beforeEach, describe, expect, it, mock } from "bun:test";
import { ClipboardService } from "./clipboard";

// Mock clipboardy module
const mockClipboard = {
	write: mock(),
	read: mock(),
};

describe("ClipboardService", () => {
	let service: ClipboardService;

	beforeEach(() => {
		// Reset mocks
		mockClipboard.write.mockReset();
		mockClipboard.read.mockReset();

		service = new ClipboardService();

		// Inject mock clipboard library
		(service as any).clipboard = mockClipboard;
	});

	describe("writeText", () => {
		it("should write text to clipboard successfully", async () => {
			const testText = "Hello, this is a test transcription.";
			mockClipboard.write.mockResolvedValueOnce(undefined);

			const result = await service.writeText(testText);

			expect(result.success).toBe(true);
			expect(mockClipboard.write).toHaveBeenCalledWith(testText);
		});

		it("should handle clipboard write errors", async () => {
			const testText = "Test text";
			mockClipboard.write.mockRejectedValueOnce(
				new Error("Clipboard access denied"),
			);

			const result = await service.writeText(testText);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Clipboard access denied");
		});

		it("should reject empty text", async () => {
			const result = await service.writeText("");

			expect(result.success).toBe(false);
			expect(result.error).toContain("Text cannot be empty");
			expect(mockClipboard.write).not.toHaveBeenCalled();
		});
	});

	describe("readText", () => {
		it("should read text from clipboard successfully", async () => {
			const clipboardText = "Text from clipboard";
			mockClipboard.read.mockResolvedValueOnce(clipboardText);

			const result = await service.readText();

			expect(result.success).toBe(true);
			expect(result.text).toBe(clipboardText);
			expect(mockClipboard.read).toHaveBeenCalled();
		});

		it("should handle clipboard read errors", async () => {
			mockClipboard.read.mockRejectedValueOnce(
				new Error("Clipboard read failed"),
			);

			const result = await service.readText();

			expect(result.success).toBe(false);
			expect(result.error).toContain("Clipboard read failed");
		});
	});

	describe("clear", () => {
		it("should clear clipboard", async () => {
			mockClipboard.write.mockResolvedValueOnce(undefined);

			const result = await service.clear();

			expect(result.success).toBe(true);
			expect(mockClipboard.write).toHaveBeenCalledWith("");
		});
	});
});
