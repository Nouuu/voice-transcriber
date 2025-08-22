import { beforeEach, describe, expect, it, mock } from "bun:test";

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

import { SystemTrayService, type TrayConfig, TrayState } from "./system-tray";

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
				onQuit: mock(),
			},
		};

		service = new SystemTrayService(config, mockSysTrayConstructor);
	});

	describe("initialize", () => {
		it("should initialize successfully", async () => {
			mockSysTrayConstructor.mockReturnValue(mockSystray);
			// Mock onReady to call callback immediately
			mockSystray.onReady.mockImplementation((callback) => callback());

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
			mockSystray.onReady.mockImplementation((callback) => callback());
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
			const result = await uninitializedService.setState(TrayState.RECORDING);
			expect(result.success).toBe(false);
			expect(result.error).toContain("not initialized");
		});
	});

	describe("shutdown", () => {
		it("should shutdown successfully when initialized", async () => {
			mockSysTrayConstructor.mockReturnValue(mockSystray);
			// Mock onReady to call callback immediately
			mockSystray.onReady.mockImplementation((callback) => callback());
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
});
