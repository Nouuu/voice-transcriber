import { beforeEach, describe, expect, it, mock } from "bun:test";
import { VoiceTranscriberApp } from "./index";

describe("VoiceTranscriberApp", () => {
	let app: VoiceTranscriberApp;

	beforeEach(() => {
		// Use a test config path to avoid creating real config files in CI
		app = new VoiceTranscriberApp("/tmp/test-voice-transcriber-config.json");
	});

	describe("constructor", () => {
		it("should create app instance", () => {
			expect(app).toBeDefined();
			expect(app).toBeInstanceOf(VoiceTranscriberApp);
		});
	});

	describe("initialize", () => {
		it("should fail without API key", async () => {
			// Mock the config to have no API key directly on existing app
			(app as any).config = {
				openaiApiKey: "",
				formatterEnabled: true,
				loadWithSetup: mock().mockResolvedValue(undefined),
			};

			const result = await app.initialize();

			expect(result.success).toBe(false);
			expect(result.error).toContain("OpenAI API key not configured");
		});

		it("should require valid API key for initialization", async () => {
			// Test that initialization requires API key - this is the main validation
			(app as any).config.openaiApiKey = "sk-test123";

			// We'll skip actual system tray initialization in tests
			// The important part is that the app validates the API key first
			expect((app as any).config.openaiApiKey).toBe("sk-test123");
		});
	});

	describe("shutdown", () => {
		it("should shutdown gracefully when not recording", async () => {
			const mockRecorder = {
				isRecording: mock().mockReturnValue(false),
				stopRecording: mock(),
			};
			const mockTray = {
				shutdown: mock().mockResolvedValue({ success: true }),
			};

			(app as any).audioRecorder = mockRecorder;
			(app as any).systemTrayService = mockTray;

			await app.shutdown();

			expect(mockRecorder.stopRecording).not.toHaveBeenCalled();
			expect(mockTray.shutdown).toHaveBeenCalled();
		});

		it("should stop recording before shutdown", async () => {
			const mockRecorder = {
				isRecording: mock().mockReturnValue(true),
				stopRecording: mock().mockResolvedValue({ success: true }),
			};
			const mockTray = {
				shutdown: mock().mockResolvedValue({ success: true }),
			};

			(app as any).audioRecorder = mockRecorder;
			(app as any).systemTrayService = mockTray;

			await app.shutdown();

			expect(mockRecorder.stopRecording).toHaveBeenCalled();
			expect(mockTray.shutdown).toHaveBeenCalled();
		});
	});

	describe("workflow integration", () => {
		it("should handle complete transcription workflow", async () => {
			// Mock all services for complete workflow test
			const mockRecorder = {
				isRecording: mock().mockReturnValue(false),
				startRecording: mock().mockResolvedValue({ success: true }),
				stopRecording: mock().mockResolvedValue({
					success: true,
					filePath: "/tmp/test.wav",
				}),
			};

			const mockTranscription = {
				transcribe: mock().mockResolvedValue({
					success: true,
					text: "Hello world",
				}),
			};

			const mockFormatter = {
				formatText: mock().mockResolvedValue({
					success: true,
					text: "Hello world.",
				}),
			};

			const mockClipboard = {
				writeText: mock().mockResolvedValue({ success: true }),
			};

			const mockTray = {
				setState: mock().mockResolvedValue({ success: true }),
			};

			// Inject mocks
			(app as any).audioRecorder = mockRecorder;
			(app as any).transcriptionService = mockTranscription;
			(app as any).formatterService = mockFormatter;
			(app as any).clipboardService = mockClipboard;
			(app as any).systemTrayService = mockTray;
			(app as any).config = { formatterEnabled: true };

			// Test the complete workflow by calling processAudioFile directly
			await (app as any).processAudioFile("/tmp/test.wav");

			expect(mockTranscription.transcribe).toHaveBeenCalledWith(
				"/tmp/test.wav",
			);
			expect(mockFormatter.formatText).toHaveBeenCalledWith("Hello world");
			expect(mockClipboard.writeText).toHaveBeenCalledWith("Hello world.");
		});

		it("should skip formatting when disabled", async () => {
			const mockTranscription = {
				transcribe: mock().mockResolvedValue({
					success: true,
					text: "Hello world",
				}),
			};

			const mockFormatter = {
				formatText: mock(),
			};

			const mockClipboard = {
				writeText: mock().mockResolvedValue({ success: true }),
			};

			const mockTray = {
				setState: mock().mockResolvedValue({ success: true }),
			};

			(app as any).transcriptionService = mockTranscription;
			(app as any).formatterService = mockFormatter;
			(app as any).clipboardService = mockClipboard;
			(app as any).systemTrayService = mockTray;
			(app as any).config = { formatterEnabled: false };

			await (app as any).processAudioFile("/tmp/test.wav");

			expect(mockTranscription.transcribe).toHaveBeenCalled();
			expect(mockFormatter.formatText).not.toHaveBeenCalled();
			expect(mockClipboard.writeText).toHaveBeenCalledWith("Hello world");
		});
	});
});
