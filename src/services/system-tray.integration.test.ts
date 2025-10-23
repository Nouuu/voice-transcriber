import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { writeFileSync, existsSync, unlinkSync } from "node:fs";
import { VoiceTranscriberApp } from "../index";
import { AudioProcessor } from "./audio-processor";

// Integration test: toggle personality -> stop recording -> ensure FormatterService.formatText receives promptOverride

describe("Integration: system tray -> recording -> formatting", () => {
	let app: any;
	let testAudioFile: string;
	let capturedPromptOverride: any = null; // moved here so tests can assert on it

	beforeEach(() => {
		// Create minimal test audio file
		testAudioFile = "/tmp/test-integration-audio.mp3";
		writeFileSync(testAudioFile, Buffer.from([0xff, 0xfb, 0x90, 0x44]));

		// Instantiate the app but do NOT call initialize (we'll override internals)
		app = new (VoiceTranscriberApp as any)();

		// Ensure runtimeState exists
		app.runtimeState = { activePersonalities: [] };

		// Mock AudioRecorder
		const mockAudioRecorder = {
			isRecording: mock(() => true),
			startRecording: mock(() => Promise.resolve({ success: true })),
			stopRecording: mock(() =>
				Promise.resolve({ success: true, filePath: testAudioFile })
			),
		};

		// Mock SystemTrayService: getRuntimeState returns the app.runtimeState object (by reference)
		const mockSystemTrayService = {
			updateActivePersonalities: mock(),
			getRuntimeState: mock(() => app.runtimeState),
			setState: mock(() => Promise.resolve({ success: true })),
			getState: mock(() => "IDLE"),
		};

		// Mock TranscriptionService
		const mockTranscriptionService = {
			transcribe: mock(() =>
				Promise.resolve({ success: true, text: "Raw transcription" })
			),
		};

		// Mock FormatterService: capture promptOverride
		capturedPromptOverride = null; // reset before each test
		const mockFormatterService = {
			getPersonalityPrompt: mock((p: string) => `prompt:${p}`),
			formatText: mock((text: string, options: any) => {
				capturedPromptOverride = options?.promptOverride;
				return Promise.resolve({
					success: true,
					text: `Formatted: ${text}`,
				});
			}),
		};

		// Mock ClipboardService
		const mockClipboardService = {
			writeText: mock(() => Promise.resolve({ success: true })),
		};

		// Minimal config mock required by AudioProcessor
		const mockConfig = {
			benchmarkMode: false,
			getTranscriptionConfig: () => ({
				apiKey: "test",
				language: "en",
				prompt: "",
				backend: "openai",
				model: "whisper-1",
			}),
		} as any;

		// Create a real AudioProcessor wired with mocks so formatting is executed
		const audioProcessor = new AudioProcessor({
			config: mockConfig,
			transcriptionService: mockTranscriptionService as any,
			formatterService: mockFormatterService as any,
			clipboardService: mockClipboardService as any,
		});

		// Inject mocks into app (bypass private)
		app.audioRecorder = mockAudioRecorder;
		app.systemTrayService = mockSystemTrayService;
		app.transcriptionService = mockTranscriptionService;
		app.formatterService = mockFormatterService;
		app.clipboardService = mockClipboardService;
		app.audioProcessor = audioProcessor;
	});

	afterEach(() => {
		// Cleanup test audio file
		if (existsSync(testAudioFile)) {
			unlinkSync(testAudioFile);
		}
	});

	it("calls FormatterService.formatText with promptOverride when a personality is active", async () => {
		// Activate a personality using the app handler
		await (app as any).handlePersonalityToggle("builtin:creative");

		// Sanity: ensure runtimeState updated
		expect(app.runtimeState.activePersonalities).toContain(
			"builtin:creative"
		);

		// Stop recording which should trigger processing
		await (app as any).handleRecordingStop();

		// Expect formatText to have been called and captured promptOverride matches personality's prompt
		expect(
			(app.formatterService.formatText as any).mock.calls.length
		).toBeGreaterThan(0);
		expect(capturedPromptOverride).toBe("prompt:builtin:creative");
	});
});
