import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// 部署到新加坡區，與後端同區
		adapter: adapter({ regions: ['sin1'] }),
		// 沿用舊 Next 的公開環境變數前綴
		env: { publicPrefix: 'NEXT_PUBLIC_' }
	}
};

export default config;
