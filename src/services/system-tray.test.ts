import { describe, it, expect, beforeEach, mock } from "bun:test";

// Mock systray2 module completely before importing
const mockSystray = {
  onClick: mock(),
  sendAction: mock(),
  kill: mock(),
  ready: mock().mockResolvedValue(undefined)
};

const mockSystrayConstructor = mock(() => mockSystray);
mockSystrayConstructor.mockImplementation(() => mockSystray);

// Mock the module
mock.module("systray2", () => ({
  default: mockSystrayConstructor
}));

import { SystemTrayService, TrayConfig, TrayState } from "./system-tray";

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
        onQuit: mock()
      }
    };

    service = new SystemTrayService(config);
  });

  describe("initialize", () => {
    it("should initialize successfully", async () => {
      mockSystrayConstructor.mockReturnValueOnce(mockSystray);
      
      const result = await service.initialize();
      expect(result.success).toBe(true);
    });

    it("should handle errors", async () => {
      mockSystrayConstructor.mockImplementationOnce(() => {
        throw new Error("Failed");
      });
      
      const result = await service.initialize();
      expect(result.success).toBe(false);
    });
  });

  describe("setState", () => {
    beforeEach(async () => {
      mockSystrayConstructor.mockReturnValueOnce(mockSystray);
      await service.initialize();
    });

    it("should update state", async () => {
      // Mock the constructor to return a new systray instance after recreation
      mockSystrayConstructor.mockReturnValue(mockSystray);
      
      const result = await service.setState(TrayState.RECORDING);
      expect(result.success).toBe(true);
      expect(mockSystray.kill).toHaveBeenCalled();
      expect(mockSystrayConstructor).toHaveBeenCalledTimes(2); // Initial + recreation
    });

    it("should handle errors", async () => {
      mockSystray.sendAction.mockImplementationOnce(() => {
        throw new Error("Failed");
      });
      
      const result = await service.setState(TrayState.RECORDING);
      expect(result.success).toBe(false);
    });
  });

  describe("shutdown", () => {
    beforeEach(async () => {
      mockSystrayConstructor.mockReturnValueOnce(mockSystray);
      await service.initialize();
    });

    it("should shutdown successfully", async () => {
      const result = await service.shutdown();
      expect(result.success).toBe(true);
      expect(mockSystray.kill).toHaveBeenCalled();
    });
  });
});