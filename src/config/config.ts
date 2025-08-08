import { homedir } from "node:os";
import { join } from "node:path";

export interface ConfigData {
	openaiApiKey: string;
	formatterEnabled: boolean;
}

export class Config {
	public openaiApiKey: string = "";
	public formatterEnabled: boolean = true;
	private readonly configPath: string;

	constructor(configPath?: string) {
		this.configPath = configPath ?? this.getUserConfigPath();
	}

	private getUserConfigPath(): string {
		return join(homedir(), ".config", "voice-transcriber", "config.json");
	}

	private getUserConfigDir(): string {
		return join(homedir(), ".config", "voice-transcriber");
	}

	public async load(): Promise<void> {
		try {
			const configFile = Bun.file(this.configPath);
			if (await configFile.exists()) {
				const data = (await configFile.json()) as Partial<ConfigData>;
				this.openaiApiKey = data.openaiApiKey || "";
				this.formatterEnabled = data.formatterEnabled ?? true;
			}
		} catch (_error) {
			// Use defaults if config fails to load
		}
	}

	public async loadWithSetup(): Promise<void> {
		await this.load();

		// If no config file exists and this is the default user config, run setup
		if (
			!(await Bun.file(this.configPath).exists()) &&
			this.configPath === this.getUserConfigPath()
		) {
			await this.setupWizard();
		}
	}

	private async setupWizard(): Promise<void> {
		console.log("🎤 Welcome to Voice Transcriber!");
		console.log("First-run setup: Creating configuration file...");
		console.log(`Config will be saved to: ${this.configPath}`);
		console.log("");
		console.log("⚠️  You need to add your OpenAI API key to the config file:");
		console.log("1. Get an API key from: https://platform.openai.com/api-keys");
		console.log(`2. Edit: ${this.configPath}`);
		console.log(
			'3. Add your key: {"openaiApiKey": "your-key-here", "formatterEnabled": true}',
		);
		console.log("");

		// Create default config file
		await this.save();
		console.log("✅ Configuration file created!");
		console.log("Please add your OpenAI API key and restart the application.");
	}

	public async save(): Promise<void> {
		// Only ensure config directory exists for user config path
		if (this.configPath === this.getUserConfigPath()) {
			await Bun.write(join(this.getUserConfigDir(), ".keep"), "");
		}

		const data: ConfigData = {
			openaiApiKey: this.openaiApiKey,
			formatterEnabled: this.formatterEnabled,
		};
		await Bun.write(this.configPath, JSON.stringify(data, null, 2));
	}
}
