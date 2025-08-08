import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock systray2 module completely before importing
const mockSystray = {
	onClick: mock(),
	sendAction: mock(),
	kill: mock(),
	ready: mock().mockResolvedValue(undefined),
};

const mockSystrayConstructor = mock(() => mockSystray);
mockSystrayConstructor.mockImplementation(() => mockSystray);

// Mock the module to match our import structure
mock.module("systray2", () => ({
	default: {
		default: mockSystrayConstructor,
	},
}));

import { SystemTrayService, type TrayConfig, TrayState } from "./system-tray";

describe("SystemTrayService", () => {
	let service: SystemTrayService;
	let config: TrayConfig;

	beforeEach(() => {
		mockSystrayConstructor.mockReset();
		mockSystray.onClick.mockReset();
		mockSystray.sendAction.mockReset();
		mockSystray.kill.mockReset();
		mockSystray.ready.mockReset().mockResolvedValue(undefined);

		config = {
			callbacks: {
				onRecordingStart: mock(),
				onRecordingStop: mock(),
				onQuit: mock(),
			},
		};

		service = new SystemTrayService(config, mockSystrayConstructor);
	});

	describe("initialize", () => {
		it("should initialize successfully", async () => {
			mockSystrayConstructor.mockReturnValue(mockSystray);

			const result = await service.initialize();
			expect(result.success).toBe(true);
			expect(mockSystrayConstructor).toHaveBeenCalled();
		});

		it("should handle constructor errors", async () => {
			// Reset and configure mock to throw
			mockSystrayConstructor.mockReset();
			mockSystrayConstructor.mockImplementation(() => {
				throw new Error("Mock constructor failed");
			});

			const result = await service.initialize();
			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to initialize");
		});
	});

	describe("setState", () => {
		beforeEach(async () => {
			mockSystrayConstructor.mockReturnValue(mockSystray);
			await service.initialize();
		});

		it("should update state", async () => {
			const result = await service.setState(TrayState.RECORDING);
			expect(result.success).toBe(true);
			expect(mockSystray.kill).toHaveBeenCalled();
			expect(mockSystrayConstructor).toHaveBeenCalledTimes(2); // Initial + recreation
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
			mockSystrayConstructor.mockReturnValue(mockSystray);
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
