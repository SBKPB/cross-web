import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

import { applicationNotificationEmail, type EmailContent } from "../../../lib/email-templates.ts";
import { categoryLabel, serviceCategoriesApi } from "../../../lib/api/service-categories.ts";
import { PAYMENT_TYPES } from "../../../lib/constants/clinic-constants.ts";
import { JOIN_CATEGORIES, JOIN_CATEGORY_LABELS } from "../../../lib/constants/join-constants.ts";
import type { FacilityType } from "../../../lib/types/clinic.ts";
import type { JoinApplication, JoinCategory } from "../../../lib/types/join.ts";

// 夥伴加入申請接收端（移植自舊 Next 的 api/join/route.ts）
//
// 後端目前沒有加入申請 endpoint，故由前端 route handler 直接接收並「以 email 通知營運團隊」。
// 通知採環境變數驅動，以 fetch 呼叫 Resend、無額外相依套件；未設定就略過，
// 此時仍會把申請寫進 server log（與後端 email_service 的 stub 行為一致），
// 確保表單在 dev / 尚未設定時也能正常送出成功。
//
// 後端一律經 event.fetch 打 /api/v1（內部解析到代理路由），後端網址只在代理那一處；
// 環境變數讀 process.env（node --test 可直接 import 本檔）。
//
// 可設定的環境變數（在 Vercel 專案設定）：
//   RESEND_API_KEY   + JOIN_NOTIFY_EMAIL → 以 Resend 寄 email 給營運信箱
//   JOIN_NOTIFY_FROM （選填，預設 onboarding@cross.twinhao.com）

type Fetch = typeof globalThis.fetch;

const FACILITY_BY_CATEGORY = Object.fromEntries(
	JOIN_CATEGORIES.map((c) => [c.value, c.facilityType]),
) as Record<JoinCategory, FacilityType>;

const VALID_CATEGORIES: JoinCategory[] = JOIN_CATEGORIES.map((c) => c.value);

interface ValidationResult {
	ok: boolean;
	error?: string;
	data?: JoinApplication;
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function validate(raw: unknown): ValidationResult {
	if (typeof raw !== "object" || raw === null) {
		return { ok: false, error: "格式錯誤" };
	}
	const body = raw as Record<string, unknown>;

	// 蜜罐：機器人填了隱藏欄位 → 假裝成功，不通知
	if (isNonEmptyString(body.hp)) {
		return { ok: false, error: "spam" };
	}

	if (!VALID_CATEGORIES.includes(body.category as JoinCategory)) {
		return { ok: false, error: "請選擇商家類型" };
	}
	if (!isNonEmptyString(body.business_name)) {
		return { ok: false, error: "請填寫商家名稱" };
	}
	if (!isNonEmptyString(body.contact_name)) {
		return { ok: false, error: "請填寫聯絡人姓名" };
	}
	if (!isNonEmptyString(body.phone)) {
		return { ok: false, error: "請填寫聯絡電話" };
	}
	if (!isNonEmptyString(body.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
		return { ok: false, error: "請填寫正確的 Email" };
	}
	if (!isNonEmptyString(body.city)) {
		return { ok: false, error: "請選擇縣市" };
	}

	const category = body.category as JoinCategory;

	// service_categories：只收非空字串，過濾後若為空陣列則視為未填
	const serviceCategories = Array.isArray(body.service_categories)
		? body.service_categories.filter(
				(c): c is string => typeof c === "string" && c.trim().length > 0,
			)
		: [];

	const data: JoinApplication = {
		category,
		facility_type: FACILITY_BY_CATEGORY[category],
		business_name: (body.business_name as string).trim(),
		contact_name: (body.contact_name as string).trim(),
		phone: (body.phone as string).trim(),
		email: (body.email as string).trim(),
		city: (body.city as string).trim(),
		address: isNonEmptyString(body.address) ? (body.address as string).trim() : undefined,
		team_size: isNonEmptyString(body.team_size) ? (body.team_size as string).trim() : undefined,
		service_categories: serviceCategories.length > 0 ? serviceCategories : undefined,
		payment_type: isNonEmptyString(body.payment_type)
			? (body.payment_type as JoinApplication["payment_type"])
			: undefined,
		services: isNonEmptyString(body.services) ? (body.services as string).trim() : undefined,
		message: isNonEmptyString(body.message) ? (body.message as string).trim() : undefined,
	};

	return { ok: true, data };
}

async function buildNotificationRows(
	data: JoinApplication,
	fetch: Fetch,
): Promise<{ label: string; value: string }[]> {
	const rows: { label: string; value: string }[] = [
		{ label: "商家類型", value: JOIN_CATEGORY_LABELS[data.category] },
		{ label: "商家名稱", value: data.business_name },
		{ label: "聯絡人", value: data.contact_name },
		{ label: "電話", value: data.phone },
		{ label: "Email", value: data.email },
		{ label: "縣市", value: data.city },
	];
	if (data.address) rows.push({ label: "地址", value: data.address });
	if (data.team_size) rows.push({ label: "規模", value: data.team_size });
	if (data.service_categories && data.service_categories.length > 0) {
		// 以 service-categories taxonomy 把 code 攤成中文 label
		const taxonomy = await serviceCategoriesApi.get({ fetch });
		rows.push({
			label: "主要服務",
			value: data.service_categories.map((code) => categoryLabel(taxonomy, code)).join("、"),
		});
	}
	if (data.payment_type) {
		rows.push({
			label: "付費類型",
			value: PAYMENT_TYPES[data.payment_type] ?? data.payment_type,
		});
	}
	if (data.services) rows.push({ label: "其他服務", value: data.services });
	if (data.message) rows.push({ label: "備註", value: data.message });
	return rows;
}

async function sendEmail(to: string, content: EmailContent): Promise<void> {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey || !to) return;

	const from = process.env.JOIN_NOTIFY_FROM || "Cross <onboarding@cross.twinhao.com>";
	try {
		const res = await globalThis.fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from,
				to: to.split(",").map((x) => x.trim()),
				subject: content.subject,
				html: content.html,
				// 純文字不是備胎：有人關掉 HTML 讀信，寄件信譽也吃這個
				text: content.text,
			}),
		});
		if (!res.ok) {
			console.error("[join] Resend email failed", res.status, await res.text());
		}
	} catch (err) {
		console.error("[join] Resend email error", err);
	}
}

/** 建立申請單。驗證碼由後端寄（碼不離開後端），這裡只拿到有沒有寄成功。 */
async function createApplication(
	data: JoinApplication,
	fetch: Fetch,
): Promise<{ ok: true; emailSent: boolean } | { ok: false; error: string }> {
	const res = await fetch("/api/v1/facility-applications", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			business_name: data.business_name,
			contact_name: data.contact_name,
			phone: data.phone,
			email: data.email,
			city: data.city,
			address: data.address,
			team_size: data.team_size,
			facility_type: FACILITY_BY_CATEGORY[data.category],
			payment_type: data.payment_type ?? "nhi",
			service_categories: data.service_categories ?? [],
			services: data.services,
			message: data.message,
		}),
	});
	if (res.ok) {
		const json = (await res.json()) as { email_sent?: boolean };
		return { ok: true, emailSent: json.email_sent === true };
	}
	// 後端已把「這個信箱已經有帳號」之類的訊息寫成可直接顯示的中文
	const detail = await res
		.json()
		.then((j: { detail?: string }) => j.detail)
		.catch(() => undefined);
	return { ok: false, error: detail ?? "送出失敗，請稍後再試" };
}

export const POST: RequestHandler = async ({ request, fetch, url }) => {
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return json({ ok: false, error: "格式錯誤" }, { status: 400 });
	}

	// 重新寄送驗證碼：申請人已在驗證頁，後端會沿用同一張申請單換發新碼；
	// 營運通知信第一次送出時已寄過，重寄不再轟炸。
	const isResend =
		typeof raw === "object" && raw !== null && (raw as Record<string, unknown>).resend === true;

	const result = validate(raw);

	// 蜜罐命中：對機器人回 200，但不做任何通知
	if (!result.ok && result.error === "spam") {
		return json({ ok: true });
	}
	if (!result.ok || !result.data) {
		return json({ ok: false, error: result.error ?? "格式錯誤" }, { status: 400 });
	}

	const data = result.data;

	// 先建立申請單。失敗（例如信箱已有帳號）要如實回報給使用者，
	// 不能像通知信那樣默默吞掉——否則對方會以為申請成功卻永遠等不到信。
	const created = await createApplication(data, fetch);
	if (!created.ok) {
		return json({ ok: false, error: created.error }, { status: 400 });
	}

	// 驗證碼寄不出去就不能回報成功——對方會一直等一封不會來的信。
	// 申請單已經建立，重送一次會沿用同一張並換發新碼，所以叫他重試是安全的。
	if (!created.emailSent) {
		console.error("[join] verification email not sent", { email: data.email });
		return json(
			{
				ok: false,
				error: "驗證碼寄送失敗，請稍後再試一次；若持續發生請來信 office@twinhao.com",
			},
			{ status: 502 },
		);
	}

	const origin = url.origin;

	console.info("[join] new application", {
		business_name: data.business_name,
		email: data.email,
	});

	// 申請人的驗證碼信由後端寄出（碼不能經過這裡）；這裡只寄營運團隊的通知信
	const notifyTo = process.env.JOIN_NOTIFY_EMAIL;
	if (notifyTo && !isResend) {
		await sendEmail(
			notifyTo,
			applicationNotificationEmail(
				data.business_name,
				await buildNotificationRows(data, fetch),
				`${origin}/admin/applications`,
			),
		);
	}

	return json({ ok: true });
};
