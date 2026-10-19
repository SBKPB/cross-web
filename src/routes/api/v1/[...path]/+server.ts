import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// 後端代理：移植自舊 Next 的 api/[...path]/route.ts。
// vercel.json 的 rewrite 對「帶尾斜線」路徑無效（會落到 SvelteKit 回 404），故由此處兜底。
const BACKEND_URL = env.BACKEND_URL || 'https://cross-backend-vrqytyiqxq-de.a.run.app';

const handler: RequestHandler = async ({ request, url }) => {
	const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

	const headers = new Headers();
	for (const [key, value] of request.headers.entries()) {
		if (
			key === 'host' ||
			key === 'connection' ||
			key === 'content-length' ||
			key.startsWith('x-vercel') ||
			key.startsWith('x-forwarded')
		) {
			continue;
		}
		headers.set(key, value);
	}

	// 有 body 的請求先 buffer，避免串流失去 content-length 導致 FastAPI multipart 解析失敗
	let body: ArrayBuffer | undefined;
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		body = await request.arrayBuffer();
		headers.set('content-length', body.byteLength.toString());
	}

	const response = await fetch(targetUrl, {
		method: request.method,
		headers,
		body,
		redirect: 'follow'
	});

	const responseHeaders = new Headers();
	for (const [key, value] of response.headers.entries()) {
		if (key === 'transfer-encoding' || key === 'content-encoding' || key === 'content-length') continue;
		responseHeaders.set(key, value);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders
	});
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;

// 不對 /api/v1 做尾斜線正規化（否則會 308 改寫路徑）
export const trailingSlash = 'ignore';
