import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { convertWavToMp3 } from "./mp3-encoder";

describe("MP3 Encoder", () => {
	const testWavPath = "/tmp/test-audio.wav";
	const testMp3Path = "/tmp/test-audio.mp3";

	beforeEach(() => {
		// Clean up any existing test files
		if (existsSync(testWavPath)) unlinkSync(testWavPath);
		if (existsSync(testMp3Path)) unlinkSync(testMp3Path);
	});

	afterEach(() => {
		// Clean up test files
		if (existsSync(testWavPath)) unlinkSync(testWavPath);
		if (existsSync(testMp3Path)) unlinkSync(testMp3Path);
	});

	describe("convertWavToMp3", () => {
		it("should convert WAV to MP3 successfully", () => {
			// Create minimal valid WAV file (44 byte header + some PCM data)
			const wavHeader = createMinimalWavHeader(16000, 1, 1000); // 1 second of audio
			const pcmData = new Int16Array(16000); // 1 second at 16kHz
			for (let i = 0; i < pcmData.length; i++) {
				pcmData[i] = Math.sin((i * 440 * 2 * Math.PI) / 16000) * 32767; // 440Hz sine wave
			}

			const wavBuffer = Buffer.concat([
				wavHeader,
				Buffer.from(pcmData.buffer),
			]);
			writeFileSync(testWavPath, wavBuffer);

			// Convert to MP3
			convertWavToMp3(testWavPath, testMp3Path);

			// Verify MP3 file exists
			expect(existsSync(testMp3Path)).toBe(true);
		});

		it("should create MP3 file smaller than WAV", () => {
			// Create minimal WAV with CD quality (44.1kHz stereo like arecord -f cd)
			const wavHeader = createMinimalWavHeader(44100, 2, 1000);
			const pcmData = new Int16Array(44100 * 2); // 1 second stereo
			const wavBuffer = Buffer.concat([
				wavHeader,
				Buffer.from(pcmData.buffer),
			]);
			writeFileSync(testWavPath, wavBuffer);

			const wavSize = wavBuffer.length;

			// Convert
			convertWavToMp3(testWavPath, testMp3Path);

			// MP3 16kHz mono 64kbps should be ~95% smaller than 44.1kHz stereo WAV
			const mp3Stats = Bun.file(testMp3Path);
			expect(mp3Stats.size).toBeLessThan(wavSize * 0.1); // At most 10% of original size
		});
	});
});

/**
 * Creates a minimal valid WAV header
 */
function createMinimalWavHeader(
	sampleRate: number,
	channels: number,
	durationMs: number
): Buffer {
	const numSamples = (sampleRate * durationMs) / 1000;
	const dataSize = numSamples * channels * 2; // 16-bit samples
	const fileSize = 36 + dataSize;

	const header = Buffer.alloc(44);

	// RIFF header
	header.write("RIFF", 0);
	header.writeUInt32LE(fileSize, 4);
	header.write("WAVE", 8);

	// fmt chunk
	header.write("fmt ", 12);
	header.writeUInt32LE(16, 16); // chunk size
	header.writeUInt16LE(1, 20); // audio format (PCM)
	header.writeUInt16LE(channels, 22);
	header.writeUInt32LE(sampleRate, 24);
	header.writeUInt32LE(sampleRate * channels * 2, 28); // byte rate
	header.writeUInt16LE(channels * 2, 32); // block align
	header.writeUInt16LE(16, 34); // bits per sample

	// data chunk
	header.write("data", 36);
	header.writeUInt32LE(dataSize, 40);

	return header;
}