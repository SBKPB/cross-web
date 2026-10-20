import type { PageLoad } from "./$types";

// 預約成功頁（舊版即為 client component）：在瀏覽器端以網址的 ?id= 載入預約資料
export const ssr = false;

export const load: PageLoad = ({ params }) => ({ clinicId: params.id });
