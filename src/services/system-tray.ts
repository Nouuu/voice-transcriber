import SysTray from "systray2";

export enum TrayState {
  IDLE = "idle",
  RECORDING = "recording",
  PROCESSING = "processing"
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

interface MenuConfig {
  icon: string;
  title: string;
  tooltip: string;
  items: MenuItem[];
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
  private callbacks: TrayConfig['callbacks'];
  private startItem: MenuItem | null = null;
  private stopItem: MenuItem | null = null;
  private quitItem: MenuItem | null = null;

  constructor(config: TrayConfig) {
    this.callbacks = config.callbacks;
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
        }
      };

      const stopItem: MenuItem = {
        title: "⏹️ Stop Recording",
        tooltip: "Stop voice recording", 
        checked: false,
        enabled: true,
        click: () => {
          console.log("Stop Recording clicked");
          this.callbacks.onRecordingStop();
        }
      };

      const quitItem: MenuItem = {
        title: "❌ Exit",
        tooltip: "Exit application",
        checked: false,
        enabled: true,
        click: () => {
          console.log("Exit clicked");
          this.callbacks.onQuit();
        }
      };

      this.systray = new SysTray({
        menu: {
          icon: "assets/icon-idle.png",
          title: "Voice Transcriber",
          tooltip: "Voice Transcriber - Click to record",
          items: [startItem, stopItem, quitItem]
        }
      });

      // Store references to menu items for later updates
      this.startItem = startItem;
      this.stopItem = stopItem;
      this.quitItem = quitItem;

      // Proper click handling according to systray2 API
      this.systray.onClick((action) => {
        console.log(`Menu item clicked:`, action.item.title);
        if (action.item.click) {
          action.item.click();
        }
      });

      // Wait for systray to be ready
      await this.systray.ready();
      console.log('System tray initialized successfully');

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to initialize: ${error}` };
    }
  }

  private getIconPath(state: TrayState): string {
    // Use actual image files
    const icons = {
      [TrayState.IDLE]: "assets/icon-idle.png",
      [TrayState.RECORDING]: "assets/icon-recording.png", 
      [TrayState.PROCESSING]: "assets/icon-processing.png"
    };
    return icons[state];
  }

  private getTooltip(state: TrayState): string {
    const tooltips = {
      [TrayState.IDLE]: "Voice Transcriber - Click to record",
      [TrayState.RECORDING]: "Recording... Click to stop",
      [TrayState.PROCESSING]: "Processing audio..."
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
        
        // Update the menu items
        await this.systray.sendAction({
          type: "update-item",
          item: this.startItem
        });
        
        await this.systray.sendAction({
          type: "update-item", 
          item: this.stopItem
        });
      }
      
      // Update tray icon and tooltip by recreating the systray
      // This is a workaround since systray2 has limited update capabilities
      const newConfig = {
        menu: {
          icon: this.getIconPath(state),
          title: "Voice Transcriber",
          tooltip: this.getTooltip(state),
          items: [this.startItem!, this.stopItem!, this.quitItem!]
        }
      };
      
      // Note: For now we'll just log the state change
      // Full icon updates may require systray recreation
      console.log(`Tray should show: ${this.getIconPath(state)}`);

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