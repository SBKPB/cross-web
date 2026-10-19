import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		// 本機開發：/api/v1 代理到本機後端（8001）
		proxy: {
			'/api/v1': { target: 'http://localhost:8001', changeOrigin: true }
		}
	}
});
