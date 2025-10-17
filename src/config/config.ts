import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface TranscriptionBackendConfig {
	backend: "openai" | "speaches";
	openai?: {
		apiKey?: string;
		model?: string;
	};
	speaches?: {
		url: string;
		apiKey?: string;
		model?: string;
	};
}

export interface ConfigData {
	language: string;
	formatterEnabled: boolean;
	transcriptionPrompt?: string | null;
	formattingPrompt?: string | null;
	benchmarkMode?: boolean;
	transcription?: TranscriptionBackendConfig;
}

export class Config {
	public language: string = "en";
	public formatterEnabled: boolean = true;
	public transcriptionPrompt: string | null = null;
	public formattingPrompt: string | null = null;
	public benchmarkMode: boolean = false;

	// Transcription backend configuration
	public transcriptionBackend: "openai" | "speaches" = "openai";
	public openaiApiKey: string = "";
	public openaiModel: string = "whisper-1";
	public speachesUrl: string = "http://localhost:8000/v1";
	public speachesApiKey: string = "none";
	public speachesModel: string = "Systran/faster-whisper-base";

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
		if (!existsSync(this.configPath)) {
			return;
		}

		try {
			const fileContent = readFileSync(this.configPath, "utf8");
			const data = JSON.parse(fileContent) as Partial<ConfigData>;

			this.language = data.language || "en";
			this.formatterEnabled = data.formatterEnabled ?? true;
			this.transcriptionPrompt = data.transcriptionPrompt ?? null;
			this.formattingPrompt = data.formattingPrompt ?? null;
			this.benchmarkMode = data.benchmarkMode ?? false;

			// Load transcription backend config
			if (data.transcription) {
				this.transcriptionBackend =
					data.transcription.backend || "openai";

				if (data.transcription.openai) {
					this.openaiApiKey =
						data.transcription.openai.apiKey || "";
					this.openaiModel =
						data.transcription.openai.model || "whisper-1";
				}

				if (data.transcription.speaches) {
					this.speachesUrl =
						data.transcription.speaches.url ||
						"http://localhost:8000/v1";
					this.speachesApiKey =
						data.transcription.speaches.apiKey || "none";
					this.speachesModel =
						data.transcription.speaches.model ||
						"Systran/faster-whisper-base";
				}
			}
		} catch (error) {
			throw new Error(
				`Failed to parse config file ${this.configPath}: ${error instanceof Error ? error.message : String(error)}`
			);
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
		this.transcriptionBackend = "openai";

		// Save using the new structure
		await this.save();

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
			language: this.language,
			formatterEnabled: this.formatterEnabled,
			transcriptionPrompt: this.transcriptionPrompt,
			formattingPrompt: this.formattingPrompt,
			transcription: {
				backend: this.transcriptionBackend,
				openai: {
					apiKey: this.openaiApiKey,
					model: this.openaiModel,
				},
				speaches: {
					url: this.speachesUrl,
					apiKey: this.speachesApiKey,
					model: this.speachesModel,
				},
			},
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
	 * Validates Speaches URL format
	 */
	private validateSpeachesUrl(url: string): boolean {
		try {
			const parsedUrl = new URL(url);
			return (
				parsedUrl.protocol === "http:" ||
				parsedUrl.protocol === "https:"
			);
		} catch {
			return false;
		}
	}

	/**
	 * Gets transcription service configuration
	 */
	public getTranscriptionConfig(): {
		apiKey: string;
		language: string;
		prompt: string;
		backend: "openai" | "speaches";
		model: string;
		speachesUrl?: string;
	} {
		// Validate Speaches URL if using Speaches backend
		if (this.transcriptionBackend === "speaches") {
			if (!this.validateSpeachesUrl(this.speachesUrl)) {
				throw new Error(`Invalid Speaches URL: ${this.speachesUrl}`);
			}
		}

		const apiKey =
			this.transcriptionBackend === "openai"
				? this.openaiApiKey
				: this.speachesApiKey;

		const model =
			this.transcriptionBackend === "openai"
				? this.openaiModel
				: this.speachesModel;

		return {
			apiKey,
			language: this.language,
			prompt:
				this.transcriptionPrompt ||
				this.buildTranscriptionPrompt(this.language),
			backend: this.transcriptionBackend,
			model,
			speachesUrl: this.speachesUrl,
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
