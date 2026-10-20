import type { PageLoad } from "./$types";

// 預約流程在瀏覽器端抓資料（舊版 server component 的載入、找不到、未開通導回院所頁，見 +page.svelte）。
// robots.txt 已擋 /booking/，不需伺服器端 <head>；未登入也能選服務與時段，送出時才導向登入（舊版行為，無頁面守衛）。
export const ssr = false;

// 不在 load 等待後端：舊版 loading.tsx 在資料回來前先顯示骨架（換頁時立即出現），由頁面元件抓資料重現
export const load: PageLoad = ({ params }) => ({ clinicId: params.id });
