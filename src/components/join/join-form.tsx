"use client";

import { useState } from "react";
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
function SectionTitle({ step, children }: { step: number; children: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {step}
      </span>
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        {children}
      </h3>
    </div>
  );
}

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
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col items-start gap-2.5 rounded-2xl p-3.5 text-left transition-all duration-200",
        "ring-1 hover:-translate-y-0.5",
        selected
          ? "bg-primary/[0.06] ring-2 ring-primary shadow-sm"
          : "bg-card ring-foreground/10 hover:ring-primary/40 hover:shadow-sm",
      )}
    >
      {/* 勾選徽章 */}
      <span
        className={cn(
          "absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200",
          selected ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-xl transition-colors duration-200",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary group-hover:bg-primary/15",
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="text-sm font-semibold text-foreground">
        {option.label}
      </span>
      <span className="text-[11px] leading-snug text-muted-foreground">
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
          : "bg-card text-foreground ring-foreground/12 hover:ring-primary/40 hover:text-primary",
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

  const canSubmit =
    form.business_name.trim() &&
    form.contact_name.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.city;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const selected = JOIN_CATEGORIES.find((c) => c.value === form.category)!;
    const payload: JoinApplication = {
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

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "送出失敗，請稍後再試");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("無法連線到伺服器，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center gap-4 overflow-hidden rounded-[2rem] bg-card p-10 text-center shadow-xl ring-1 ring-foreground/5"
        style={{ animation: "fadeInUp 0.5s ease-out both" }}
      >
        <div className="relative flex size-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/15 [animation-iteration-count:3]" />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-9" />
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          申請已送出！
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          感謝您加入 Cross，我們已收到「{form.business_name}」的加入申請。
          營運團隊將在 1–2 個工作天內以電話或 Email 與您聯繫，協助完成後續設定。
        </p>
        <Button
          variant="outline"
          className="mt-1"
          onClick={() => {
            setForm(INITIAL_STATE);
            setSubmitted(false);
          }}
        >
          再填一筆
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[2rem] bg-card shadow-xl ring-1 ring-foreground/5"
      style={{ animation: "fadeInUp 0.5s ease-out both" }}
    >
      {/* 卡片頂部品牌色細線 */}
      <div className="h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70" />

      <div className="space-y-7 p-6 sm:p-8">
        {/* 標題 */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            填寫加入申請
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            大約 2 分鐘 · 標示 <span className="text-destructive">*</span>{" "}
            為必填
          </p>
        </div>

        {/* ① 商家類型 */}
        <fieldset className="space-y-3">
          <SectionTitle step={1}>選擇商家類型</SectionTitle>
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
        <fieldset className="space-y-4">
          <SectionTitle step={2}>商家基本資料</SectionTitle>
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
        <fieldset className="space-y-4">
          <SectionTitle step={3}>{isClinic ? "診所資訊" : "服務資訊"}</SectionTitle>

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

        {/* 蜜罐欄位：對使用者隱藏（0 尺寸 overflow-hidden 容器，避免水平溢出） */}
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

        {error && (
          <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
            {error}
          </div>
        )}

        {/* 送出 */}
        <div className="space-y-3">
          <Button
            type="submit"
            size="lg"
            className="group/submit w-full"
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
          <p className="text-center text-xs text-muted-foreground">
            送出即表示同意 Cross 營運團隊以您提供的聯絡方式與您聯繫。
          </p>
        </div>
      </div>
    </form>
  );
}
