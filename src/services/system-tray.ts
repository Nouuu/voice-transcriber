import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as systrayModule from "systray2";

// Extract systray constructor resolution for easier testing
function getSysTrayConstructor(module: any): any {
	return module.default?.default || module.default || module;
}

const SysTray = getSysTrayConstructor(systrayModule);

export enum TrayState {
	IDLE = "idle",
	RECORDING = "recording",
	PROCESSING = "processing",
}

export interface TrayConfig {
	callbacks: {
		onRecordingStart: () => void;
		onRecordingStop: () => void;
		onQuit: () => void;
	};
}

export interface TrayResult {
	success: boolean;
	error?: string;
}

interface MenuItem {
	title: string;
	tooltip: string;
	checked: boolean;
	enabled: boolean;
	click: () => void;
}
interface UpdateAction {
	type: "update-item";
	item: MenuItem;
}

interface SysTrayInstance {
	onClick(callback: (action: { item: MenuItem }) => void): void;
	sendAction(action: UpdateAction): Promise<void>;
	kill(force: boolean): void;
	ready(): Promise<void>;
}

export class SystemTrayService {
	private systray: SysTrayInstance | null = null;
	private currentState: TrayState = TrayState.IDLE;
	private callbacks: TrayConfig["callbacks"];
	private startItem: MenuItem | null = null;
	private stopItem: MenuItem | null = null;
	private quitItem: MenuItem | null = null;
	private SysTrayConstructor: any;

	constructor(config: TrayConfig, systrayConstructor?: any) {
		this.callbacks = config.callbacks;
		this.SysTrayConstructor = systrayConstructor || SysTray;
	}

	public async initialize(): Promise<TrayResult> {
		try {
			// Create menu items as separate objects (this is required by systray2)
			const startItem: MenuItem = {
				title: "🎤 Start Recording",
				tooltip: "Start voice recording",
				checked: false,
				enabled: true,
				click: () => {
					console.log("Start Recording clicked");
					this.callbacks.onRecordingStart();
				},
			};

			const stopItem: MenuItem = {
				title: "⏹️ Stop Recording",
				tooltip: "Stop voice recording",
				checked: false,
				enabled: true,
				click: () => {
					console.log("Stop Recording clicked");
					this.callbacks.onRecordingStop();
				},
			};

			const quitItem: MenuItem = {
				title: "❌ Exit",
				tooltip: "Exit application",
				checked: false,
				enabled: true,
				click: () => {
					console.log("Exit clicked");
					this.callbacks.onQuit();
				},
			};

			const systray = new this.SysTrayConstructor({
				menu: {
					icon: this.getIconPath(TrayState.IDLE),
					title: "Voice Transcriber",
					tooltip: "Voice Transcriber - Click to record",
					items: [startItem, stopItem, quitItem],
				},
			});

			// Store references to menu items for later updates
			this.startItem = startItem;
			this.stopItem = stopItem;
			this.quitItem = quitItem;

			// Proper click handling according to systray2 API
			systray.onClick((action) => {
				console.log(`Menu item clicked:`, action.item.title);
				if (action.item.click) {
					action.item.click();
				}
			});

			// Wait for systray to be ready
			await systray.ready();

			// Assign after successful initialization
			this.systray = systray;
			console.log("System tray initialized successfully");

			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to initialize: ${error}` };
		}
	}

	private getIconPath(state: TrayState): string {
		const icons = {
			[TrayState.IDLE]: this.getAssetPath("icon-idle.png"),
			[TrayState.RECORDING]: this.getAssetPath("icon-recording.png"),
			[TrayState.PROCESSING]: this.getAssetPath("icon-processing.png"),
		};
		return icons[state];
	}

	private getAssetPath(filename: string): string {
		// Modern and robust asset resolution for development and npm package
		let moduleDir: string;

		// Use import.meta.dirname if available (Node.js 20.11+)
		if (typeof import.meta.dirname !== "undefined") {
			moduleDir = import.meta.dirname;
		} else {
			// Fallback for older Node.js versions
			moduleDir = dirname(fileURLToPath(import.meta.url));
		}

		// Case 1: Source development - from src/services/ to assets/
		// Structure: /project/src/services/system-tray.ts → /project/assets/
		const srcPath = join(moduleDir, "../../assets", filename);
		if (existsSync(srcPath)) {
			return srcPath;
		}

		// Case 2: Built npm package - from dist/ to assets/
		// Structure: /node_modules/voice-transcriber/dist/system-tray.js → /node_modules/voice-transcriber/assets/
		const npmPath = join(moduleDir, "../assets", filename);
		if (existsSync(npmPath)) {
			return npmPath;
		}

		// Case 3: Development at package root
		// Structure: /project/system-tray.ts → /project/assets/
		const devPath = join(moduleDir, "assets", filename);
		if (existsSync(devPath)) {
			return devPath;
		}

		// Fallback: current working directory (compatibility)
		const cwdPath = join(process.cwd(), "assets", filename);
		if (existsSync(cwdPath)) {
			return cwdPath;
		}

		throw new Error(`Asset ${filename} not found in any expected location`);
	}

	private getTooltip(state: TrayState): string {
		const tooltips = {
			[TrayState.IDLE]: "Voice Transcriber - Click to record",
			[TrayState.RECORDING]: "Recording... Click to stop",
			[TrayState.PROCESSING]: "Processing audio...",
		};
		return tooltips[state];
	}

	public async setState(state: TrayState): Promise<TrayResult> {
		try {
			const oldState = this.currentState;
			this.currentState = state;

			console.log(`State changed from ${oldState} to ${state}`);

			if (!this.systray) {
				return { success: false, error: "System tray not initialized" };
			}

			// Update menu visibility based on state
			if (this.startItem && this.stopItem) {
				if (state === TrayState.RECORDING) {
					this.startItem.enabled = false;
					this.stopItem.enabled = true;
				} else {
					this.startItem.enabled = true;
					this.stopItem.enabled = state !== TrayState.PROCESSING;
				}
			}

			// Update tray icon by recreating the systray
			// This is a workaround since node-systray doesn't support dynamic icon updates
			this.systray.kill(false);

			// Recreate systray with new icon and updated menu items
			const newSystray = new this.SysTrayConstructor({
				menu: {
					icon: this.getIconPath(state),
					title: "Voice Transcriber",
					tooltip: this.getTooltip(state),
					items: [this.startItem!, this.stopItem!, this.quitItem!],
				},
			});

			// Re-setup click handler
			newSystray.onClick((action) => {
				console.log(`Menu item clicked:`, action.item.title);
				if (action.item.click) {
					action.item.click();
				}
			});

			// Wait for systray to be ready
			await newSystray.ready();

			// Assign after successful initialization
			this.systray = newSystray;
			console.log(`Tray icon updated to: ${this.getIconPath(state)}`);

			return { success: true };
		} catch (error) {
			console.log(`Failed to update state: ${error}`);
			return { success: false, error: `Failed to set state: ${error}` };
		}
	}

	public async shutdown(): Promise<TrayResult> {
		try {
			if (this.systray) {
				this.systray.kill(false); // Pass false parameter as shown in documentation
			}
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to shutdown: ${error}` };
		}
	}
}
