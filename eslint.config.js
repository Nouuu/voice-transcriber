import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				// Enable type-aware linting (requires a tsconfig.json at repo root)
				project: ["./tsconfig.json"],
				tsconfigRootDir: process.cwd(),
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
			prettier,
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			...tsPlugin.configs["recommended-type-checked"].rules,
			...prettierConfig.rules,
			"prettier/prettier": "error",

			// TypeScript strict rules
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-non-null-assertion": "error",
			"@typescript-eslint/no-unnecessary-condition": "warn",
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/await-thenable": "error",
			"@typescript-eslint/no-misused-promises": "error",
			"@typescript-eslint/require-await": "warn",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
			"@typescript-eslint/restrict-template-expressions": [
				"warn",
				{
					allowNumber: true,
					allowBoolean: true,
					allowNullish: true,
				},
			],

			// Règles recommandées TypeScript
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
				},
			],

			// Best practices
			"no-var": "error",
			"prefer-const": "error",
			"no-console": [
				"warn",
				{
					allow: ["warn", "error"],
				},
			],
			eqeqeq: ["error", "always"],
			"no-throw-literal": "error",
		},
	},
	{
		// Configuration spécifique pour les fichiers de test
		files: ["**/*.test.ts", "**/*.spec.ts"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-floating-promises": "off",
			"@typescript-eslint/unbound-method": "off",
			"@typescript-eslint/require-await": "off",
			"@typescript-eslint/no-unnecessary-type-assertion": "off",
			"no-console": "off",
		},
	},
];
