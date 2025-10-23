import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { logger } from "../utils/logger";

export interface PersonalityConfig {
	name: string;
	description?: string;
	prompt?: string | null;
}

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

export interface FormatterBackendConfig {
	backend: "openai" | "ollama";
	openai?: {
		apiKey?: string;
		model?: string;
	};
	ollama?: {
		url: string;
		model?: string;
	};
}

export interface ConfigData {
	language: string;
	transcriptionPrompt?: string | null;
	benchmarkMode?: boolean;
	transcription?: TranscriptionBackendConfig;
	formatter?: FormatterBackendConfig;

	// Formatter personalities system
	customPersonalities?: Record<string, PersonalityConfig> | null;
	selectedPersonalities?: string[] | null;
	activePersonalities?: string[] | null;
}

export class Config {
	public language: string = "en";
	public transcriptionPrompt: string | null = null;
	public benchmarkMode: boolean = false;

	// Use the personalities system (builtin + custom + activePersonalities / selectedPersonalities)

	// Transcription backend fields
	public transcriptionBackend: "openai" | "speaches" = "openai";
	public openaiApiKey: string = "";
	public openaiModel: string = "whisper-1";
	public speachesUrl: string = "http://localhost:8000/v1";
	public speachesApiKey: string = "none";
	public speachesModel: string = "Systran/faster-whisper-base";

	// Formatter backend fields (separate from transcription)
	public formatterBackend: "openai" | "ollama" = "openai";
	public formatterOpenaiApiKey: string = "";
	public formatterOpenaiModel: string = "gpt-4o-mini";
	public formatterOllamaUrl: string = "http://localhost:11434";
	public formatterOllamaModel: string = "llama3.1:8b";

	// Builtin personalities (immutable, always available)
	private readonly builtinPersonalities: Record<string, PersonalityConfig> = {
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

	// Custom personalities (from user config file)
	public customPersonalities: Record<string, PersonalityConfig> = {};

	// Selected personalities (visible in menu, builtin + custom)
	public selectedPersonalities: string[] = [
		"builtin:default",
		"builtin:professional",
		"builtin:technical",
		"builtin:creative",
		"builtin:emojify",
	];

	// Active personalities (checked by default) - controls formatting
	public activePersonalities: string[] = ["builtin:default"];

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
		const fileExists = existsSync(this.configPath);
		if (!fileExists) {
			logger.warn(
				`Config file not found at ${this.configPath}. Using default configuration values.`
			);
			return;
		}

		try {
			const fileContent = readFileSync(this.configPath, "utf8");
			const data = JSON.parse(fileContent) as Partial<ConfigData>;

			this.language = data.language || "en";
			this.transcriptionPrompt = data.transcriptionPrompt ?? null;
			this.benchmarkMode = data.benchmarkMode ?? false;

			// Note: do not map any legacy "formatter*" fields. Only modern
			// personalities fields are considered below.

			// Load custom personalities from user config
			if (data.customPersonalities) {
				this.customPersonalities = data.customPersonalities;
			}

			// Load selected personalities (which ones appear in menu)
			if (data.selectedPersonalities) {
				this.selectedPersonalities = data.selectedPersonalities;
			}

			// Load active personalities (which ones are checked)
			if (data.activePersonalities) {
				this.activePersonalities = data.activePersonalities;
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

			// Load formatter backend config (separate from transcription)
			if (data.formatter) {
				this.formatterBackend = data.formatter.backend || "openai";

				if (data.formatter.openai) {
					this.formatterOpenaiApiKey =
						data.formatter.openai.apiKey || "";
					this.formatterOpenaiModel =
						data.formatter.openai.model || "gpt-4o-mini";
				}

				if (data.formatter.ollama) {
					this.formatterOllamaUrl =
						data.formatter.ollama.url || "http://localhost:11434";
					this.formatterOllamaModel =
						data.formatter.ollama.model || "llama3.1:8b";
				}
			} else {
				// Migration: If no formatter config exists, use transcription OpenAI key as default
				if (this.openaiApiKey) {
					logger.info(
						"No formatter config found. Using transcription OpenAI key for formatter."
					);
					this.formatterOpenaiApiKey = this.openaiApiKey;
				}
			}
		} catch (error) {
			throw new Error(
				`Failed to parse config file ${this.configPath}: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	public async loadWithSetup(): Promise<void> {
		const fileExists = existsSync(this.configPath);
		await this.load();

		// If no config file exists and this is the default user config, run setup
		if (!fileExists && this.configPath === this.getUserConfigPath()) {
			await this.setupWizard();
			return;
		}

		// Persist the current modern configuration shape back to disk.
		await this.save();
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
		this.formatterOpenaiApiKey = apiKey; // Use same key for formatter by default
		this.language = "en";
		this.transcriptionBackend = "openai";
		this.formatterBackend = "openai";

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
			transcriptionPrompt: this.transcriptionPrompt,
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
			formatter: {
				backend: this.formatterBackend,
				openai: {
					apiKey: this.formatterOpenaiApiKey,
					model: this.formatterOpenaiModel,
				},
				ollama: {
					url: this.formatterOllamaUrl,
					model: this.formatterOllamaModel,
				},
			},
			customPersonalities: this.customPersonalities,
			activePersonalities: this.activePersonalities,
		};
		// Persist only the modern config structure (no legacy keys)
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
		language: string;
		activePersonalities: string[];
		builtinPersonalities: Record<string, PersonalityConfig>;
		customPersonalities: Record<string, PersonalityConfig>;
		backend: "openai" | "ollama";
		model: string;
		ollamaUrl?: string;
		prompt?: string | null;
	} {
		const apiKey =
			this.formatterBackend === "openai"
				? this.formatterOpenaiApiKey
				: "";

		const model =
			this.formatterBackend === "openai"
				? this.formatterOpenaiModel
				: this.formatterOllamaModel;

		return {
			apiKey,
			language: this.language,
			activePersonalities: this.activePersonalities,
			builtinPersonalities: this.builtinPersonalities,
			customPersonalities: this.customPersonalities,
			backend: this.formatterBackend,
			model,
			ollamaUrl: this.formatterOllamaUrl,
			prompt: this.transcriptionPrompt ?? null,
		};
	}
}
