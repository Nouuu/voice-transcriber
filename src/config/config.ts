import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface ConfigData {
	openaiApiKey: string;
	formatterEnabled: boolean;
	spokenLanguage: string;
}

export class Config {
	public openaiApiKey: string = "";
	public formatterEnabled: boolean = true;
	public spokenLanguage: string = "en";
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
			if (existsSync(this.configPath)) {
				const fileContent = readFileSync(this.configPath, "utf8");
				const data = JSON.parse(fileContent) as Partial<ConfigData>;
				this.openaiApiKey = data.openaiApiKey || "";
				this.formatterEnabled = data.formatterEnabled ?? true;
				this.spokenLanguage = data.spokenLanguage || "en";
			}
		} catch {
			// Use defaults if config fails to load
		}
	}

	public async loadWithSetup(): Promise<void> {
		await this.load();

		// If no config file exists and this is the default user config, run setup
		if (
			!existsSync(this.configPath) &&
			this.configPath === this.getUserConfigPath()
		) {
			await this.setupWizard();
		}
	}

	private async setupWizard(): Promise<void> {
		if (existsSync(this.configPath)) {
			return;
		}

		console.log("🎤 Welcome to Voice Transcriber!");
		console.log("First-run setup...");
		console.log("");
		console.log("You need an OpenAI API key to use this application.");
		console.log("Get one from: https://platform.openai.com/api-keys");
		console.log("");

		const apiKey = await this.promptForApiKey();

		if (this.configPath === this.getUserConfigPath()) {
			mkdirSync(this.getUserConfigDir(), { recursive: true });
		}

		this.openaiApiKey = apiKey;
		this.formatterEnabled = true;

		const configData: ConfigData = {
			openaiApiKey: apiKey,
			formatterEnabled: true,
			spokenLanguage: "en",
		};
		writeFileSync(this.configPath, JSON.stringify(configData, null, 2));
		console.log("");
		console.log("✅ Configuration saved!");
		console.log(`Config file: ${this.configPath}`);
	}

	private async promptForApiKey(): Promise<string> {
		return new Promise(resolve => {
			process.stdout.write("Enter your OpenAI API key: ");
			process.stdin.once("data", data => {
				const apiKey = data.toString().trim();
				if (apiKey.length === 0) {
					console.log("API key cannot be empty. Exiting.");
					process.exit(1);
				}
				resolve(apiKey);
			});
		});
	}

	public async save(): Promise<void> {
		// Only ensure config directory exists for user config path
		if (this.configPath === this.getUserConfigPath()) {
			mkdirSync(this.getUserConfigDir(), { recursive: true });
		}

		const data: ConfigData = {
			openaiApiKey: this.openaiApiKey,
			formatterEnabled: this.formatterEnabled,
			spokenLanguage: this.spokenLanguage,
		};
		writeFileSync(this.configPath, JSON.stringify(data, null, 2));
	}
}
