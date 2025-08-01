import { describe, it, expect, afterEach } from "bun:test";
import { Config } from "./config";
import { existsSync, unlinkSync } from "fs";

describe("Config", () => {
  const testConfigPath = "test-config.json";

  afterEach(() => {
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
    if (existsSync("config.json")) {
      unlinkSync("config.json");
    }
  });

  describe("load", () => {
    it("should load config from file", async () => {
      const testData = {
        openaiApiKey: "test-key",
        formatterEnabled: false
      };
      
      await Bun.write(testConfigPath, JSON.stringify(testData));
      
      const config = new Config(testConfigPath);
      await config.load();
      
      expect(config.openaiApiKey).toBe("test-key");
      expect(config.formatterEnabled).toBe(false);
    });

    it("should use defaults when file doesn't exist", async () => {
      const config = new Config("nonexistent.json");
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
      
      const savedData = await Bun.file(testConfigPath).json();
      expect(savedData.openaiApiKey).toBe("saved-key");
      expect(savedData.formatterEnabled).toBe(false);
    });
  });
});