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
	});
});
