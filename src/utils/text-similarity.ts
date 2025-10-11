/**
 * Text similarity utilities for comparing transcriptions
 */

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
	const longer = str1.length > str2.length ? str1 : str2;
	const shorter = str1.length > str2.length ? str2 : str1;

	if (longer.length === 0) return 1.0;

	const distance = levenshteinDistance(
		longer.toLowerCase(),
		shorter.toLowerCase()
	);
	return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
	const matrix: number[][] = [];

	for (let i = 0; i <= str2.length; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= str1.length; j++) {
		if (matrix[0]) {
			matrix[0][j] = j;
		}
	}

	for (let i = 1; i <= str2.length; i++) {
		for (let j = 1; j <= str1.length; j++) {
			const row = matrix[i];
			if (!row) continue;

			if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
				row[j] = matrix[i - 1]?.[j - 1] ?? 0;
			} else {
				row[j] = Math.min(
					(matrix[i - 1]?.[j - 1] ?? 0) + 1,
					(matrix[i]?.[j - 1] ?? 0) + 1,
					(matrix[i - 1]?.[j] ?? 0) + 1
				);
			}
		}
	}

	return matrix[str2.length]?.[str1.length] ?? 0;
}

/**
 * Find and return the first N word-level differences between two texts
 */
export function findTextDifferences(
	text1: string,
	text2: string,
	maxDifferences = 10
): Array<{ position: number; word1: string; word2: string }> {
	const words1 = text1.split(/\s+/);
	const words2 = text2.split(/\s+/);
	const maxWords = Math.max(words1.length, words2.length);
	const differences: Array<{
		position: number;
		word1: string;
		word2: string;
	}> = [];

	for (let i = 0; i < maxWords && differences.length < maxDifferences; i++) {
		const word1 = words1[i] || "(missing)";
		const word2 = words2[i] || "(missing)";

		if (word1 !== word2) {
			differences.push({ position: i + 1, word1, word2 });
		}
	}

	return differences;
}
