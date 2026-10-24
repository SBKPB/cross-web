<script lang="ts">
	// 只供 tests/dialog-focus.test.mjs 使用：用真正的共用 ui 元件與診所對話框重現「以鍵盤開啟、關閉對話框」
	import ClinicDetailDialog from "#lib/components/clinics/ClinicDetailDialog.svelte";
	import ShareClinicDialog from "#lib/components/clinics/ShareClinicDialog.svelte";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogTitle,
		DialogTrigger,
	} from "#lib/components/ui/dialog/index.js";
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogTrigger,
	} from "#lib/components/ui/alert-dialog/index.js";
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetTitle,
		SheetTrigger,
	} from "#lib/components/ui/sheet/index.js";
	import type { Clinic } from "#lib/types/clinic.ts";

	let { scenario }: { scenario: string } = $props();
	let open = $state(false);

	// 與正式資料同形：有預約／詳情／導航三個連結，關閉鈕在它們之後
	const clinic: Clinic = {
		id: "00000000-0000-4000-8000-000000000001",
        online_booking_enabled: true,
		clinic_name: "測試診所",
		hospital_level: "clinic",
		departments: ["family_medicine"],
		phone: "02-1234-5678",
		address: "臺北市中正區測試路 1 號",
		facility_type: "healthcare",
		payment_type: "nhi",
		rating: 4.5,
		business_hours: [{ day: "週一", open: "09:00", close: "12:00", is_closed: false }],
	};
</script>

<!-- 「trigger-*」情境由對話框自己的 Trigger 當 #trigger；其餘由外部按鈕受控開啟（與診所詳情、分享對話框相同） -->
{#if !scenario.startsWith("trigger-")}
	<button id="trigger" type="button" onclick={() => (open = true)}>開啟</button>
{/if}

{#if scenario === "clinic-detail"}
	<ClinicDetailDialog {clinic} bind:open />
{:else if scenario === "share"}
	<ShareClinicDialog clinicId={clinic.id} clinicName={clinic.clinic_name} bind:open />
{:else if scenario === "links-only"}
	<Dialog bind:open>
		<DialogContent showCloseButton={false}>
			<DialogTitle>只有連結</DialogTitle>
			<DialogDescription>沒有連結以外可聚焦的元素</DialogDescription>
			<a id="only-link" href="/somewhere">連結</a>
		</DialogContent>
	</Dialog>
{:else if scenario === "skips-unfocusable"}
	<Dialog bind:open>
		<DialogContent showCloseButton={false}>
			<DialogTitle>略過不可聚焦的元素</DialogTitle>
			<DialogDescription>disabled、hidden、type=hidden、display:none 與連結都會略過</DialogDescription>
			<button id="disabled-button" type="button" disabled>停用</button>
			<button id="hidden-button" type="button" hidden>隱藏</button>
			<input id="hidden-input" type="hidden" value="x" />
			<button id="display-none-button" type="button" style="display: none">不顯示</button>
			<a id="first-link" href="/somewhere">連結</a>
			<input id="text-input" value="全選的文字" />
			<button id="later-button" type="button">之後的按鈕</button>
		</DialogContent>
	</Dialog>
{:else if scenario === "prevented"}
	<Dialog bind:open>
		<DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
			<DialogTitle>呼叫端取消自動聚焦</DialogTitle>
			<DialogDescription>呼叫端 preventDefault 時不自動聚焦</DialogDescription>
			<button id="inner-button" type="button">內部按鈕</button>
		</DialogContent>
	</Dialog>
{:else if scenario === "self-focused"}
	<Dialog bind:open>
		<DialogContent>
			<DialogTitle>內容自行聚焦</DialogTitle>
			<DialogDescription>開啟時已有元素取得焦點就不搶（例如子元件掛載時自行 focus）</DialogDescription>
			<button id="first-button" type="button">第一個按鈕</button>
			<input id="self-focus-input" {@attach (node) => node.focus()} />
		</DialogContent>
	</Dialog>
{:else if scenario === "trigger-dialog"}
	<Dialog bind:open>
		<DialogTrigger id="trigger">開啟</DialogTrigger>
		<DialogContent>
			<DialogTitle>有 Trigger 的對話框</DialogTitle>
			<DialogDescription>關閉時焦點回到 Trigger</DialogDescription>
		</DialogContent>
	</Dialog>
{:else if scenario === "trigger-close-prevented"}
	<Dialog bind:open>
		<DialogTrigger id="trigger">開啟</DialogTrigger>
		<DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
			<DialogTitle>呼叫端取消關閉時的聚焦</DialogTitle>
			<DialogDescription>呼叫端 preventDefault 時關閉後不移動焦點</DialogDescription>
		</DialogContent>
	</Dialog>
{:else if scenario === "trigger-sheet"}
	<Sheet bind:open>
		<SheetTrigger id="trigger">開啟</SheetTrigger>
		<SheetContent>
			<SheetTitle>有 Trigger 的 Sheet</SheetTitle>
			<SheetDescription>關閉時焦點回到 Trigger</SheetDescription>
		</SheetContent>
	</Sheet>
{:else if scenario === "external-with-trigger"}
	<Dialog bind:open>
		<DialogTrigger id="dialog-trigger">對話框自己的 Trigger</DialogTrigger>
		<DialogContent>
			<DialogTitle>由外部按鈕開啟、另有 Trigger</DialogTitle>
			<DialogDescription>Radix 關閉時一律聚焦 Trigger，不是開啟前的焦點</DialogDescription>
		</DialogContent>
	</Dialog>
{:else if scenario === "alert-dialog"}
	<!-- 會員預約詳情的取消確認：由外部按鈕受控開啟，Action 不自動關閉（Radix 由呼叫端 preventDefault） -->
	<AlertDialog bind:open>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>確認取消預約</AlertDialogTitle>
				<AlertDialogDescription>取消後此時段將釋出</AlertDialogDescription>
			</AlertDialogHeader>
			<a id="alert-link" href="/somewhere">連結</a>
			<AlertDialogFooter>
				<AlertDialogCancel id="alert-cancel">先不要</AlertDialogCancel>
				<AlertDialogAction id="alert-action" onclick={(e) => e.preventDefault()}>確認取消</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
{:else if scenario === "trigger-alert-dialog"}
	<AlertDialog bind:open>
		<AlertDialogTrigger id="trigger">開啟</AlertDialogTrigger>
		<AlertDialogContent>
			<AlertDialogTitle>有 Trigger 的確認對話框</AlertDialogTitle>
			<AlertDialogDescription>關閉時焦點回到 Trigger</AlertDialogDescription>
			<AlertDialogFooter>
				<AlertDialogCancel id="alert-cancel">取消</AlertDialogCancel>
				<AlertDialogAction id="alert-action">確定</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
{:else if scenario === "sheet"}
	<Sheet bind:open>
		<SheetContent showCloseButton={false}>
			<SheetTitle>Sheet</SheetTitle>
			<SheetDescription>Sheet 同樣是 Dialog，套用同一規則</SheetDescription>
			<a id="sheet-link" href="/somewhere">連結</a>
			<button id="sheet-button" type="button">按鈕</button>
		</SheetContent>
	</Sheet>
{/if}
