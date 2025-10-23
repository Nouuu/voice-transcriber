import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { Config } from "./config";

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
				transcription: {
					backend: "openai" as const,
					openai: {
						apiKey: "test-key",
						model: "whisper-1",
					},
				},
				activePersonalities: ["builtin:default"],
			};

			writeFileSync(testConfigPath, JSON.stringify(testData));

			const config = new Config(testConfigPath);
			await config.load();

			expect(config.openaiApiKey).toBe("test-key");
			expect(config.activePersonalities).toEqual(["builtin:default"]);
		});

		it("should use defaults when file doesn't exist", async () => {
			const config = new Config("/tmp/nonexistent.json");
			await config.load();

			expect(config.openaiApiKey).toBe("");
			// default active personalities should include builtin:default
			expect(config.activePersonalities).toEqual(["builtin:default"]);
		});

		it("should merge custom personalities from file with builtin ones", async () => {
			const testData = {
				customPersonalities: {
					custom: {
						name: "Custom",
						prompt: "Custom prompt",
					},
				},
				transcription: {
					backend: "openai" as const,
					openai: { apiKey: "k", model: "whisper-1" },
				},
			};

			writeFileSync(testConfigPath, JSON.stringify(testData, null, 2));

			const config = new Config(testConfigPath);
			await config.load();

			// The default builtin personalities should still exist and custom should be merged
			expect(config["builtinPersonalities"].default).toBeDefined();
			const custom = config.customPersonalities.custom;
			expect(custom).toBeDefined();
			if (custom) {
				expect(custom.prompt).toBe("Custom prompt");
			}
		});

		it("should load activePersonalities from file", async () => {
			const testData = {
				activePersonalities: ["builtin:creative"],
				transcription: {
					backend: "openai" as const,
					openai: { apiKey: "k", model: "whisper-1" },
				},
			};

			writeFileSync(testConfigPath, JSON.stringify(testData, null, 2));

			const config = new Config(testConfigPath);
			await config.load();

			expect(config.activePersonalities).toEqual(["builtin:creative"]);
		});

		it("should load transcriptionPrompt from file and expose it to formatter config", async () => {
			const testData = {
				transcriptionPrompt: "Custom transcription prompt",
				transcription: {
					backend: "openai" as const,
					openai: { apiKey: "k", model: "whisper-1" },
				},
			};

			writeFileSync(testConfigPath, JSON.stringify(testData, null, 2));

			const config = new Config(testConfigPath);
			await config.load();

			expect(config.transcriptionPrompt).toBe(
				"Custom transcription prompt"
			);
			const fc = config.getFormatterConfig();
			expect(fc.prompt).toBe("Custom transcription prompt");
		});
	});

	describe("save", () => {
		it("should save config to file", async () => {
			const config = new Config(testConfigPath);
			config.openaiApiKey = "saved-key";
			config.activePersonalities = []; // No formatting (empty array)

			await config.save();

			expect(existsSync(testConfigPath)).toBe(true);

			const savedData = JSON.parse(readFileSync(testConfigPath, "utf8"));
			expect(savedData.transcription?.openai?.apiKey).toBe("saved-key");
			expect(savedData.activePersonalities).toEqual([]);
		});

		it("should persist new formatter fields and selectedPersonalities", async () => {
			const config = new Config(testConfigPath);
			config.openaiApiKey = "saved-key";
			config.activePersonalities = ["builtin:creative"];

			// add a custom personality locally so it gets saved
			config.customPersonalities.custom = {
				name: "Custom",
				prompt: "Custom prompt",
			};

			await config.save();

			const savedData = JSON.parse(readFileSync(testConfigPath, "utf8"));
			expect(savedData.activePersonalities).toEqual(["builtin:creative"]);
			expect(savedData.customPersonalities?.custom).toEqual({
				name: "Custom",
				prompt: "Custom prompt",
			});
		});
	});

	describe("loadWithSetup", () => {
		it("should load existing config without running setup", async () => {
			const existingConfig = {
				language: "en",
				activePersonalities: [],
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
			expect(config.activePersonalities).toEqual([]);
		});

		it("should not overwrite existing config with real API key", async () => {
			const realApiKey = "sk-real-api-key-that-should-be-preserved";
			const existingConfig = {
				language: "en",
				activePersonalities: ["builtin:default"],
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
			// Ensure no legacy boolean is written; instead formatter.openai.apiKey should be set from transcription key
			expect(savedConfig.formatter?.openai?.apiKey).toBe(realApiKey);
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

		it("should validate speaches URL and throw on invalid URL", () => {
			const config = new Config(testConfigPath);
			config.transcriptionBackend = "speaches";
			config.speachesUrl = "ftp://invalid-url"; // invalid protocol

			expect(() => config.getTranscriptionConfig()).toThrow();
		});

		it("should return speaches config when speachesUrl is valid", () => {
			const config = new Config(testConfigPath);
			config.transcriptionBackend = "speaches";
			config.speachesUrl = "https://speaches.example.local/v1";
			config.speachesApiKey = "spk";
			config.speachesModel = "custom-model";

			const cfg = config.getTranscriptionConfig();
			expect(cfg.backend).toBe("speaches");
			expect(cfg.speachesUrl).toBe("https://speaches.example.local/v1");
			expect(cfg.apiKey).toBe("spk");
			expect(cfg.model).toBe("custom-model");
		});
	});

	describe("getFormatterConfig", () => {
		it("should return formatter config with personalities", () => {
			const config = new Config(testConfigPath);
			config.formatterOpenaiApiKey = "test-api-key";
			config.language = "fr";
			config.activePersonalities = ["builtin:default"];

			const formatterConfig = config.getFormatterConfig();

			expect(formatterConfig.apiKey).toBe("test-api-key");
			expect(formatterConfig.language).toBe("fr");
			expect(formatterConfig.activePersonalities).toEqual([
				"builtin:default",
			]);
			// Guard access to avoid TS possibly-undefined error
			const builtinDefault = formatterConfig.builtinPersonalities.default;
			expect(builtinDefault).toBeDefined();
			if (builtinDefault) {
				expect(builtinDefault.prompt).toContain("grammar");
			}
		});

		it("should return custom personalities if defined", () => {
			const config = new Config(testConfigPath);
			config.formatterOpenaiApiKey = "test-api-key";
			config.customPersonalities = {
				myCustom: {
					name: "My Custom",
					prompt: "Custom formatting prompt",
				},
			};

			const formatterConfig = config.getFormatterConfig();

			expect(formatterConfig.customPersonalities.myCustom).toEqual({
				name: "My Custom",
				prompt: "Custom formatting prompt",
			});
		});

		it("should handle empty active personalities (no formatting)", () => {
			const config = new Config(testConfigPath);
			config.activePersonalities = [];

			const formatterConfig = config.getFormatterConfig();

			expect(formatterConfig.activePersonalities).toEqual([]);
		});

		it("should return builtin and custom personalities separately", () => {
			const config = new Config(testConfigPath);
			config.formatterOpenaiApiKey = "akey";
			config.customPersonalities = {
				custom1: { name: "Custom 1", prompt: "Custom prompt 1" },
			};

			const fc = config.getFormatterConfig();
			expect(fc.builtinPersonalities.default).toBeDefined();
			// Guard emojify before accessing .prompt
			const emojify = fc.builtinPersonalities.emojify;
			expect(emojify).toBeDefined();
			expect(fc.customPersonalities.custom1).toBeDefined();
			if (emojify) {
				expect(emojify.prompt).toContain(
					"Lightly add context-appropriate emojis"
				);
			}
		});
	});

	describe("language field migration", () => {
		it("should load language from config file", async () => {
			const testData = {
				language: "fr",
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

			await config.save();

			const savedData = JSON.parse(readFileSync(testConfigPath, "utf8"));
			expect(savedData.language).toBe("es");
		});
	});
});
