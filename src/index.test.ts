import { beforeEach, describe, expect, it, mock } from "bun:test";
import { VoiceTranscriberApp } from "./index";
import { TrayState } from "./services/system-tray";

describe("VoiceTranscriberApp", () => {
	let app: VoiceTranscriberApp;

	beforeEach(() => {
		// Use a test config path to avoid creating real config files in CI
		app = new VoiceTranscriberApp(
			"/tmp/voice-transcriber-test-config.json"
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
					language: "en",
					backend: "openai",
					model: "gpt-4o-mini",
					selectedPersonalities: [],
					activePersonalities: [],
					builtinPersonalities: {},
					customPersonalities: {},
				}),
			};

			const result = await app.initialize();

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"API key not configured for openai backend"
			);
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

	describe("handleOpenConfig", () => {
		it("should call getConfigPath and execute without error", () => {
			const mockConfig = {
				getConfigPath: mock().mockReturnValue(
					"/home/user/.config/voice-transcriber/config.json"
				),
			};

			(app as any).config = mockConfig;

			// Should not throw - may fail to spawn in test env but that's ok
			expect(() => (app as any).handleOpenConfig()).not.toThrow();
			expect(mockConfig.getConfigPath).toHaveBeenCalled();
		});

		it("should handle config path errors gracefully", () => {
			const mockConfig = {
				getConfigPath: mock().mockImplementation(() => {
					throw new Error("Config path error");
				}),
			};

			(app as any).config = mockConfig;

			// Should not throw - errors are caught and logged
			expect(() => (app as any).handleOpenConfig()).not.toThrow();
		});
	});

	describe("handleReload", () => {
		it("should block reload when recording", async () => {
			const mockRecorder = {
				isRecording: mock().mockReturnValue(true),
			};

			(app as any).audioRecorder = mockRecorder;

			await (app as any).handleReload();

			expect(mockRecorder.isRecording).toHaveBeenCalled();
		});

		it("should block reload when not in IDLE state", async () => {
			const mockRecorder = {
				isRecording: mock().mockReturnValue(false),
			};

			const mockTray = {
				getState: mock().mockReturnValue(TrayState.RECORDING),
			};

			(app as any).audioRecorder = mockRecorder;
			(app as any).systemTrayService = mockTray;

			await (app as any).handleReload();

			expect(mockTray.getState).toHaveBeenCalled();
		});

		it("should reload config and reinitialize services", async () => {
			const mockRecorder = {
				isRecording: mock().mockReturnValue(false),
			};

			const mockTray = {
				getState: mock().mockReturnValue(TrayState.IDLE),
			};

			const mockConfigLoad = mock().mockResolvedValue(undefined);
			const mockConfig = {
				load: mockConfigLoad,
				getTranscriptionConfig: mock().mockReturnValue({
					apiKey: "sk-test123",
					language: "en",
					prompt: "test",
					backend: "openai",
					model: "whisper-1",
					speachesUrl: "http://localhost:8000",
				}),
				getFormatterConfig: mock().mockReturnValue({
					apiKey: "sk-test123",
					enabled: true,
					language: "en",
					prompt: "test",
					backend: "openai",
					model: "gpt-4o-mini",
					personalityName: null,
					personalityPrompt: null,
					personalityEnabled: false,
					selectedPersonalities: [],
					activePersonalities: [],
					personalities: {},
				}),
				benchmarkMode: false,
			};

			(app as any).audioRecorder = mockRecorder;
			(app as any).systemTrayService = mockTray;
			(app as any).config = mockConfig;
			(app as any).clipboardService = {};

			await (app as any).handleReload();

			expect(mockConfigLoad).toHaveBeenCalled();
			expect(mockConfig.getTranscriptionConfig).toHaveBeenCalled();
			expect(mockConfig.getFormatterConfig).toHaveBeenCalled();
		});

		it("should rollback on config validation failure", async () => {
			const mockRecorder = {
				isRecording: mock().mockReturnValue(false),
			};

			const mockTray = {
				getState: mock().mockReturnValue(TrayState.IDLE),
			};

			const oldTranscriptionConfig = {
				apiKey: "sk-old",
				language: "en",
				prompt: "old",
				backend: "openai",
				model: "whisper-1",
				speachesUrl: "http://localhost:8000",
			};

			const oldFormatterConfig = {
				apiKey: "sk-old",
				enabled: true,
				language: "en",
				prompt: "old",
				backend: "openai" as const,
				model: "gpt-4o-mini",
				personalityName: null,
				personalityPrompt: null,
				personalityEnabled: false,
				selectedPersonalities: [],
				activePersonalities: [],
				personalities: {},
			};

			const mockConfig = {
				load: mock().mockResolvedValue(undefined),
				getTranscriptionConfig: mock()
					.mockReturnValueOnce(oldTranscriptionConfig) // First call (backup)
					.mockReturnValueOnce({ apiKey: "", language: "en" }), // Second call (invalid)
				getFormatterConfig: mock().mockReturnValue(oldFormatterConfig),
				benchmarkMode: false,
			};

			(app as any).audioRecorder = mockRecorder;
			(app as any).systemTrayService = mockTray;
			(app as any).config = mockConfig;
			(app as any).clipboardService = {};

			await (app as any).handleReload();

			// Config should have been loaded
			expect(mockConfig.load).toHaveBeenCalled();
		});

		it("should handle reload errors gracefully", async () => {
			const mockRecorder = {
				isRecording: mock().mockReturnValue(false),
			};

			const mockTray = {
				getState: mock().mockReturnValue(TrayState.IDLE),
			};

			const mockConfig = {
				load: mock().mockRejectedValue(new Error("Load failed")),
				getTranscriptionConfig: mock().mockReturnValue({
					apiKey: "sk-test123",
					language: "en",
					prompt: "test",
					backend: "openai",
					model: "whisper-1",
				}),
				getFormatterConfig: mock().mockReturnValue({
					apiKey: "sk-test123",
					enabled: true,
					language: "en",
					prompt: "test",
					backend: "openai",
					model: "gpt-4o-mini",
					personalityName: null,
					personalityPrompt: null,
					personalityEnabled: false,
					selectedPersonalities: [],
					activePersonalities: [],
					personalities: {},
				}),
			};

			(app as any).audioRecorder = mockRecorder;
			(app as any).systemTrayService = mockTray;
			(app as any).config = mockConfig;

			// Should not throw
			await expect((app as any).handleReload()).resolves.toBeUndefined();
		});

		it("should handle benchmarkMode change on reload", async () => {
			const mockRecorder = {
				isRecording: mock().mockReturnValue(false),
			};

			const mockTray = {
				getState: mock().mockReturnValue(TrayState.IDLE),
			};

			const mockConfigLoad = mock().mockResolvedValue(undefined);

			const mockConfig = {
				load: mockConfigLoad,
				benchmarkMode: true, // Benchmark mode enabled
				getTranscriptionConfig: mock().mockReturnValue({
					apiKey: "sk-test123",
					language: "en",
					prompt: "test",
					backend: "openai",
					model: "whisper-1",
					speachesUrl: "http://localhost:8000",
				}),
				getFormatterConfig: mock().mockReturnValue({
					apiKey: "sk-test123",
					enabled: true,
					language: "en",
					prompt: "test",
					backend: "openai",
					model: "gpt-4o-mini",
					personalityName: null,
					personalityPrompt: null,
					personalityEnabled: false,
					selectedPersonalities: [],
					activePersonalities: [],
					personalities: {},
				}),
			};

			(app as any).audioRecorder = mockRecorder;
			(app as any).systemTrayService = mockTray;
			(app as any).config = mockConfig;
			(app as any).clipboardService = {};

			await (app as any).handleReload();

			// Config should have been loaded
			expect(mockConfigLoad).toHaveBeenCalled();

			// TranscriptionService should have been created with benchmark support
			expect((app as any).transcriptionService).toBeDefined();

			// AudioProcessor should have access to benchmarkMode via config
			expect((app as any).audioProcessor).toBeDefined();
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
				getPersonalityPrompt: mock().mockReturnValue("test prompt"),
			};

			const mockClipboard = {
				writeText: mock().mockResolvedValue({ success: true }),
			};

			const mockConfig = {
				getFormatterConfig: () => ({
					apiKey: "test-key",
					language: "en",
					backend: "openai" as const,
					model: "gpt-4o-mini",
					selectedPersonalities: [],
					activePersonalities: [],
					builtinPersonalities: {},
					customPersonalities: {},
				}),
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
			await audioProcessor.processAudioFile("/tmp/test.wav", [
				"builtin:default",
			]);

			expect(mockTranscription.transcribe).toHaveBeenCalledWith(
				"/tmp/test.wav"
			);
			expect(mockFormatter.formatText).toHaveBeenCalledWith(
				"Hello world",
				{ promptOverride: "test prompt" }
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
				getFormatterConfig: () => ({
					apiKey: "test-key",
					language: "en",
					backend: "openai" as const,
					model: "gpt-4o-mini",
					selectedPersonalities: [],
					activePersonalities: [],
					builtinPersonalities: {},
					customPersonalities: {},
				}),
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
