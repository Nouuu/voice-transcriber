import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Logger } from "./logger";

describe("Logger", () => {
	let consoleMocks: any;

	beforeEach(() => {
		consoleMocks = {
			error: mock(() => {}),
			info: mock(() => {}),
		};

		console.error = consoleMocks.error;
		console.info = consoleMocks.info;
	});

	describe("info", () => {
		it("should log info messages with timestamp", () => {
			const logger = new Logger();

			logger.info("Test info message");

			expect(consoleMocks.info).toHaveBeenCalledTimes(1);
			const call = consoleMocks.info.mock.calls[0][0];
			expect(call).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
			expect(call).toContain("[INFO]");
			expect(call).toContain("Test info message");
		});
	});

	describe("error", () => {
		it("should log error messages with timestamp", () => {
			const logger = new Logger();

			logger.error("Test error message");

			expect(consoleMocks.error).toHaveBeenCalledTimes(1);
			const call = consoleMocks.error.mock.calls[0][0];
			expect(call).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
			expect(call).toContain("[ERROR]");
			expect(call).toContain("Test error message");
		});
	});
});
