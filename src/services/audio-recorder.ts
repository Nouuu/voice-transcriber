import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
			}

			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			this.currentFile = join(
				this.config.tempDir,
				`recording-${timestamp}.wav`
			);

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
			});

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
			this.recordingProcess.kill("SIGTERM");
			const filePath = this.currentFile;

			this.recordingProcess = null;
			this.currentFile = null;

			return { success: true, filePath: filePath || undefined };
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
