import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	// .superpowers/、.claude/ 為 git-ignored 的本機工作目錄（流程腳本、設定），不屬於專案原始碼
	{ ignores: ['.svelte-kit/', '.vercel/', 'build/', 'node_modules/', 'scripts/', 'tests/', 'static/', '.superpowers/', '.claude/'] },
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
