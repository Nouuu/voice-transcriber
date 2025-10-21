import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { Config } from "./config";
import { logger } from "../utils/logger";

describe("Config", () => {
	const testConfigPath = "/tmp/test-config.json";

	afterEach(() => {
		// Only clean up test files, NEVER delete production config.json
		if (existsSync(testConfigPath)) {
			unlinkSync(testConfigPath);
		}
		// CRITICAL: Do not delete config.json - it contains production API keys
	});

	describe("load", () => {
		it("should load config from file", async () => {
			const testData = {
				language: "en",
				formatterEnabled: false,
				transcription: {
					backend: "openai" as const,
					openai: {
						apiKey: "test-key",
						model: "whisper-1",
					},
				},
			};

			writeFileSync(testConfigPath, JSON.stringify(testData));

			const config = new Config(testConfigPath);
			await config.load();

			expect(config.openaiApiKey).toBe("test-key");
			expect(config.formatterEnabled).toBe(false);
		});

		it("should use defaults when file doesn't exist", async () => {
			const config = new Config("/tmp/nonexistent.json");
			await config.load();

			expect(config.openaiApiKey).toBe("");
			expect(config.formatterEnabled).toBe(true);
		});
	});

	describe("save", () => {
		it("should save config to file", async () => {
			const config = new Config(testConfigPath);
			config.openaiApiKey = "saved-key";
			config.formatterEnabled = false;

			await config.save();

			expect(existsSync(testConfigPath)).toBe(true);

			const savedData = JSON.parse(readFileSync(testConfigPath, "utf8"));
			expect(savedData.transcription?.openai?.apiKey).toBe("saved-key");
			expect(savedData.formatterEnabled).toBe(false);
		});
	});

	describe("loadWithSetup", () => {
		it("should load existing config without running setup", async () => {
			const existingConfig = {
				language: "en",
				formatterEnabled: false,
				transcription: {
					backend: "openai" as const,
					openai: {
						apiKey: "existing-key",
						model: "whisper-1",
					},
				},
			};

			writeFileSync(
				testConfigPath,
				JSON.stringify(existingConfig, null, 2)
			);

			const config = new Config(testConfigPath);
			await config.loadWithSetup();

			expect(config.openaiApiKey).toBe("existing-key");
			expect(config.formatterEnabled).toBe(false);
		});

		it("should not overwrite existing config with real API key", async () => {
			const realApiKey = "sk-real-api-key-that-should-be-preserved";
			const existingConfig = {
				language: "en",
				formatterEnabled: false,
				transcription: {
					backend: "openai" as const,
					openai: {
						apiKey: realApiKey,
						model: "whisper-1",
					},
				},
			};

			writeFileSync(
				testConfigPath,
				JSON.stringify(existingConfig, null, 2)
			);

			const config = new Config(testConfigPath);
			await config.loadWithSetup();

			const configContent = readFileSync(testConfigPath, "utf8");
			const savedConfig = JSON.parse(configContent);

			expect(savedConfig.transcription?.openai?.apiKey).toBe(realApiKey);
			expect(savedConfig.formatterEnabled).toBe(false);
		});
	});

	describe("getTranscriptionConfig", () => {
		it("should return transcription config with language and prompt", () => {
			const config = new Config(testConfigPath);
			config.openaiApiKey = "test-api-key";
			config.language = "fr";

			const transcriptionConfig = config.getTranscriptionConfig();

			expect(transcriptionConfig.apiKey).toBe("test-api-key");
			expect(transcriptionConfig.language).toBe("fr");
			expect(transcriptionConfig.prompt).toContain("French");
			expect(transcriptionConfig.prompt).toContain(
				"Do NOT switch to English"
			);
		});

		it("should use custom transcription prompt when provided", () => {
			const config = new Config(testConfigPath);
			config.openaiApiKey = "test-api-key";
			config.language = "fr";
			config.transcriptionPrompt = "Custom French prompt";

			const transcriptionConfig = config.getTranscriptionConfig();

			expect(transcriptionConfig.prompt).toBe("Custom French prompt");
		});

		it("should generate language-specific prompts for all supported languages", () => {
			const languages = [
				{ code: "fr", name: "French" },
				{ code: "en", name: "English" },
				{ code: "es", name: "Spanish" },
				{ code: "de", name: "German" },
				{ code: "it", name: "Italian" },
			];

			for (const lang of languages) {
				const config = new Config(testConfigPath);
				config.language = lang.code;

				const transcriptionConfig = config.getTranscriptionConfig();

				expect(transcriptionConfig.prompt).toContain(lang.name);
				expect(transcriptionConfig.prompt).toContain(
					`This is a ${lang.name} audio recording`
				);
			}
		});
	});

	describe("getFormatterConfig", () => {
		it("should return formatter config with language and prompt", () => {
			const config = new Config(testConfigPath);
			config.openaiApiKey = "test-api-key";
			config.language = "fr";
			config.formatterEnabled = true;

			const formatterConfig = config.getFormatterConfig();

			expect(formatterConfig.apiKey).toBe("test-api-key");
			expect(formatterConfig.enabled).toBe(true);
			expect(formatterConfig.language).toBe("fr");
			expect(formatterConfig.prompt).toContain("French");
			expect(formatterConfig.prompt).toContain(
				"Do not translate to another language"
			);
		});

		it("should use custom formatting prompt when provided", () => {
			const config = new Config(testConfigPath);
			config.openaiApiKey = "test-api-key";
			config.language = "fr";
			config.formattingPrompt = "Custom formatting prompt";

			const formatterConfig = config.getFormatterConfig();

			expect(formatterConfig.prompt).toBe("Custom formatting prompt");
		});

		it("should respect formatterEnabled setting", () => {
			const config = new Config(testConfigPath);
			config.formatterEnabled = false;

			const formatterConfig = config.getFormatterConfig();

			expect(formatterConfig.enabled).toBe(false);
		});
	});

	describe("language field migration", () => {
		it("should load language from config file", async () => {
			const testData = {
				language: "fr",
				formatterEnabled: true,
				transcription: {
					backend: "openai" as const,
					openai: {
						apiKey: "test-key",
						model: "whisper-1",
					},
				},
			};

			writeFileSync(testConfigPath, JSON.stringify(testData));

			const config = new Config(testConfigPath);
			await config.load();

			expect(config.language).toBe("fr");
		});

		it("should default to 'en' when language not specified", async () => {
			const testData = {
				formatterEnabled: true,
				transcription: {
					backend: "openai" as const,
					openai: {
						apiKey: "test-key",
						model: "whisper-1",
					},
				},
			};

			writeFileSync(testConfigPath, JSON.stringify(testData));

			const config = new Config(testConfigPath);
			await config.load();

			expect(config.language).toBe("en");
		});

		it("should save language to config file", async () => {
			const config = new Config(testConfigPath);
			config.openaiApiKey = "test-key";
			config.language = "es";
			config.formatterEnabled = true;

			await config.save();

			const savedData = JSON.parse(readFileSync(testConfigPath, "utf8"));
			expect(savedData.language).toBe("es");
		});
	});
});
