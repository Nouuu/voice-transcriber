import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface ConfigData {
	openaiApiKey: string;
	language: string;
	formatterEnabled: boolean;
	transcriptionPrompt?: string | null;
	formattingPrompt?: string | null;
}

export class Config {
	public openaiApiKey: string = "";
	public language: string = "en";
	public formatterEnabled: boolean = true;
	public transcriptionPrompt: string | null = null;
	public formattingPrompt: string | null = null;
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
				this.language = data.language || "en";
				this.formatterEnabled = data.formatterEnabled ?? true;
				this.transcriptionPrompt = data.transcriptionPrompt ?? null;
				this.formattingPrompt = data.formattingPrompt ?? null;
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
		this.language = "en";
		this.formatterEnabled = true;

		const configData: ConfigData = {
			openaiApiKey: apiKey,
			language: "en",
			formatterEnabled: true,
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
			language: this.language,
			formatterEnabled: this.formatterEnabled,
			transcriptionPrompt: this.transcriptionPrompt,
			formattingPrompt: this.formattingPrompt,
		};
		writeFileSync(this.configPath, JSON.stringify(data, null, 2));
	}

	/**
	 * Builds a strong language-specific prompt for transcription
	 * This prevents Whisper from switching languages mid-transcription
	 */
	private buildTranscriptionPrompt(language: string): string {
		const languageNames: Record<string, string> = {
			fr: "French",
			en: "English",
			es: "Spanish",
			de: "German",
			it: "Italian",
		};

		const langName = languageNames[language] || "the spoken language";

		return `This is a ${langName} audio recording. Transcribe the entire audio in ${langName} only. Do NOT switch to English or translate. Keep all content in ${langName}, preserving ${langName} sentence structure and grammar throughout the entire transcription.`;
	}

	/**
	 * Builds a language-aware formatting prompt
	 */
	private buildFormattingPrompt(language: string): string {
		const languageNames: Record<string, string> = {
			fr: "French",
			en: "English",
			es: "Spanish",
			de: "German",
			it: "Italian",
		};

		const langName = languageNames[language] || "the original language";

		return `Format this ${langName} text with proper grammar, punctuation, and structure. Keep the text in ${langName}. Do not translate to another language.`;
	}

	/**
	 * Gets transcription service configuration
	 */
	public getTranscriptionConfig(): {
		apiKey: string;
		language: string;
		prompt: string;
	} {
		return {
			apiKey: this.openaiApiKey,
			language: this.language,
			prompt:
				this.transcriptionPrompt ||
				this.buildTranscriptionPrompt(this.language),
		};
	}

	/**
	 * Gets formatter service configuration
	 */
	public getFormatterConfig(): {
		apiKey: string;
		enabled: boolean;
		language: string;
		prompt: string;
	} {
		return {
			apiKey: this.openaiApiKey,
			enabled: this.formatterEnabled,
			language: this.language,
			prompt:
				this.formattingPrompt ||
				this.buildFormattingPrompt(this.language),
		};
	}
}
