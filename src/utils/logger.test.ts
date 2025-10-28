import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Logger, LogLevel } from "./logger";

describe("Logger", () => {
	let consoleMocks: any;

	beforeEach(() => {
		consoleMocks = {
			error: mock(() => {}),
			info: mock(() => {}),
			log: mock(() => {}),
			warn: mock(() => {}),
		};

		console.error = consoleMocks.error;
		console.info = consoleMocks.info;
		console.log = consoleMocks.log;
		console.warn = consoleMocks.warn;
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

	describe("logConditional", () => {
		it("logs full text via INFO when length <= threshold", () => {
			const logger = new Logger();
			// default level is INFO
			const shortText = "x".repeat(500);

			logger.logConditional("Original", shortText);

			expect(consoleMocks.log).toHaveBeenCalledTimes(0);
			expect(consoleMocks.info).toHaveBeenCalledTimes(1);
			const infoCall = consoleMocks.info.mock.calls[0][0];
			expect(infoCall).toContain("[INFO]");
			expect(infoCall).toContain('Original: "');
			expect(infoCall).toContain(shortText);
		});

		it("logs full text to DEBUG and truncated to INFO when length > threshold", () => {
			const logger = new Logger();
			logger.setLogLevel(LogLevel.DEBUG);
			const longText = "a".repeat(1500);

			logger.logConditional("Formatted", longText);

			expect(consoleMocks.log).toHaveBeenCalledTimes(1); // debug
			expect(consoleMocks.info).toHaveBeenCalledTimes(1); // truncated info

			const debugCall = consoleMocks.log.mock.calls[0][0];
			expect(debugCall).toContain("[DEBUG]");
			expect(debugCall).toContain('Formatted (full): "');
			expect(debugCall).toContain(longText);

			const infoCall = consoleMocks.info.mock.calls[0][0];
			expect(infoCall).toContain('Formatted: "');
			expect(infoCall).toContain("... (truncated, total 1500 chars)");
		});
	});
});
