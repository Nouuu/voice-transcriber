import { beforeEach, describe, expect, it, mock } from "bun:test";
import { SystemTrayService, type TrayConfig, TrayState } from "./system-tray";

// Mock node-systray-v2 module completely before importing
const mockSystray = {
	onClick: mock(),
	onReady: mock(),
	sendAction: mock(),
	kill: mock(),
};

const mockSysTrayConstructor = mock(() => mockSystray);
mockSysTrayConstructor.mockImplementation(() => mockSystray);

// Mock the module to match our import structure for node-systray-v2
mock.module("node-systray-v2", () => ({
	SysTray: mockSysTrayConstructor,
}));

describe("SystemTrayService", () => {
	let service: SystemTrayService;
	let config: TrayConfig;

	beforeEach(() => {
		mockSysTrayConstructor.mockReset();
		mockSystray.onClick.mockReset();
		mockSystray.onReady.mockReset();
		mockSystray.sendAction.mockReset();
		mockSystray.kill.mockReset();

		config = {
			callbacks: {
				onRecordingStart: mock(),
				onRecordingStop: mock(),
				onPersonalityToggle: mock(),
				onOpenConfig: mock(),
				onReload: mock(),
				onQuit: mock(),
			},
			activePersonalities: ["builtin:default"],
		};

		service = new SystemTrayService(
			config,
			mockSysTrayConstructor as unknown as typeof import("node-systray-v2").SysTray
		);
	});

	describe("initialize", () => {
		it("should initialize successfully", async () => {
			mockSysTrayConstructor.mockReturnValue(mockSystray);
			// Mock onReady to call callback immediately
			mockSystray.onReady.mockImplementation(callback => callback());

			const result = await service.initialize();
			expect(result.success).toBe(true);
			expect(mockSysTrayConstructor).toHaveBeenCalled();
		});

		it("should handle constructor errors", async () => {
			// Reset and configure mock to throw
			mockSysTrayConstructor.mockReset();
			mockSysTrayConstructor.mockImplementation(() => {
				throw new Error("Mock constructor failed");
			});

			const result = await service.initialize();
			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to initialize");
		});
	});

	describe("setState", () => {
		beforeEach(async () => {
			mockSysTrayConstructor.mockReturnValue(mockSystray);
			// Mock onReady to call callback immediately
			mockSystray.onReady.mockImplementation(callback => callback());
			await service.initialize();
		});

		it("should update state", async () => {
			const result = await service.setState(TrayState.RECORDING);
			expect(result.success).toBe(true);
			// node-systray-v2 uses sendAction instead of recreation
			expect(mockSystray.sendAction).toHaveBeenCalled();
		});

		it("should return error when not initialized", async () => {
			const uninitializedService = new SystemTrayService(config);
			const result = await uninitializedService.setState(
				TrayState.RECORDING
			);
			expect(result.success).toBe(false);
			expect(result.error).toContain("not initialized");
		});
	});

	describe("shutdown", () => {
		it("should shutdown successfully when initialized", async () => {
			mockSysTrayConstructor.mockReturnValue(mockSystray);
			// Mock onReady to call callback immediately
			mockSystray.onReady.mockImplementation(callback => callback());
			await service.initialize();

			const result = await service.shutdown();
			expect(result.success).toBe(true);
			expect(mockSystray.kill).toHaveBeenCalled();
		});

		it("should shutdown successfully when not initialized", async () => {
			const result = await service.shutdown();
			expect(result.success).toBe(true);
			// kill should not be called when not initialized
		});
	});

	describe("onClick routing", () => {
		beforeEach(async () => {
			mockSysTrayConstructor.mockReturnValue(mockSystray);
			mockSystray.onReady.mockImplementation(callback => callback());
			await service.initialize();
		});

		it("should route seq_id 0 to onRecordingStart", async () => {
			// Get the onClick callback that was registered
			const onClickCallback = mockSystray.onClick.mock.calls[0]?.[0];
			if (!onClickCallback) {
				throw new Error("onClick callback not registered");
			}

			// Simulate click on Start Recording (seq_id: 0)
			onClickCallback({ seq_id: 0, item: { title: "Start Recording" } });

			expect(config.callbacks.onRecordingStart).toHaveBeenCalled();
		});

		it("should route seq_id 1 to onRecordingStop", async () => {
			const onClickCallback = mockSystray.onClick.mock.calls[0]?.[0];
			if (!onClickCallback) {
				throw new Error("onClick callback not registered");
			}
			onClickCallback({ seq_id: 1, item: { title: "Stop Recording" } });
			expect(config.callbacks.onRecordingStop).toHaveBeenCalled();
		});

		it("should route personality clicks to onPersonalityToggle", async () => {
			const onClickCallback = mockSystray.onClick.mock.calls[0]?.[0];
			if (!onClickCallback) {
				throw new Error("onClick callback not registered");
			}
			// Personality items start after separator (seq_id 2 is separator, 3+ are personalities)
			onClickCallback({ seq_id: 3, item: { title: "Default" } });
			expect(config.callbacks.onPersonalityToggle).toHaveBeenCalled();
		});

		it("should route to onOpenConfig", async () => {
			const onClickCallback = mockSystray.onClick.mock.calls[0]?.[0];
			if (!onClickCallback) {
				throw new Error("onClick callback not registered");
			}
			// Adjust seq_id based on number of personalities (5 personalities + 3 separators + 2 actions = ~10)
			onClickCallback({ seq_id: 9, item: { title: "Open Config" } });
			expect(config.callbacks.onOpenConfig).toHaveBeenCalled();
		});

		it("should route to onReload", async () => {
			const onClickCallback = mockSystray.onClick.mock.calls[0]?.[0];
			if (!onClickCallback) {
				throw new Error("onClick callback not registered");
			}
			onClickCallback({ seq_id: 10, item: { title: "Reload Config" } });
			expect(config.callbacks.onReload).toHaveBeenCalled();
		});

		it("should route to onQuit", async () => {
			const onClickCallback = mockSystray.onClick.mock.calls[0]?.[0];
			if (!onClickCallback) {
				throw new Error("onClick callback not registered");
			}
			onClickCallback({ seq_id: 11, item: { title: "Exit" } });
			expect(config.callbacks.onQuit).toHaveBeenCalled();
		});
	});
});
