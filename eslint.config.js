import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			prettier,
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			
			// Règles équivalentes à Biome
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			
			// Règles recommandées TypeScript
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'no-var': 'error',
			'prefer-const': 'error',
		},
	},
	{
		// Configuration spécifique pour les fichiers de test
		files: ['**/*.test.ts', '**/*.spec.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
];