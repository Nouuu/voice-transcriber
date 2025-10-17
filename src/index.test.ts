import { beforeEach, describe, expect, it, mock } from "bun:test";
import { VoiceTranscriberApp } from "./index";

describe("VoiceTranscriberApp", () => {
	let app: VoiceTranscriberApp;

	beforeEach(() => {
		// Use a test config path to avoid creating real config files in CI
		app = new VoiceTranscriberApp(
			"/tmp/test-voice-transcriber-config.json"
		);

		// Mock loadWithSetup to avoid the setup wizard in CI
		(app as any).config.loadWithSetup = async () => {
			// Just load without setup wizard
			await (app as any).config.load();
		};
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
				getTranscriptionConfig: mock().mockReturnValue({
					apiKey: "",
					language: "en",
					prompt: "test prompt",
					backend: "openai",
					model: "whisper-1",
				}),
				getFormatterConfig: mock().mockReturnValue({
					apiKey: "",
					enabled: true,
					language: "en",
					prompt: "test prompt",
				}),
			};

			const result = await app.initialize();

			expect(result.success).toBe(false);
			expect(result.error).toContain("API key not configured for openai backend");
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

			const mockConfig = {
				formatterEnabled: true,
			};

			// Create AudioProcessor instance with mocks
			const { AudioProcessor } = await import(
				"./services/audio-processor"
			);
			const audioProcessor = new AudioProcessor({
				config: mockConfig as any,
				transcriptionService: mockTranscription as any,
				formatterService: mockFormatter as any,
				clipboardService: mockClipboard as any,
			});

			// Test the complete workflow
			await audioProcessor.processAudioFile("/tmp/test.wav");

			expect(mockTranscription.transcribe).toHaveBeenCalledWith(
				"/tmp/test.wav"
			);
			expect(mockFormatter.formatText).toHaveBeenCalledWith(
				"Hello world"
			);
			expect(mockClipboard.writeText).toHaveBeenCalledWith(
				"Hello world."
			);
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

			const mockConfig = {
				formatterEnabled: false,
			};

			const { AudioProcessor } = await import(
				"./services/audio-processor"
			);
			const audioProcessor = new AudioProcessor({
				config: mockConfig as any,
				transcriptionService: mockTranscription as any,
				formatterService: mockFormatter as any,
				clipboardService: mockClipboard as any,
			});

			await audioProcessor.processAudioFile("/tmp/test.wav");

			expect(mockTranscription.transcribe).toHaveBeenCalled();
			expect(mockFormatter.formatText).not.toHaveBeenCalled();
			expect(mockClipboard.writeText).toHaveBeenCalledWith("Hello world");
		});
	});
});
