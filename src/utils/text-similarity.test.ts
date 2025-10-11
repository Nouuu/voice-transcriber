import { describe, expect, it } from "bun:test";
import { calculateSimilarity, findTextDifferences } from "./text-similarity";

describe("text-similarity", () => {
	describe("calculateSimilarity", () => {
		it("should return 1.0 for identical strings", () => {
			const result = calculateSimilarity("hello world", "hello world");
			expect(result).toBe(1.0);
		});

		it("should return 1.0 for empty strings", () => {
			const result = calculateSimilarity("", "");
			expect(result).toBe(1.0);
		});

		it("should return value between 0 and 1 for different strings", () => {
			const result = calculateSimilarity("hello", "hallo");
			expect(result).toBeGreaterThan(0);
			expect(result).toBeLessThan(1);
		});

		it("should be case insensitive", () => {
			const result = calculateSimilarity("Hello World", "hello world");
			expect(result).toBe(1.0);
		});

		it("should handle completely different strings", () => {
			const result = calculateSimilarity("abc", "xyz");
			expect(result).toBeGreaterThanOrEqual(0);
		});
	});

	describe("findTextDifferences", () => {
		it("should find no differences for identical texts", () => {
			const result = findTextDifferences("hello world", "hello world");
			expect(result).toEqual([]);
		});

		it("should find word-level differences", () => {
			const result = findTextDifferences("hello world", "hello there");
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				position: 2,
				word1: "world",
				word2: "there",
			});
		});

		it("should handle missing words", () => {
			const result = findTextDifferences("hello world", "hello");
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				position: 2,
				word1: "world",
				word2: "(missing)",
			});
		});

		it("should limit number of differences returned", () => {
			const text1 =
				"one two three four five six seven eight nine ten eleven twelve";
			const text2 = "1 2 3 4 5 6 7 8 9 10 11 12";
			const result = findTextDifferences(text1, text2, 5);
			expect(result).toHaveLength(5);
		});

		it("should compare all words even with maxDifferences limit", () => {
			// Tests that we iterate through ALL words, not just maxDifferences words
			const text1 = "same same same same different1";
			const text2 = "same same same same different2";
			const result = findTextDifferences(text1, text2, 10);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				position: 5,
				word1: "different1",
				word2: "different2",
			});
		});

		it("should stop collecting differences after reaching maxDifferences", () => {
			const text1 = "a b c d e f g h i j";
			const text2 = "1 2 3 4 5 6 7 8 9 10";
			const result = findTextDifferences(text1, text2, 3);

			// Should only return first 3 differences
			expect(result).toHaveLength(3);
			expect(result[0]?.position).toBe(1);
			expect(result[1]?.position).toBe(2);
			expect(result[2]?.position).toBe(3);
		});

		it("should handle extra words in second text", () => {
			const result = findTextDifferences("hello", "hello world");
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				position: 2,
				word1: "(missing)",
				word2: "world",
			});
		});

		it("should handle multiple differences", () => {
			const text1 = "the quick brown fox";
			const text2 = "the slow white fox";
			const result = findTextDifferences(text1, text2);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				position: 2,
				word1: "quick",
				word2: "slow",
			});
			expect(result[1]).toEqual({
				position: 3,
				word1: "brown",
				word2: "white",
			});
		});
	});
});
