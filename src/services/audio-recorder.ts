import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { convertWavToMp3 } from "../utils/mp3-encoder";
import { logger } from "../utils/logger";

export interface AudioRecorderConfig {
	tempDir?: string;
}

interface AudioRecorderInternalConfig {
	tempDir: string;
}

export interface RecordingResult {
	success: boolean;
	filePath?: string;
	error?: string;
}

export class AudioRecorder {
	private config: AudioRecorderInternalConfig;
	private recordingProcess: ChildProcess | null = null;
	private currentFile: string | null = null;
	private recordingStartTime: number | null = null;

	constructor(config: AudioRecorderConfig = {}) {
		this.config = {
			tempDir: join(tmpdir(), "transcriber"),
			...config,
		};
	}

	public async startRecording(): Promise<RecordingResult> {
		if (this.recordingProcess) {
			return { success: false, error: "Already recording" };
		}

		try {
			if (!existsSync(this.config.tempDir)) {
				mkdirSync(this.config.tempDir, { recursive: true });
				logger.debug(`Created temp directory: ${this.config.tempDir}`);
			}

			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			this.currentFile = join(
				this.config.tempDir,
				`recording-${timestamp}.wav`
			);

			this.recordingStartTime = Date.now();
			logger.debug(`Starting audio recording to: ${this.currentFile}`);

			this.recordingProcess = spawn("arecord", [
				"-f",
				"cd",
				"-t",
				"wav",
				"-D",
				"default",
				this.currentFile,
			]);

			this.recordingProcess.on("error", () => {
				this.recordingProcess = null;
				this.currentFile = null;
				this.recordingStartTime = null;
			});

			logger.info("Audio recording started");
			return { success: true, filePath: this.currentFile };
		} catch (error) {
			return {
				success: false,
				error: `Failed to start recording: ${error}`,
			};
		}
	}

	public async stopRecording(): Promise<RecordingResult> {
		if (!this.recordingProcess) {
			return { success: false, error: "Not recording" };
		}

		try {
			const recordingDuration = this.recordingStartTime
				? ((Date.now() - this.recordingStartTime) / 1000).toFixed(2)
				: "unknown";

			logger.debug(
				`Stopping audio recording (duration: ${recordingDuration}s)`
			);

			this.recordingProcess.kill("SIGTERM");
			const wavPath = this.currentFile;

			this.recordingProcess = null;
			this.currentFile = null;
			this.recordingStartTime = null;

			if (!wavPath || !existsSync(wavPath)) {
				return { success: false, error: "Recording file not found" };
			}

			logger.debug(`Converting WAV to MP3: ${wavPath}`);

			// Convert WAV to MP3 (75% size reduction)
			const mp3Path = wavPath.replace(".wav", ".mp3");
			convertWavToMp3(wavPath, mp3Path);

			// Delete WAV file to save space
			unlinkSync(wavPath);
			logger.debug(`Deleted original WAV file: ${wavPath}`);

			logger.info(`Audio recording stopped and converted to MP3`);
			return { success: true, filePath: mp3Path };
		} catch (error) {
			return {
				success: false,
				error: `Failed to stop recording: ${error}`,
			};
		}
	}

	public isRecording(): boolean {
		return this.recordingProcess !== null;
	}
}
