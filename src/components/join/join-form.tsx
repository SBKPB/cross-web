"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Flower2,
  Loader2,
  Sparkles,
  Stethoscope,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categoriesFor } from "@/lib/api/service-categories";
import {
  PAYMENT_TYPE_OPTIONS,
  TAIWAN_CITIES,
} from "@/lib/constants/clinic-constants";
import {
  JOIN_CATEGORIES,
  JOIN_CATEGORY_ACCENT,
  SERVICE_PLACEHOLDERS,
  TEAM_SIZE_OPTIONS,
  type JoinCategoryOption,
} from "@/lib/constants/join-constants";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import { cn } from "@/lib/utils";
import type { PaymentType } from "@/types/clinic";
import type { JoinApplication, JoinCategory } from "@/types/join";

const CATEGORY_ICONS = {
  stethoscope: Stethoscope,
  sparkles: Sparkles,
  flower: Flower2,
  store: Store,
} as const;

interface FormState {
  category: JoinCategory;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  team_size: string;
  service_categories: string[]; // 主要服務子類別 code（多選）
  payment_type: PaymentType;
  services: string;
  message: string;
  hp: string; // 蜜罐
}

const INITIAL_STATE: FormState = {
  category: "clinic",
  business_name: "",
  contact_name: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  team_size: "",
  service_categories: [],
  payment_type: "nhi",
  services: "",
  message: "",
  hp: "",
};

/** 區段標題：序號圓點 + 標題 */
const STEPS = [
  { title: "商家類型", hint: "你經營的是哪一種？" },
  { title: "基本資料", hint: "怎麼聯絡到你" },
  { title: "服務資訊", hint: "提供哪些服務（可略過）" },
];

function CategoryCard({
  option,
  selected,
  onSelect,
}: {
  option: JoinCategoryOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = CATEGORY_ICONS[option.icon];
  const accent = JOIN_CATEGORY_ACCENT[option.value];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col items-start gap-2.5 rounded-2xl p-4 text-left transition-all duration-200",
        // 焦點用 outline 而非本專案慣用的 focus-visible:ring-3：ring 是 box-shadow，
        // 已經被卡片自己的邊框佔用，再疊上去會蓋掉選中態的 ring-2。往外 offset 才分得出來。
        "ring-1 focus-visible:outline-2 focus-visible:outline-offset-2",
        selected
          ? cn("shadow-sm ring-2", accent.card)
          : "bg-card ring-foreground/50 hover:bg-muted/50",
      )}
    >
      {/* 勾號：選中不能只靠顏色傳達（WCAG 1.4.1），色盲使用者靠這個看 */}
      <span
        className={cn(
          "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full transition-all duration-200",
          accent.solid,
          selected ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      {/* 未選中一律中性灰：四顆同色的藍會讓「選中」那顆淹沒在其他三顆裡 */}
      <span
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-xl transition-colors duration-200",
          selected
            ? accent.solid
            : "bg-foreground/[0.07] text-muted-foreground group-hover:text-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="text-sm font-semibold text-foreground">
        {option.label}
      </span>
      <span className="text-xs leading-snug text-muted-foreground">
        {option.description}
      </span>
    </button>
  );
}

/** 服務子類別多選 chip：選中時填滿品牌色 + 勾號 */
function CategoryChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-all duration-200",
        selected
          ? "bg-primary text-primary-foreground ring-primary shadow-sm"
          : "bg-card text-foreground ring-foreground/50 hover:ring-primary hover:text-primary",
      )}
    >
      {selected && <Check className="size-3.5" strokeWidth={3} />}
      {label}
    </button>
  );
}

export function JoinForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const taxonomy = useServiceTaxonomy();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isClinic = form.category === "clinic";

  // 當前所選大類對應的 facilityType 與其子類別清單
  const facilityType = JOIN_CATEGORIES.find(
    (c) => c.value === form.category,
  )!.facilityType;
  const categoryOptions = categoriesFor(taxonomy, facilityType);

  // 切換商家類型：清空已選服務子類別、並重設付款方式（避免殘留別類的 code / 付款別）
  const selectCategory = (value: JoinCategory) =>
    setForm((prev) => ({
      ...prev,
      category: value,
      service_categories: [],
      payment_type: "nhi",
    }));

  // 切換單一服務子類別 code 的選取狀態
  const toggleServiceCategory = (code: string) =>
    setForm((prev) => ({
      ...prev,
      service_categories: prev.service_categories.includes(code)
        ? prev.service_categories.filter((c) => c !== code)
        : [...prev.service_categories, code],
    }));

  // 三段流程：0 商家類型 / 1 基本資料 / 2 服務資訊。
  // 一次只問一段，18 個欄位鋪在同一頁會讓人直接關掉。
  const [step, setStep] = useState(0);

  // ===== 驗證碼階段（送出後同頁完成，不再要求去信箱點連結）=====
  const [code, setCode] = useState("");
  const [vPassword, setVPassword] = useState("");
  const [vConfirm, setVConfirm] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  // 重寄成功等正向回饋（有畫面看得到、螢幕閱讀器也聽得到，不然重寄像沒反應）
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // 重寄冷卻（後端同信箱 60 秒節流；前端先擋掉必然失敗的點擊）
  const [resendIn, setResendIn] = useState(0);
  // 信箱本來就有 Cross 帳號：密碼沿用原本那組，要把這件事講清楚再放行進後台
  const [openedExisting, setOpenedExisting] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // 驗證碼階段只活在記憶體：手機切去收信或不小心重整，回來就是空白表單、
  // 手上的碼無處可輸。把「已送出＋表單內容」存進 sessionStorage，重整後回到輸碼畫面
  // （驗證碼與密碼仍需重新輸入，不落地）。成功／重填時清掉。
  const STORAGE_KEY = "cross_join_pending";
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { form?: FormState };
        if (saved.form?.email) {
          setForm(saved.form);
          setSubmitted(true);
        }
      }
    } catch {
      // 無痕視窗 / 讀取被擋 → 就當作全新填寫，不影響流程
    }
  }, []);
  useEffect(() => {
    try {
      if (submitted && !openedExisting) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ form }));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // 忽略：sessionStorage 不可用不該讓表單壞掉
    }
  }, [submitted, openedExisting, form]);

  // 換步時按鈕會卸載或轉 disabled，焦點被瀏覽器丟回 body。把焦點移到該步標題，
  // 一次解決「鍵盤使用者失去位置」與「螢幕閱讀器不知道畫面換了」兩件事。
  // openedExisting 也要在依賴內：那個「密碼沿用原本那組」的畫面是全流程最不能漏聽的。
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedRef = useRef(false);
  useEffect(() => {
    if (!movedRef.current) {
      movedRef.current = true; // 初次載入不搶焦點
      return;
    }
    headingRef.current?.focus();
  }, [step, submitted, openedExisting]);

  // 逐段驗證：回傳「還缺什麼」而不是一個 boolean。原本只把「下一步」設成 disabled，
  // 使用者把 email 打成 wang@gmail 時按鈕就是灰的、畫面上沒有半個字說明原因。
  const missingInStep1 = (): { id: string; label: string }[] => {
    const miss: { id: string; label: string }[] = [];
    if (!form.business_name.trim())
      miss.push({ id: "business_name", label: "商家名稱" });
    if (!form.contact_name.trim())
      miss.push({ id: "contact_name", label: "聯絡人姓名" });
    if (!form.phone.trim()) miss.push({ id: "phone", label: "聯絡電話" });
    // 第二步的 fieldset 到第三步會被 disabled（避開 hidden+required 無法 focus 的
    // 原生錯誤），連帶跳過 type="email" 的原生檢查，所以格式在這裡就擋掉
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      miss.push({ id: "email", label: form.email.trim() ? "Email 格式" : "Email" });
    if (!form.city) miss.push({ id: "city", label: "縣市" });
    return miss;
  };

  /** 按下「下一步」：擋關時把缺項講出來並把焦點送到第一個問題欄位。 */
  const goNext = () => {
    const miss = step === 1 ? missingInStep1() : [];
    if (miss.length > 0) {
      setError(`還差：${miss.map((m) => m.label).join("、")}`);
      document.getElementById(miss[0].id)?.focus();
      return;
    }
    setError(null);
    setStep((n) => n + 1);
  };

  const canSubmit = missingInStep1().length === 0;

  const buildPayload = (): JoinApplication => {
    const selected = JOIN_CATEGORIES.find((c) => c.value === form.category)!;
    return {
      category: form.category,
      facility_type: selected.facilityType,
      business_name: form.business_name.trim(),
      contact_name: form.contact_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city,
      address: form.address.trim() || undefined,
      team_size: form.team_size || undefined,
      message: form.message.trim() || undefined,
      hp: form.hp || undefined,
      // 主分類改為多選 service_categories（四大類皆送）
      service_categories:
        form.service_categories.length > 0
          ? form.service_categories
          : undefined,
      // 補充說明自由文字（與多選並存）
      services: form.services.trim() || undefined,
      // 付費類型為診所專屬
      ...(isClinic ? { payment_type: form.payment_type } : {}),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 在欄位裡按 Enter 會觸發隱式送出，只有最後一步才算數
    if (step !== STEPS.length - 1) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "送出失敗，請稍後再試");
        return;
      }
      setSubmitted(true);
      setResendIn(60);
    } catch {
      setError("無法連線到伺服器，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setVerifyError("請輸入信中的 6 位數驗證碼");
      return;
    }
    if (vPassword.length < 8) {
      setVerifyError("密碼至少 8 碼");
      return;
    }
    if (vPassword !== vConfirm) {
      setVerifyError("兩次輸入的密碼不一致");
      return;
    }
    setVerifyError(null);
    setVerifyNotice(null);
    setIsVerifying(true);
    try {
      const res = await fetch("/api/v1/facility-applications/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          code,
          password: vPassword,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | {
            access_token?: string;
            refresh_token?: string;
            existing_account?: boolean;
            // detail 可能是 FastAPI 422 的錯誤物件陣列，不一定是字串
            detail?: unknown;
          }
        | null;
      if (!res.ok || !json?.access_token || !json.refresh_token) {
        // 只有字串才拿來當訊息；422 的 detail 是陣列，直接 render 會讓 React 崩潰
        const detail =
          typeof json?.detail === "string" ? json.detail : "驗證失敗，請稍後再試";
        setVerifyError(detail);
        return;
      }
      localStorage.setItem("access_token", json.access_token);
      localStorage.setItem("refresh_token", json.refresh_token);
      if (json.existing_account) {
        // 密碼沿用原帳號那組——先講清楚再讓他進後台，否則他會拿剛設的新密碼去登入
        setOpenedExisting(true);
      } else {
        // 整頁導向讓 auth-context 在載入時讀 localStorage 完成登入
        window.location.assign("/admin");
      }
    } catch {
      setVerifyError("無法連線到伺服器，請稍後再試");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setVerifyError(null);
    setVerifyNotice(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // resend：後端會換發新碼；web route 據此略過營運通知信，不重複轟炸信箱
        body: JSON.stringify({ ...buildPayload(), resend: true }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!res.ok || !json?.ok) {
        setVerifyError(json?.error ?? "重新寄送失敗，請稍後再試");
        return;
      }
      setCode("");
      setResendIn(60);
      // 舊碼已作廢，明講「以最新一封為準」避免使用者輸入舊信的碼
      setVerifyNotice("新的驗證碼已寄出，請以最新一封信的驗證碼為準。");
    } catch {
      setVerifyError("無法連線到伺服器，請稍後再試");
    } finally {
      setIsResending(false);
    }
  };

  if (submitted) {
    // 帳號已開通、但信箱本來就有 Cross 帳號 → 先講清楚密碼沿用哪一組
    if (openedExisting) {
      return (
        <div
          className="flex flex-col items-center gap-4 overflow-hidden rounded-[2rem] bg-card p-10 text-center shadow-xl ring-1 ring-foreground/5"
          style={{ animation: "fadeInUp 0.5s ease-out both" }}
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-9" />
          </span>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold tracking-tight text-foreground outline-none"
          >
            後台已開通
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            這個信箱本來就有 Cross 帳號，登入密碼
            <strong className="font-medium text-foreground">沿用原本那組</strong>
            ——剛剛填的新密碼沒有被使用。
          </p>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            現在就能進後台整理院所資料；上架到民眾端需通過審核，屆時會寄信通知。
          </p>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            不記得原本的密碼？下次登入前請來信{" "}
            <strong className="font-medium text-foreground">
              office@twinhao.com
            </strong>{" "}
            協助重設。
          </p>
          <Button
            size="lg"
            className="mt-1"
            onClick={() => window.location.assign("/admin")}
          >
            進入院所後台
            <ArrowRight className="size-4" />
          </Button>
        </div>
      );
    }

    return (
      <form
        onSubmit={handleVerify}
        className="overflow-hidden rounded-[2rem] bg-card shadow-xl ring-1 ring-foreground/5"
        style={{ animation: "fadeInUp 0.5s ease-out both" }}
      >
        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-bold tracking-tight text-foreground outline-none"
            >
              輸入驗證碼，立即開通後台
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              若你剛送出申請，驗證碼會寄到{" "}
              <strong className="font-medium text-foreground">
                {form.email}
              </strong>
              ，15 分鐘內有效。{" "}
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setVerifyError(null);
                  setVerifyNotice(null);
                  setCode("");
                }}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                填錯信箱？返回修改
              </button>
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="otp-code">6 位數驗證碼</Label>
            <Input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="h-14 text-center text-2xl font-bold tracking-[0.5em] tabular-nums"
              placeholder="000000"
            />
          </div>

          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="otp-password">設定後台密碼</Label>
                <Input
                  id="otp-password"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={vPassword}
                  onChange={(e) => setVPassword(e.target.value)}
                  placeholder="至少 8 碼"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="otp-confirm">再次輸入密碼</Label>
                <Input
                  id="otp-confirm"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={vConfirm}
                  onChange={(e) => setVConfirm(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              之後就用這個信箱＋這組密碼登入院所後台。若這個信箱已經有 Cross
              帳號，會沿用原本的密碼，這裡填的不會生效。
            </p>
          </div>

          {/* role="alert" 容器常駐、只切內容才穩定觸發朗讀；顏色沿用主表單過 AA 的實色 */}
          <div
            role="alert"
            className={cn(
              verifyError
                ? "rounded-2xl bg-destructive/10 p-3 text-sm text-red-800 ring-1 ring-destructive/20 dark:text-red-300"
                : verifyNotice
                  ? "rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-300"
                  : "sr-only",
            )}
          >
            {verifyError ?? verifyNotice}
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  開通中…
                </>
              ) : (
                <>
                  完成驗證，進入後台
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              沒收到信？看看垃圾信匣，或{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0 || isResending}
                className="font-medium text-primary underline-offset-2 enabled:hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground"
              >
                {resendIn > 0
                  ? `重新寄送（${resendIn} 秒後可用）`
                  : isResending
                    ? "寄送中…"
                    : "重新寄送驗證碼"}
              </button>
            </p>
            {/* 已完成驗證的人重送表單不會再收到碼——給一條登入逃生口，別讓他卡死 */}
            <p className="text-center text-xs text-muted-foreground">
              已經完成過驗證了？直接{" "}
              <Link
                href="/admin/login"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                前往登入
              </Link>
              。帳號開通後即可整理院所資料；上架到民眾端需審核通過，屆時會寄信通知。
            </p>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[2rem] bg-card shadow-xl ring-1 ring-foreground/5"
      style={{ animation: "fadeInUp 0.5s ease-out both" }}
    >
      {/* 蜜罐欄位：對使用者隱藏。刻意放在 space-y-7 容器「之外」——Tailwind 4 的
          space-y 用 :not(:last-child) 選擇器，零高度的它照樣分到一格 28px。 */}
      <div aria-hidden="true" className="h-0 w-0 overflow-hidden">
        <input
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          value={form.hp}
          onChange={(e) => update("hp", e.target.value)}
        />
      </div>

      <div className="space-y-7 p-6 sm:p-8">
        {/* 進度：讓人知道還剩幾步，而不是面對一片問不完的欄位 */}
        <div>
          <div
            aria-hidden="true"
            className="flex items-center gap-2"
          >
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  // 未完成段原本用 bg-muted：深色模式 --muted 與 --card 同色，
                  // 對比 1.00:1 直接消失。foreground/20 兩個模式都看得見。
                  i <= step ? "bg-primary" : "bg-foreground/20",
                )}
              />
            ))}
          </div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mt-4 text-xl font-bold tracking-tight text-foreground outline-none"
          >
            {STEPS[step].title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            第 {step + 1} / {STEPS.length} 步 · {STEPS[step].hint}
            {step === 1 && (
              <>
                {" "}
                · 標示 <span className="text-destructive">*</span> 為必填
              </>
            )}
          </p>
        </div>

        {/* ① 商家類型 */}
        <fieldset hidden={step !== 0} disabled={step !== 0} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {JOIN_CATEGORIES.map((option) => (
              <CategoryCard
                key={option.value}
                option={option}
                selected={form.category === option.value}
                onSelect={() => selectCategory(option.value)}
              />
            ))}
          </div>
        </fieldset>

        {/* ② 基本資料 */}
        <fieldset hidden={step !== 1} disabled={step !== 1} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="business_name">
                商家名稱 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="business_name"
                value={form.business_name}
                onChange={(e) => update("business_name", e.target.value)}
                placeholder="例：康博美學診所"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_name">
                聯絡人姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact_name"
                value={form.contact_name}
                onChange={(e) => update("contact_name", e.target.value)}
                placeholder="王小明"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">
                聯絡電話 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="0912345678"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="contact@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="city">
                縣市 <span className="text-destructive">*</span>
              </Label>
              <Select value={form.city} onValueChange={(v) => update("city", v)}>
                <SelectTrigger id="city" className="w-full">
                  <SelectValue placeholder="請選擇縣市" />
                </SelectTrigger>
                <SelectContent>
                  {TAIWAN_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="完整地址（選填）"
              />
            </div>
          </div>
        </fieldset>

        {/* ③ 服務資訊 */}
        <fieldset hidden={step !== 2} disabled={step !== 2} className="space-y-4">

          {/* 主要服務子類別：多選 chip（依所選大類動態切換清單） */}
          <div className="grid gap-2">
            <Label>
              {isClinic ? "主要科別" : "主要服務項目"}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                可複選
              </span>
            </Label>
            {categoryOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((option) => (
                  <CategoryChip
                    key={option.code}
                    label={option.label}
                    selected={form.service_categories.includes(option.code)}
                    onToggle={() => toggleServiceCategory(option.code)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                此類型暫無預設項目，請於下方補充說明。
              </p>
            )}
          </div>

          {/* 付費類型：診所專屬 */}
          {isClinic && (
            <div className="grid gap-2 sm:max-w-[240px]">
              <Label htmlFor="payment_type">付費類型</Label>
              <Select
                value={form.payment_type}
                onValueChange={(v: PaymentType) => update("payment_type", v)}
              >
                <SelectTrigger id="payment_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 補充說明：自由文字（與多選並存） */}
          <div className="grid gap-2">
            <Label htmlFor="services">其他服務項目（補充）</Label>
            <Input
              id="services"
              value={form.services}
              onChange={(e) => update("services", e.target.value)}
              placeholder={
                SERVICE_PLACEHOLDERS[form.category] ??
                "未列於上方的服務可在此補充（選填）"
              }
            />
          </div>

          <div className="grid gap-2 sm:max-w-[240px]">
            <Label htmlFor="team_size">團隊規模</Label>
            <Select
              value={form.team_size}
              onValueChange={(v) => update("team_size", v)}
            >
              <SelectTrigger id="team_size" className="w-full">
                <SelectValue placeholder="請選擇（選填）" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">備註 / 想了解的服務</Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="想了解的方案、希望開通的功能，或任何想讓我們知道的事（選填）"
              rows={4}
            />
          </div>
        </fieldset>

        {/* role="alert" 必須在錯誤出現前就在 DOM 裡才穩定觸發，所以容器常駐、只切換內容。
            text-destructive 疊在 destructive/10 上只有 4.13:1（深色 3.56:1），改用實色過 AA。 */}
        <div
          role="alert"
          className={cn(
            error
              ? "rounded-2xl bg-destructive/10 p-3 text-sm text-red-800 ring-1 ring-destructive/20 dark:text-red-300"
              : "sr-only",
          )}
        >
          {error}
        </div>

        {/* 導覽：最後一步才是送出 */}
        <div className="space-y-3">
          <div className="flex gap-3">
            {step > 0 && (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setStep((n) => n - 1);
                }}
                disabled={isSubmitting}
              >
                上一步
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                key="next"
                type="button"
                size="lg"
                className="group/next flex-1"
                onClick={goNext}
              >
                下一步
                <ArrowRight className="size-4 transition-transform group-hover/next:translate-x-0.5" />
              </Button>
            ) : (
              <Button
                key="submit"
                type="submit"
                size="lg"
                className="group/submit flex-1"
                disabled={isSubmitting || !canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    送出中…
                  </>
                ) : (
                  <>
                    送出加入申請
                    <ArrowRight className="size-4 transition-transform group-hover/submit:translate-x-0.5" />
                  </>
                )}
              </Button>
            )}
          </div>
          {step === STEPS.length - 1 && (
            <p className="text-center text-xs text-muted-foreground">
              送出後輸入寄到信箱的 6 位數驗證碼，後台立即開通。
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
