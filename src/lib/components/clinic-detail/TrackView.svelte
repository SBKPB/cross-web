<script lang="ts">
	/**
	 * 回報一次診所頁造訪（不渲染任何東西）。
	 *
	 * 走 /api/track-view 而非直接打後端：原始 IP 只有這一層看得到
	 * （後端在 proxy 後面，x-forwarded-* 會被剝掉，直接打只會拿到 proxy 的 IP）。
	 * 去重在 DB 端以 (院所, IP 雜湊, 日期) 唯一鍵處理，這裡不需要自己防重複。
	 */
	let { clinicId }: { clinicId: string } = $props();

	$effect(() => {
		// keepalive：使用者馬上跳走也要送得出去
		fetch("/api/track-view", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ clinicId }),
			keepalive: true,
		}).catch(() => {});
	});
</script>
