import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { AudioRecorder } from "./audio-recorder";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("AudioRecorder", () => {
  let testTempDir: string;
  let recorder: AudioRecorder;

  beforeEach(() => {
    testTempDir = join(tmpdir(), "transcriber-audio-test");
    mkdirSync(testTempDir, { recursive: true });
    recorder = new AudioRecorder({ tempDir: testTempDir });
  });

  afterEach(() => {
    if (existsSync(testTempDir)) {
      rmSync(testTempDir, { recursive: true, force: true });
    }
  });

  describe("isRecording", () => {
    it("should initially not be recording", () => {
      expect(recorder.isRecording()).toBe(false);
    });
  });

  describe("startRecording", () => {
    it("should create temp directory if it doesn't exist", async () => {
      const nonExistentDir = join(testTempDir, "nonexistent");
      const newRecorder = new AudioRecorder({ tempDir: nonExistentDir });
      
      await newRecorder.startRecording();
      
      expect(existsSync(nonExistentDir)).toBe(true);
    });

    it("should not start if already recording", async () => {
      (recorder as any).recordingProcess = {}; // Mock recording process
      
      const result = await recorder.startRecording();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("Already recording");
    });
  });

  describe("stopRecording", () => {
    it("should handle not recording state", async () => {
      const result = await recorder.stopRecording();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("Not recording");
    });
  });
});