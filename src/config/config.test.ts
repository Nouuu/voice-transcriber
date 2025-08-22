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
				openaiApiKey: "test-key",
				formatterEnabled: false,
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
			expect(savedData.openaiApiKey).toBe("saved-key");
			expect(savedData.formatterEnabled).toBe(false);
		});
	});

	describe("loadWithSetup", () => {
		it("should load existing config without running setup", async () => {
			const existingConfig = {
				openaiApiKey: "existing-key",
				formatterEnabled: false,
			};

			writeFileSync(testConfigPath, JSON.stringify(existingConfig, null, 2));

			const config = new Config(testConfigPath);
			await config.loadWithSetup();

			expect(config.openaiApiKey).toBe("existing-key");
			expect(config.formatterEnabled).toBe(false);
		});

		it("should not overwrite existing config with real API key", async () => {
			const realApiKey = "sk-real-api-key-that-should-be-preserved";
			const existingConfig = {
				openaiApiKey: realApiKey,
				formatterEnabled: false,
			};

			writeFileSync(testConfigPath, JSON.stringify(existingConfig, null, 2));

			const config = new Config(testConfigPath);
			await config.loadWithSetup();

			const configContent = readFileSync(testConfigPath, "utf8");
			const savedConfig = JSON.parse(configContent);

			expect(savedConfig.openaiApiKey).toBe(realApiKey);
			expect(savedConfig.formatterEnabled).toBe(false);
		});
	});
});
