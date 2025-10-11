import { readFileSync, writeFileSync, statSync } from "node:fs";
import * as lamejs from "@breezystack/lamejs";
import { logger } from "./logger";

/**
 * Simple MP3 encoder utility
 * Converts WAV to MP3 with mono 16kHz optimization for voice transcription
 */
export function convertWavToMp3(wavPath: string, mp3Path: string): void {
	const startTime = Date.now();

	const wavBuffer = readFileSync(wavPath);
	const wavSize = statSync(wavPath).size;
	const wavSizeMB = (wavSize / 1024 / 1024).toFixed(2);

	logger.debug(`WAV file size: ${wavSizeMB} MB (${wavSize} bytes)`);

	// Parse WAV header
	const channels = wavBuffer.readUInt16LE(22);
	const sampleRate = wavBuffer.readUInt32LE(24);
	const dataOffset = 44;

	logger.debug(
		`WAV format: ${channels} channel(s), ${sampleRate} Hz sample rate`
	);

	// Extract PCM data as Int16Array
	const pcmData = new Int16Array(
		wavBuffer.buffer,
		wavBuffer.byteOffset + dataOffset,
		(wavBuffer.length - dataOffset) / 2
	);

	// Convert stereo to mono + downsample to 16kHz for voice optimization
	const targetSampleRate = 16000;
	const monoData = convertToMono(pcmData, channels);
	const downsampled = downsample(monoData, sampleRate, targetSampleRate);

	logger.debug(
		`Audio downsampled from ${sampleRate} Hz to ${targetSampleRate} Hz`
	);

	// MP3 encoder: mono 16kHz at 64kbps (optimal for voice transcription)
	const mp3encoder = new lamejs.Mp3Encoder(1, targetSampleRate, 64);
	const mp3Data: Uint8Array[] = [];

	// Encode PCM to MP3 in chunks
	const sampleBlockSize = 1152;
	for (let i = 0; i < downsampled.length; i += sampleBlockSize) {
		const sampleChunk = downsampled.subarray(i, i + sampleBlockSize);
		const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
		if (mp3buf.length > 0) {
			mp3Data.push(new Uint8Array(mp3buf));
		}
	}

	const remaining = mp3encoder.flush();
	if (remaining.length > 0) {
		mp3Data.push(new Uint8Array(remaining));
	}

	// Combine all MP3 chunks
	const totalLength = mp3Data.reduce((acc, arr) => acc + arr.length, 0);
	const finalMp3 = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of mp3Data) {
		finalMp3.set(chunk, offset);
		offset += chunk.length;
	}

	writeFileSync(mp3Path, Buffer.from(finalMp3));

	const mp3Size = statSync(mp3Path).size;
	const mp3SizeMB = (mp3Size / 1024 / 1024).toFixed(2);
	const compressionRatio = ((1 - mp3Size / wavSize) * 100).toFixed(1);
	const conversionTime = ((Date.now() - startTime) / 1000).toFixed(2);

	logger.debug(`MP3 file size: ${mp3SizeMB} MB (${mp3Size} bytes)`);
	logger.debug(`Compression ratio: ${compressionRatio}% size reduction`);
	logger.debug(
		`WAV to MP3 conversion completed in ${conversionTime} seconds`
	);
}

/**
 * Convert stereo to mono by averaging channels
 */
function convertToMono(pcmData: Int16Array, channels: number): Int16Array {
	if (channels === 1) return pcmData;

	const monoData = new Int16Array(pcmData.length / channels);
	for (let i = 0; i < monoData.length; i++) {
		const left = pcmData[i * 2] || 0;
		const right = pcmData[i * 2 + 1] || 0;
		monoData[i] = Math.floor((left + right) / 2);
	}
	return monoData;
}

/**
 * Downsample audio to target sample rate (simple linear interpolation)
 */
function downsample(
	pcmData: Int16Array,
	fromRate: number,
	toRate: number
): Int16Array {
	if (fromRate === toRate) return pcmData;

	const ratio = fromRate / toRate;
	const outputLength = Math.floor(pcmData.length / ratio);
	const downsampled = new Int16Array(outputLength);

	for (let i = 0; i < outputLength; i++) {
		const sourceIndex = i * ratio;
		const index = Math.floor(sourceIndex);
		downsampled[i] = pcmData[index] || 0;
	}

	return downsampled;
}
