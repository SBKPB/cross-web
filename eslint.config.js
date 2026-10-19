import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	{ ignores: ['.svelte-kit/', '.vercel/', 'build/', 'node_modules/', 'scripts/', 'tests/', 'static/'] },
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } }
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: { parserOptions: { parser: ts.parser } }
	},
	{
		// 站台沒有設定 base path，連結與 goto 沿用舊版直接寫站內路徑
		rules: { 'svelte/no-navigation-without-resolve': 'off' }
	}
);
