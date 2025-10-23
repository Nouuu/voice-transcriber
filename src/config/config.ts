import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { logger } from "../utils/logger";

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

	// New fields for formatter personalities
	formatterPersonality?: string | null;
	formatterPersonalityEnabled?: boolean | null;
	formatterPersonalities?: Record<
		string,
		{ name: string; description?: string; prompt?: string | null }
	> | null;
	// Persisted ordered selection of personalities
	selectedPersonalities?: string[] | null;
}

export class Config {
	public language: string = "en";
	public formatterEnabled: boolean = true;
	public transcriptionPrompt: string | null = null;
	public formattingPrompt: string | null = null;
	public benchmarkMode: boolean = false;

	// Restore transcription backend fields that were accidentally removed
	public transcriptionBackend: "openai" | "speaches" = "openai";
	public openaiApiKey: string = "";
	public openaiModel: string = "whisper-1";
	public speachesUrl: string = "http://localhost:8000/v1";
	public speachesApiKey: string = "none";
	public speachesModel: string = "Systran/faster-whisper-base";

	// New formatter personality settings
	public formatterPersonality: string = "default";
	public formatterPersonalityEnabled: boolean = false;
	public formatterPersonalities: Record<
		string,
		{ name: string; description?: string; prompt?: string | null }
	> = {
		default: {
			name: "Default",
			description: "Minimal formatting - Fix grammar only",
			prompt: "Format the text with correct grammar and punctuation. Do not translate the text; keep it in the original language.",
		},
		professional: {
			name: "Professional",
			description: "Business communication style",
			prompt: "Format as professional business communication. Use formal tone, clear structure, and proper punctuation. Suitable for emails and reports. Do not translate the text; keep it in the original language.",
		},
		technical: {
			name: "Technical",
			description: "Technical documentation style",
			prompt: "Format for technical documentation. Preserve technical terms, code references, and precision. Use clear, concise language. Do not translate the text; keep it in the original language.",
		},
		creative: {
			name: "Creative",
			description: "Expressive and natural style",
			prompt: "Format naturally with expressive language. Maintain personality and tone. Make it engaging and conversational. Do not translate the text; keep it in the original language.",
		},
		emojify: {
			name: "Emojify",
			description: "Lightly add a few emojis to convey tone (max 3).",
			prompt: "Lightly add context-appropriate emojis to the text, adapting the number to the text length: for very short texts (<40 characters) add at most 1 emoji; for medium texts (40–120 characters) add up to 2 emojis; for long texts (>120 characters) add up to 3 emojis. Do not add more than 3 emojis in total. Keep the original wording and meaning intact, do not translate the text; keep it in the original language. Return only the final text with emojis added inline where appropriate.",
		},
	};

	// Ordered list of selected personalities (runtime selection or persisted if user saves)
	public selectedPersonalities: string[] = [];

	private readonly configPath: string;

	constructor(configPath?: string) {
		this.configPath = configPath ?? this.getUserConfigPath();
	}

	public getConfigPath(): string {
		return this.configPath;
	}

	private getUserConfigPath(): string {
		return join(homedir(), ".config", "voice-transcriber", "config.json");
	}

	private getUserConfigDir(): string {
		return join(homedir(), ".config", "voice-transcriber");
	}

	public async load(): Promise<void> {
		if (!existsSync(this.configPath)) {
			logger.warn(
				`Config file not found at ${this.configPath}. Using default configuration values.`
			);
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

			// If user provided a legacy formattingPrompt, ensure it populates the default personality prompt
			if (
				this.formattingPrompt &&
				!this.formatterPersonalities?.["default"]?.prompt
			) {
				// Ensure the default personality entry exists
				if (!this.formatterPersonalities["default"]) {
					this.formatterPersonalities["default"] = {
						name: "Default",
						description: "Minimal formatting - Fix grammar only",
						prompt: null,
					};
				}

				this.formatterPersonalities["default"].prompt =
					`${this.formattingPrompt}. Do not translate the text; keep it in the original language.`;
			}

			// Load new personality fields if present
			if (data.formatterPersonality) {
				this.formatterPersonality = data.formatterPersonality;
			}
			if (typeof data.formatterPersonalityEnabled === "boolean") {
				this.formatterPersonalityEnabled =
					data.formatterPersonalityEnabled;
			}
			if (data.formatterPersonalities) {
				this.formatterPersonalities = {
					...this.formatterPersonalities,
					...data.formatterPersonalities,
				};
			}

			// Load transcription backend config
			if (data.transcription) {
				this.transcriptionBackend =
					data.transcription.backend || "openai";

				if (data.transcription.openai) {
					this.openaiApiKey = data.transcription.openai.apiKey || "";
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
			benchmarkMode: this.benchmarkMode,
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

			// new fields
			formatterPersonality: this.formatterPersonality,
			formatterPersonalityEnabled: this.formatterPersonalityEnabled,
			formatterPersonalities: this.formatterPersonalities,
			selectedPersonalities: this.selectedPersonalities,
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
		personalityName: string | null;
		personalityPrompt: string | null;
		personalityEnabled: boolean;
		selectedPersonalities: string[];
		personalities: Record<
			string,
			{ name: string; description?: string; prompt?: string | null }
		>;
	} {
		const personalityPrompt =
			this.formatterPersonalities[this.formatterPersonality]?.prompt ||
			null;

		return {
			apiKey: this.openaiApiKey,
			enabled: this.formatterEnabled,
			language: this.language,
			prompt:
				this.formattingPrompt ||
				this.buildFormattingPrompt(this.language),
			personalityName: this.formatterPersonality || null,
			personalityPrompt,
			personalityEnabled: this.formatterPersonalityEnabled,
			selectedPersonalities: this.selectedPersonalities,
			personalities: this.formatterPersonalities,
		};
	}
}
