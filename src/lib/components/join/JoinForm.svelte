<script lang="ts">
	import ArrowRight from "@lucide/svelte/icons/arrow-right";
	import Check from "@lucide/svelte/icons/check";
	import CheckCircle2 from "@lucide/svelte/icons/circle-check";
	import Flower2 from "@lucide/svelte/icons/flower-2";
	import Loader2 from "@lucide/svelte/icons/loader-circle";
	import Sparkles from "@lucide/svelte/icons/sparkles";
	import Stethoscope from "@lucide/svelte/icons/stethoscope";
	import Store from "@lucide/svelte/icons/store";
	import { onMount, untrack } from "svelte";
	import { categoriesFor } from "#lib/api/service-categories.ts";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#lib/components/ui/select/index.js";
	import { Textarea } from "#lib/components/ui/textarea/index.js";
	import { PAYMENT_TYPE_OPTIONS, TAIWAN_CITIES } from "#lib/constants/clinic-constants.ts";
	import {
		JOIN_CATEGORIES,
		JOIN_CATEGORY_ACCENT,
		SERVICE_PLACEHOLDERS,
		TEAM_SIZE_OPTIONS,
		type JoinCategoryOption,
	} from "#lib/constants/join-constants.ts";
	import { useServiceTaxonomy } from "#lib/hooks/service-taxonomy.svelte.ts";
	import {
		INITIAL_JOIN_FORM,
		JOIN_PENDING_STORAGE_KEY,
		JOIN_STEPS,
		buildJoinPayload,
		missingInStep1,
		restorePendingJoin,
		selectJoinCategory,
		toggleServiceCategory,
		validateOtpForm,
		verifyCodeErrorMessage,
		type JoinFormState,
	} from "#lib/join/join-form.ts";
	import type { PaymentType } from "#lib/types/clinic.ts";
	import { cn } from "#lib/utils.ts";

	// 移植自舊版 components/join/join-form.tsx：三段申請表單 → 送出後同頁輸入 6 位數驗證碼並設定密碼 → 立即開通後台
	const CATEGORY_ICONS = {
		stethoscope: Stethoscope,
		sparkles: Sparkles,
		flower: Flower2,
		store: Store,
	} as const;

	const cityItems = TAIWAN_CITIES.map((city) => ({ value: city, label: city }));
	const paymentItems = PAYMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
	const teamSizeItems = TEAM_SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

	let form = $state<JoinFormState>({ ...INITIAL_JOIN_FORM, service_categories: [] });
	let error = $state<string | null>(null);
	let isSubmitting = $state(false);
	let submitted = $state(false);

	const taxonomy = useServiceTaxonomy();

	const isClinic = $derived(form.category === "clinic");
	// 當前所選大類對應的 facilityType 與其子類別清單
	const facilityType = $derived(JOIN_CATEGORIES.find((c) => c.value === form.category)!.facilityType);
	const categoryOptions = $derived(categoriesFor(taxonomy.current, facilityType));

	// 三段流程：0 商家類型 / 1 基本資料 / 2 服務資訊。一次只問一段，18 個欄位鋪在同一頁會讓人直接關掉。
	let step = $state(0);

	// ===== 驗證碼階段（送出後同頁完成，不再要求去信箱點連結）=====
	let code = $state("");
	let vPassword = $state("");
	let vConfirm = $state("");
	let verifyError = $state<string | null>(null);
	// 重寄成功等正向回饋（有畫面看得到、螢幕閱讀器也聽得到，不然重寄像沒反應）
	let verifyNotice = $state<string | null>(null);
	let isVerifying = $state(false);
	let isResending = $state(false);
	// 重寄冷卻（後端同信箱 60 秒節流；前端先擋掉必然失敗的點擊）
	let resendIn = $state(0);
	// 信箱本來就有 Cross 帳號：密碼沿用原本那組，要把這件事講清楚再放行進後台
	let openedExisting = $state(false);

	$effect(() => {
		if (resendIn <= 0) return;
		const t = setTimeout(() => (resendIn -= 1), 1000);
		return () => clearTimeout(t);
	});

	// 換步時按鈕會卸載或轉 disabled，焦點被瀏覽器丟回 body。把焦點移到該步標題，
	// 一次解決「鍵盤使用者失去位置」與「螢幕閱讀器不知道畫面換了」兩件事。
	// openedExisting 也要在依賴內：那個「密碼沿用原本那組」的畫面是全流程最不能漏聽的。
	// 宣告在還原 sessionStorage 之前（同舊版 effect 順序）：重整後還原成「已送出」時會聚焦輸碼畫面的標題。
	let headingEl = $state<HTMLHeadingElement | null>(null);
	let moved = false;
	$effect(() => {
		void step;
		void submitted;
		void openedExisting;
		if (!moved) {
			moved = true; // 初次載入不搶焦點
			return;
		}
		untrack(() => headingEl?.focus());
	});

	// 驗證碼階段只活在記憶體：重整後從 sessionStorage 回到輸碼畫面（驗證碼與密碼仍需重新輸入，不落地）。成功／重填時清掉。
	onMount(() => {
		try {
			const restored = restorePendingJoin(sessionStorage.getItem(JOIN_PENDING_STORAGE_KEY));
			if (restored) {
				form = restored;
				submitted = true;
			}
		} catch {
			// 無痕視窗 / 讀取被擋 → 就當作全新填寫，不影響流程
		}
	});
	$effect(() => {
		const pending = submitted && !openedExisting;
		const snapshot = JSON.stringify({ form });
		try {
			if (pending) sessionStorage.setItem(JOIN_PENDING_STORAGE_KEY, snapshot);
			else sessionStorage.removeItem(JOIN_PENDING_STORAGE_KEY);
		} catch {
			// 忽略：sessionStorage 不可用不該讓表單壞掉
		}
	});

	/** 按下「下一步」：擋關時把缺項講出來並把焦點送到第一個問題欄位。 */
	const goNext = () => {
		const miss = step === 1 ? missingInStep1(form) : [];
		if (miss.length > 0) {
			error = `還差：${miss.map((m) => m.label).join("、")}`;
			document.getElementById(miss[0].id)?.focus();
			return;
		}
		error = null;
		step += 1;
	};

	const canSubmit = $derived(missingInStep1(form).length === 0);

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		// 在欄位裡按 Enter 會觸發隱式送出，只有最後一步才算數
		if (step !== JOIN_STEPS.length - 1) return;
		error = null;
		isSubmitting = true;

		try {
			const res = await fetch("/api/join", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildJoinPayload(form)),
			});
			const json = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null;
			if (!res.ok || !json?.ok) {
				error = json?.error ?? "送出失敗，請稍後再試";
				return;
			}
			submitted = true;
			resendIn = 60;
		} catch {
			error = "無法連線到伺服器，請稍後再試";
		} finally {
			isSubmitting = false;
		}
	};

	const handleVerify = async (e: SubmitEvent) => {
		e.preventDefault();
		const invalid = validateOtpForm(code, vPassword, vConfirm);
		if (invalid) {
			verifyError = invalid;
			return;
		}
		verifyError = null;
		verifyNotice = null;
		isVerifying = true;
		try {
			const res = await fetch("/api/v1/facility-applications/verify-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: form.email.trim(), code, password: vPassword }),
			});
			const json = (await res.json().catch(() => null)) as {
				access_token?: string;
				refresh_token?: string;
				existing_account?: boolean;
				// detail 可能是 FastAPI 422 的錯誤物件陣列，不一定是字串
				detail?: unknown;
			} | null;
			if (!res.ok || !json?.access_token || !json.refresh_token) {
				verifyError = verifyCodeErrorMessage(json);
				return;
			}
			localStorage.setItem("access_token", json.access_token);
			localStorage.setItem("refresh_token", json.refresh_token);
			if (json.existing_account) {
				// 密碼沿用原帳號那組——先講清楚再讓他進後台，否則他會拿剛設的新密碼去登入
				openedExisting = true;
			} else {
				// 整頁導向讓登入狀態在載入時讀 localStorage 完成登入
				window.location.assign("/admin");
			}
		} catch {
			verifyError = "無法連線到伺服器，請稍後再試";
		} finally {
			isVerifying = false;
		}
	};

	const handleResend = async () => {
		isResending = true;
		verifyError = null;
		verifyNotice = null;
		try {
			const res = await fetch("/api/join", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				// resend：後端會換發新碼；web route 據此略過營運通知信，不重複轟炸信箱
				body: JSON.stringify({ ...buildJoinPayload(form), resend: true }),
			});
			const json = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null;
			if (!res.ok || !json?.ok) {
				verifyError = json?.error ?? "重新寄送失敗，請稍後再試";
				return;
			}
			code = "";
			resendIn = 60;
			// 舊碼已作廢，明講「以最新一封為準」避免使用者輸入舊信的碼
			verifyNotice = "新的驗證碼已寄出，請以最新一封信的驗證碼為準。";
		} catch {
			verifyError = "無法連線到伺服器，請稍後再試";
		} finally {
			isResending = false;
		}
	};
</script>

{#snippet categoryCard(option: JoinCategoryOption, selected: boolean, onSelect: () => void)}
	{@const Icon = CATEGORY_ICONS[option.icon]}
	{@const accent = JOIN_CATEGORY_ACCENT[option.value]}
	<button
		type="button"
		onclick={onSelect}
		aria-pressed={selected}
		class={cn(
			"group relative flex flex-col items-start gap-2.5 rounded-2xl p-4 text-left transition-all duration-200",
			// 焦點用 outline 而非本專案慣用的 focus-visible:ring-3：ring 是 box-shadow，
			// 已經被卡片自己的邊框佔用，再疊上去會蓋掉選中態的 ring-2。往外 offset 才分得出來。
			"ring-1 focus-visible:outline-2 focus-visible:outline-offset-2",
			selected ? cn("shadow-sm ring-2", accent.card) : "bg-card ring-foreground/50 hover:bg-muted/50",
		)}
	>
		<!-- 勾號：選中不能只靠顏色傳達（WCAG 1.4.1），色盲使用者靠這個看 -->
		<span
			class={cn(
				"absolute right-3 top-3 flex size-5 items-center justify-center rounded-full transition-all duration-200",
				accent.solid,
				selected ? "scale-100 opacity-100" : "scale-50 opacity-0",
			)}
		>
			<Check class="size-3" strokeWidth={3} />
		</span>
		<!-- 未選中一律中性灰：四顆同色的藍會讓「選中」那顆淹沒在其他三顆裡 -->
		<span
			class={cn(
				"inline-flex size-10 items-center justify-center rounded-xl transition-colors duration-200",
				selected ? accent.solid : "bg-foreground/[0.07] text-muted-foreground group-hover:text-foreground",
			)}
		>
			<Icon class="size-5" />
		</span>
		<span class="text-sm font-semibold text-foreground">{option.label}</span>
		<span class="text-xs leading-snug text-muted-foreground">{option.description}</span>
	</button>
{/snippet}

<!-- 服務子類別多選 chip：選中時填滿品牌色 + 勾號 -->
{#snippet categoryChip(label: string, selected: boolean, onToggle: () => void)}
	<button
		type="button"
		onclick={onToggle}
		aria-pressed={selected}
		class={cn(
			"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-all duration-200",
			selected
				? "bg-primary text-primary-foreground ring-primary shadow-sm"
				: "bg-card text-foreground ring-foreground/50 hover:ring-primary hover:text-primary",
		)}
	>
		{#if selected}<Check class="size-3.5" strokeWidth={3} />{/if}
		{label}
	</button>
{/snippet}

{#if submitted}
	{#if openedExisting}
		<!-- 帳號已開通、但信箱本來就有 Cross 帳號 → 先講清楚密碼沿用哪一組 -->
		<div
			class="flex flex-col items-center gap-4 overflow-hidden rounded-[2rem] bg-card p-10 text-center shadow-xl ring-1 ring-foreground/5"
			style="animation: fadeInUp 0.5s ease-out both"
		>
			<span class="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
				<CheckCircle2 class="size-9" />
			</span>
			<h2
				bind:this={headingEl}
				tabindex="-1"
				class="text-2xl font-bold tracking-tight text-foreground outline-none"
			>
				後台已開通
			</h2>
			<p class="max-w-md text-sm leading-relaxed text-muted-foreground">
				這個信箱本來就有 Cross 帳號，登入密碼<strong class="font-medium text-foreground">沿用原本那組</strong
				>——剛剛填的新密碼沒有被使用。
			</p>
			<p class="max-w-md text-sm leading-relaxed text-muted-foreground">
				現在就能進後台整理院所資料；上架到民眾端需通過審核，屆時會寄信通知。
			</p>
			<p class="max-w-md text-xs leading-relaxed text-muted-foreground">
				不記得原本的密碼？下次登入前請來信 <strong class="font-medium text-foreground">office@twinhao.com</strong>
				協助重設。
			</p>
			<Button size="lg" class="mt-1" onclick={() => window.location.assign("/admin")}>
				進入院所後台
				<ArrowRight class="size-4" />
			</Button>
		</div>
	{:else}
		<form
			onsubmit={handleVerify}
			class="overflow-hidden rounded-[2rem] bg-card shadow-xl ring-1 ring-foreground/5"
			style="animation: fadeInUp 0.5s ease-out both"
		>
			<div class="space-y-6 p-6 sm:p-8">
				<div>
					<h2
						bind:this={headingEl}
						tabindex="-1"
						class="text-xl font-bold tracking-tight text-foreground outline-none"
					>
						輸入驗證碼，立即開通後台
					</h2>
					<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
						若你剛送出申請，驗證碼會寄到 <strong class="font-medium text-foreground">{form.email}</strong
						>，15 分鐘內有效。
						<button
							type="button"
							onclick={() => {
								submitted = false;
								verifyError = null;
								verifyNotice = null;
								code = "";
							}}
							class="font-medium text-primary underline-offset-2 hover:underline"
						>
							填錯信箱？返回修改
						</button>
					</p>
				</div>

				<div class="grid gap-2">
					<Label for="otp-code">6 位數驗證碼</Label>
					<Input
						id="otp-code"
						inputmode="numeric"
						autocomplete="one-time-code"
						maxlength={6}
						value={code}
						oninput={(e) => {
							code = e.currentTarget.value.replace(/\D/g, "");
							e.currentTarget.value = code;
						}}
						class="h-14 text-center text-2xl font-bold tracking-[0.5em] tabular-nums"
						placeholder="000000"
					/>
				</div>

				<div class="space-y-3">
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="grid gap-2">
							<Label for="otp-password">設定後台密碼</Label>
							<Input
								id="otp-password"
								type="password"
								autocomplete="new-password"
								maxlength={128}
								bind:value={vPassword}
								placeholder="至少 8 碼"
							/>
						</div>
						<div class="grid gap-2">
							<Label for="otp-confirm">再次輸入密碼</Label>
							<Input
								id="otp-confirm"
								type="password"
								autocomplete="new-password"
								maxlength={128}
								bind:value={vConfirm}
							/>
						</div>
					</div>
					<p class="text-xs leading-relaxed text-muted-foreground">
						之後就用這個信箱＋這組密碼登入院所後台。若這個信箱已經有 Cross
						帳號，會沿用原本的密碼，這裡填的不會生效。
					</p>
				</div>

				<!-- role="alert" 容器常駐、只切內容才穩定觸發朗讀；顏色沿用主表單過 AA 的實色 -->
				<div
					role="alert"
					class={cn(
						verifyError
							? "rounded-2xl bg-destructive/10 p-3 text-sm text-red-800 ring-1 ring-destructive/20 dark:text-red-300"
							: verifyNotice
								? "rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-300"
								: "sr-only",
					)}
				>
					{verifyError ?? verifyNotice}
				</div>

				<div class="space-y-3">
					<Button type="submit" size="lg" class="w-full" disabled={isVerifying}>
						{#if isVerifying}
							<Loader2 class="size-4 animate-spin" />
							開通中…
						{:else}
							完成驗證，進入後台
							<ArrowRight class="size-4" />
						{/if}
					</Button>
					<p class="text-center text-sm text-muted-foreground">
						沒收到信？看看垃圾信匣，或
						<button
							type="button"
							onclick={handleResend}
							disabled={resendIn > 0 || isResending}
							class="font-medium text-primary underline-offset-2 enabled:hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground"
						>
							{resendIn > 0 ? `重新寄送（${resendIn} 秒後可用）` : isResending ? "寄送中…" : "重新寄送驗證碼"}
						</button>
					</p>
					<!-- 已完成驗證的人重送表單不會再收到碼——給一條登入逃生口，別讓他卡死 -->
					<p class="text-center text-xs text-muted-foreground">
						已經完成過驗證了？直接
						<a href="/admin/login" class="font-medium text-primary underline-offset-2 hover:underline">前往登入</a
						>。帳號開通後即可整理院所資料；上架到民眾端需審核通過，屆時會寄信通知。
					</p>
				</div>
			</div>
		</form>
	{/if}
{:else}
	<form
		onsubmit={handleSubmit}
		class="overflow-hidden rounded-[2rem] bg-card shadow-xl ring-1 ring-foreground/5"
		style="animation: fadeInUp 0.5s ease-out both"
	>
		<!-- 蜜罐欄位：對使用者隱藏。刻意放在 space-y-7 容器「之外」——Tailwind 4 的
		     space-y 用 :not(:last-child) 選擇器，零高度的它照樣分到一格 28px。 -->
		<div aria-hidden="true" class="h-0 w-0 overflow-hidden">
			<input type="text" name="company_website" tabindex={-1} autocomplete="off" bind:value={form.hp} />
		</div>

		<div class="space-y-7 p-6 sm:p-8">
			<!-- 進度：讓人知道還剩幾步，而不是面對一片問不完的欄位 -->
			<div>
				<div aria-hidden="true" class="flex items-center gap-2">
					{#each JOIN_STEPS as s, i (s.title)}
						<!-- 未完成段原本用 bg-muted：深色模式 --muted 與 --card 同色，對比 1.00:1 直接消失。foreground/20 兩個模式都看得見。 -->
						<span class={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-foreground/20")}
						></span>
					{/each}
				</div>
				<h2
					bind:this={headingEl}
					tabindex="-1"
					class="mt-4 text-xl font-bold tracking-tight text-foreground outline-none"
				>
					{JOIN_STEPS[step].title}
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					第 {step + 1} / {JOIN_STEPS.length} 步 · {JOIN_STEPS[step].hint}{#if step === 1}
						· 標示 <span class="text-destructive">*</span> 為必填{/if}
				</p>
			</div>

			<!-- ① 商家類型 -->
			<fieldset hidden={step !== 0} disabled={step !== 0} class="space-y-3">
				<div class="grid grid-cols-2 gap-2.5">
					{#each JOIN_CATEGORIES as option (option.value)}
						{@render categoryCard(option, form.category === option.value, () => {
							form = selectJoinCategory(form, option.value);
						})}
					{/each}
				</div>
			</fieldset>

			<!-- ② 基本資料 -->
			<fieldset hidden={step !== 1} disabled={step !== 1} class="space-y-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="grid gap-2 sm:col-span-2">
						<Label for="business_name">商家名稱 <span class="text-destructive">*</span></Label>
						<Input id="business_name" bind:value={form.business_name} placeholder="例：康博美學診所" required />
					</div>

					<div class="grid gap-2">
						<Label for="contact_name">聯絡人姓名 <span class="text-destructive">*</span></Label>
						<Input id="contact_name" bind:value={form.contact_name} placeholder="王小明" required />
					</div>

					<div class="grid gap-2">
						<Label for="phone">聯絡電話 <span class="text-destructive">*</span></Label>
						<Input id="phone" type="tel" bind:value={form.phone} placeholder="0912345678" required />
					</div>

					<div class="grid gap-2">
						<Label for="email">Email <span class="text-destructive">*</span></Label>
						<Input
							id="email"
							type="email"
							bind:value={form.email}
							placeholder="contact@example.com"
							required
						/>
					</div>

					<div class="grid gap-2">
						<Label for="city">縣市 <span class="text-destructive">*</span></Label>
						<Select type="single" items={cityItems} value={form.city} onValueChange={(v) => (form.city = v)}>
							<SelectTrigger id="city" class="w-full"><SelectValue placeholder="請選擇縣市" /></SelectTrigger>
							<SelectContent>
								{#each cityItems as city (city.value)}
									<SelectItem value={city.value} label={city.label} />
								{/each}
							</SelectContent>
						</Select>
					</div>

					<div class="grid gap-2 sm:col-span-2">
						<Label for="address">地址</Label>
						<Input id="address" bind:value={form.address} placeholder="完整地址（選填）" />
					</div>
				</div>
			</fieldset>

			<!-- ③ 服務資訊 -->
			<fieldset hidden={step !== 2} disabled={step !== 2} class="space-y-4">
				<!-- 主要服務子類別：多選 chip（依所選大類動態切換清單） -->
				<div class="grid gap-2">
					<Label
						>{isClinic ? "主要科別" : "主要服務項目"}<span class="ml-1 text-xs font-normal text-muted-foreground"
							>可複選</span
						></Label
					>
					{#if categoryOptions.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each categoryOptions as option (option.code)}
								{@render categoryChip(option.label, form.service_categories.includes(option.code), () => {
									form = toggleServiceCategory(form, option.code);
								})}
							{/each}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">此類型暫無預設項目，請於下方補充說明。</p>
					{/if}
				</div>

				<!-- 付費類型：診所專屬 -->
				{#if isClinic}
					<div class="grid gap-2 sm:max-w-[240px]">
						<Label for="payment_type">付費類型</Label>
						<Select
							type="single"
							items={paymentItems}
							value={form.payment_type}
							onValueChange={(v) => (form.payment_type = v as PaymentType)}
						>
							<SelectTrigger id="payment_type" class="w-full"><SelectValue /></SelectTrigger>
							<SelectContent>
								{#each paymentItems as option (option.value)}
									<SelectItem value={option.value} label={option.label} />
								{/each}
							</SelectContent>
						</Select>
					</div>
				{/if}

				<!-- 補充說明：自由文字（與多選並存） -->
				<div class="grid gap-2">
					<Label for="services">其他服務項目（補充）</Label>
					<Input
						id="services"
						bind:value={form.services}
						placeholder={SERVICE_PLACEHOLDERS[form.category] ?? "未列於上方的服務可在此補充（選填）"}
					/>
				</div>

				<div class="grid gap-2 sm:max-w-[240px]">
					<Label for="team_size">團隊規模</Label>
					<Select
						type="single"
						items={teamSizeItems}
						value={form.team_size}
						onValueChange={(v) => (form.team_size = v)}
					>
						<SelectTrigger id="team_size" class="w-full"><SelectValue placeholder="請選擇（選填）" /></SelectTrigger>
						<SelectContent>
							{#each teamSizeItems as option (option.value)}
								<SelectItem value={option.value} label={option.label} />
							{/each}
						</SelectContent>
					</Select>
				</div>

				<div class="grid gap-2">
					<Label for="message">備註 / 想了解的服務</Label>
					<Textarea
						id="message"
						bind:value={form.message}
						placeholder="想了解的方案、希望開通的功能，或任何想讓我們知道的事（選填）"
						rows={4}
					/>
				</div>
			</fieldset>

			<!-- role="alert" 必須在錯誤出現前就在 DOM 裡才穩定觸發，所以容器常駐、只切換內容。
			     text-destructive 疊在 destructive/10 上只有 4.13:1（深色 3.56:1），改用實色過 AA。 -->
			<div
				role="alert"
				class={cn(
					error
						? "rounded-2xl bg-destructive/10 p-3 text-sm text-red-800 ring-1 ring-destructive/20 dark:text-red-300"
						: "sr-only",
				)}
			>
				{error}
			</div>

			<!-- 導覽：最後一步才是送出 -->
			<div class="space-y-3">
				<div class="flex gap-3">
					{#if step > 0}
						<Button
							type="button"
							size="lg"
							variant="outline"
							onclick={() => {
								error = null;
								step -= 1;
							}}
							disabled={isSubmitting}
						>
							上一步
						</Button>
					{/if}
					{#if step < JOIN_STEPS.length - 1}
						<Button type="button" size="lg" class="group/next flex-1" onclick={goNext}>
							下一步
							<ArrowRight class="size-4 transition-transform group-hover/next:translate-x-0.5" />
						</Button>
					{:else}
						<Button type="submit" size="lg" class="group/submit flex-1" disabled={isSubmitting || !canSubmit}>
							{#if isSubmitting}
								<Loader2 class="size-4 animate-spin" />
								送出中…
							{:else}
								送出加入申請
								<ArrowRight class="size-4 transition-transform group-hover/submit:translate-x-0.5" />
							{/if}
						</Button>
					{/if}
				</div>
				{#if step === JOIN_STEPS.length - 1}
					<p class="text-center text-xs text-muted-foreground">送出後輸入寄到信箱的 6 位數驗證碼，後台立即開通。</p>
				{/if}
			</div>
		</div>
	</form>
{/if}
