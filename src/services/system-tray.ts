import { SysTray } from "node-systray-v2";

export enum TrayState {
	IDLE = "idle",
	RECORDING = "recording",
	PROCESSING = "processing",
}

export interface TrayConfig {
	callbacks: {
		onRecordingStart: () => void;
		onRecordingStop: () => void;
		onPersonalityToggle: (personality: string) => void;
		onOpenConfig: () => void;
		onReload: () => Promise<void>;
		onQuit: () => void;
	};
	activePersonalities: string[];
	// Optional: which personalities should appear in the menu (strings like "builtin:default" or "custom:myCustomStyle")
	selectedPersonalities?: string[];
	// Optional: map of custom personality id -> { name }
	customPersonalities?: Record<string, { name?: string }>;
}

export interface TrayResult {
	success: boolean;
	error?: string;
}

const iconsBase64 = {
	[TrayState.IDLE]:
		"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",
	[TrayState.RECORDING]:
		"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",
	[TrayState.PROCESSING]:
		"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",
};

// Menu item types for routing
enum MenuItemType {
	START_RECORDING = "START_RECORDING",
	STOP_RECORDING = "STOP_RECORDING",
	SEPARATOR = "SEPARATOR",
	PERSONALITY = "PERSONALITY",
	OPEN_CONFIG = "OPEN_CONFIG",
	RELOAD_CONFIG = "RELOAD_CONFIG",
	EXIT = "EXIT",
}

// Map to track item types by their position in the menu
interface MenuItem {
	type: MenuItemType;
	title: string;
	tooltip: string;
	enabled: boolean;
	checked: boolean;
	personality?: string; // For PERSONALITY type
}

export class SystemTrayService {
	private systray: SysTray | null = null;
	private activePersonalities: string[];
	private currentState: TrayState = TrayState.IDLE;
	private callbacks: TrayConfig["callbacks"];
	private readonly SysTrayConstructor: typeof SysTray;

	// Personalities shown in the menu (full ids with prefix)
	private selectedPersonalities: string[];
	// Custom personalities map (id -> display name)
	private customPersonalities: Record<string, { name?: string }> = {};

	// Map to track what each menu position represents
	private menuItemMap: MenuItem[] = [];

	constructor(config: TrayConfig, systrayConstructor?: typeof SysTray) {
		this.callbacks = config.callbacks;
		this.activePersonalities = config.activePersonalities;
		this.SysTrayConstructor = systrayConstructor || SysTray;

		// Use provided selectedPersonalities or default to builtin list
		this.selectedPersonalities = config.selectedPersonalities ?? [
			"builtin:default",
			"builtin:professional",
			"builtin:technical",
			"builtin:creative",
			"builtin:emojify",
		];

		this.customPersonalities = config.customPersonalities ?? {};
	}

	public async initialize(): Promise<TrayResult> {
		try {
			// Create systray with node-systray-v2 API (requires base64 icon)
			const systray = new this.SysTrayConstructor({
				menu: {
					icon: this.getIconBase64(TrayState.IDLE),
					title: "Voice Transcriber",
					tooltip: "Voice Transcriber - Click to record",
					items: this.buildMenuItems(TrayState.IDLE),
				},
				debug: false,
				copyDir: true, // Utile pour packaging
			});

			// Click handling using position-based routing
			systray.onClick(action => {
				// Get the item type from our map using seq_id as position
				const menuItem = this.menuItemMap[action.seq_id];

				if (!menuItem) {
					return;
				}

				// Route based on item type
				switch (menuItem.type) {
					case MenuItemType.START_RECORDING:
						this.callbacks.onRecordingStart();
						break;
					case MenuItemType.STOP_RECORDING:
						this.callbacks.onRecordingStop();
						break;
					case MenuItemType.PERSONALITY:
						if (menuItem.personality) {
							this.callbacks.onPersonalityToggle(
								menuItem.personality
							);
						}
						break;
					case MenuItemType.OPEN_CONFIG:
						this.callbacks.onOpenConfig();
						break;
					case MenuItemType.RELOAD_CONFIG:
						void this.callbacks.onReload();
						break;
					case MenuItemType.EXIT:
						void this.callbacks.onQuit();
						break;
					case MenuItemType.SEPARATOR:
						// Ignore separator clicks
						break;
				}
			});

			// Wait for systray to be ready using onReady
			await new Promise<void>(resolve => {
				systray.onReady(() => resolve());
			});

			// Assign after successful initialization
			this.systray = systray;

			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to initialize: ${error}` };
		}
	}

	public getState(): TrayState {
		return this.currentState;
	}

	private getIconBase64(state: TrayState): string {
		return iconsBase64[state];
	}

	private getTooltip(state: TrayState): string {
		const tooltips = {
			[TrayState.IDLE]: "Voice Transcriber - Click to record",
			[TrayState.RECORDING]: "Recording... Click to stop",
			[TrayState.PROCESSING]: "Processing audio...",
		};
		return tooltips[state];
	}

	private buildMenuItems(state: TrayState) {
		// Reset the item map
		this.menuItemMap = [];

		// Labels for builtin personalities (keys are the suffix after "builtin:")
		const builtinLabels: Record<string, string> = {
			default: "Default",
			professional: "Professional",
			technical: "Technical",
			creative: "Creative",
			emojify: "Emojify",
		};

		// Build menu items and track their types
		const items: Array<{
			title: string;
			tooltip: string;
			checked: boolean;
			enabled: boolean;
		}> = [];

		// Add Start Recording
		this.menuItemMap.push({
			type: MenuItemType.START_RECORDING,
			title: "🎤 Start Recording",
			tooltip: "Start voice recording",
			enabled: state !== TrayState.RECORDING,
			checked: false,
		});
		items.push({
			title: "🎤 Start Recording",
			tooltip: "Start voice recording",
			checked: false,
			enabled: state !== TrayState.RECORDING,
		});

		// Add Stop Recording
		this.menuItemMap.push({
			type: MenuItemType.STOP_RECORDING,
			title: "⏹️ Stop Recording",
			tooltip: "Stop voice recording",
			enabled: state === TrayState.RECORDING,
			checked: false,
		});
		items.push({
			title: "⏹️ Stop Recording",
			tooltip: "Stop voice recording",
			checked: false,
			enabled: state === TrayState.RECORDING,
		});

		// Add separator
		this.menuItemMap.push({
			type: MenuItemType.SEPARATOR,
			title: "─────────────────",
			tooltip: "",
			enabled: false,
			checked: false,
		});
		items.push({
			title: "─────────────────",
			tooltip: "",
			enabled: false,
			checked: false,
		});

		// Add personality items based on selectedPersonalities from config.
		// Each entry is expected to be prefixed: "builtin:<key>" or "custom:<id>".
		this.selectedPersonalities.forEach(entry => {
			const personalityId = entry; // full id (used in callbacks / active checks)
			let label = entry;
			const isActive = this.activePersonalities.includes(personalityId);

			if (entry.startsWith("builtin:")) {
				const key = entry.split(":")[1];
				label = key ? builtinLabels[key] || key : entry;
			} else if (entry.startsWith("custom:")) {
				const key = entry.split(":")[1];
				label = key
					? this.customPersonalities[key]?.name || key
					: entry;
			} else {
				// Fallback: treat as direct key
				label = entry;
			}

			const title = `${isActive ? "✅" : "⬜"} ${label}`;

			this.menuItemMap.push({
				type: MenuItemType.PERSONALITY,
				title,
				tooltip: `Toggle ${label} personality`,
				enabled: true,
				checked: isActive,
				personality: personalityId,
			});
			items.push({
				title,
				tooltip: `Toggle ${label} personality`,
				checked: isActive,
				enabled: true,
			});
		});

		// Add separator
		this.menuItemMap.push({
			type: MenuItemType.SEPARATOR,
			title: "─────────────────",
			tooltip: "",
			enabled: false,
			checked: false,
		});
		items.push({
			title: "─────────────────",
			tooltip: "",
			enabled: false,
			checked: false,
		});

		// Add Open Config
		this.menuItemMap.push({
			type: MenuItemType.OPEN_CONFIG,
			title: "⚙️ Open Config",
			tooltip: "Open configuration file",
			enabled: true,
			checked: false,
		});
		items.push({
			title: "⚙️ Open Config",
			tooltip: "Open configuration file",
			checked: false,
			enabled: true,
		});

		// Add Reload Config
		this.menuItemMap.push({
			type: MenuItemType.RELOAD_CONFIG,
			title: "🔄 Reload Config",
			tooltip:
				state === TrayState.IDLE
					? "Reload configuration"
					: "Reload configuration (disabled while recording/processing)",
			enabled: state === TrayState.IDLE,
			checked: false,
		});
		items.push({
			title: "🔄 Reload Config",
			tooltip:
				state === TrayState.IDLE
					? "Reload configuration"
					: "Reload configuration (disabled while recording/processing)",
			checked: false,
			enabled: state === TrayState.IDLE,
		});

		// Add Exit
		this.menuItemMap.push({
			type: MenuItemType.EXIT,
			title: "❌ Exit",
			tooltip: "Quit application",
			enabled: true,
			checked: false,
		});
		items.push({
			title: "❌ Exit",
			tooltip: "Quit application",
			checked: false,
			enabled: true,
		});

		return items;
	}

	public async setState(state: TrayState): Promise<TrayResult> {
		try {
			this.currentState = state;

			if (!this.systray) {
				return { success: false, error: "System tray not initialized" };
			}

			// Build the menu items
			const menuItems = this.buildMenuItems(state);

			// Update entire menu (icon + items structure)
			this.systray.sendAction({
				type: "update-menu",
				menu: {
					icon: this.getIconBase64(state),
					title: "Voice Transcriber",
					tooltip: this.getTooltip(state),
					items: menuItems,
				},
				seq_id: 0,
			});

			// Force visual update of each item using update-item
			// This is necessary because update-menu alone doesn't refresh the visual state
			this.menuItemMap.forEach((menuItem, position) => {
				if (menuItem.type !== MenuItemType.SEPARATOR) {
					this.systray?.sendAction({
						type: "update-item",
						item: {
							title: menuItem.title,
							tooltip: menuItem.tooltip,
							checked: menuItem.checked,
							enabled: menuItem.enabled,
						},
						seq_id: position,
					});
				}
			});

			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to set state: ${error}` };
		}
	}

	public async shutdown(): Promise<TrayResult> {
		try {
			if (this.systray) {
				this.systray.kill();
			}
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to shutdown: ${error}` };
		}
	}

	public updateActivePersonalities(activePersonalities: string[]): void {
		this.activePersonalities = activePersonalities;
		// Force menu refresh with current state
		void this.setState(this.currentState);
	}

	/**
	 * Expose the current runtime state (copies) so other services can read active/selected personalities.
	 */
	public getRuntimeState(): {
		selectedPersonalities: string[];
		activePersonalities: string[];
	} {
		return {
			selectedPersonalities: this.selectedPersonalities.slice(),
			activePersonalities: this.activePersonalities.slice(),
		};
	}
}
