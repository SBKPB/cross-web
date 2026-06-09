"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { memberPatientApi } from "@/lib/api/member-patient";
import type { MemberPatientRead } from "@/types/member-patient";
import { validateIdentifier } from "@/lib/validation/tw-identifier";
import {
  IDENTIFIER_TYPE_LABELS,
  IDENTIFIER_PLACEHOLDERS,
  IDENTIFIER_ERROR_MESSAGES,
  RELATION_LABELS,
} from "@/lib/constants/patient-constants";
import type { IdentifierType } from "@/types/member-patient";

// 對話框內可選的關係（順序：本人優先）
const RELATION_OPTIONS = ["self", "spouse", "child", "parent", "other"] as const;

interface NewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (patient: MemberPatientRead) => void;
  /** 預設關係（如「為本人預約」引導時帶 self） */
  defaultRelation?: string;
  /** 預設姓名（如本人引導時用會員 profile 名稱預填） */
  defaultName?: string;
  /** 帶入此值即進入「編輯」模式；證件類型與末4碼唯讀不可改 */
  editPatient?: MemberPatientRead | null;
  /** 編輯成功的回呼（與 onCreated 並存，編輯模式優先） */
  onUpdated?: (patient: MemberPatientRead) => void;
}

export function NewPatientDialog({
  open,
  onOpenChange,
  onCreated,
  defaultRelation = "other",
  defaultName = "",
  editPatient = null,
  onUpdated,
}: NewPatientDialogProps) {
  const isEdit = !!editPatient;
  const [name, setName] = useState(defaultName);
  const [identifierType, setIdentifierType] =
    useState<IdentifierType>("national_id");
  const [identifierValue, setIdentifierValue] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState(defaultRelation);
  const [error, setError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 每次開啟時初始化：編輯模式帶入既有資料、新增模式用預設值
  useEffect(() => {
    if (!open) return;
    if (editPatient) {
      setName(editPatient.name);
      setIdentifierType(editPatient.identifier_type);
      setIdentifierValue("");
      setBirthDate(editPatient.birth_date);
      setGender(editPatient.gender);
      setPhone(editPatient.phone ?? "");
      setRelation(editPatient.relation);
      setError(null);
      setIdentifierError(null);
    } else {
      setName(defaultName);
      setRelation(defaultRelation);
    }
  }, [open, editPatient, defaultName, defaultRelation]);

  const resetForm = () => {
    setName(defaultName);
    setIdentifierType("national_id");
    setIdentifierValue("");
    setBirthDate("");
    setGender("");
    setPhone("");
    setRelation(defaultRelation);
    setError(null);
    setIdentifierError(null);
  };

  const isSelf = relation === "self";

  const handleIdentifierChange = (value: string) => {
    setIdentifierValue(value);
    if (value.trim().length >= 6) {
      setIdentifierError(
        validateIdentifier(identifierType, value)
          ? null
          : IDENTIFIER_ERROR_MESSAGES[identifierType],
      );
    } else {
      setIdentifierError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 編輯模式不改證件，跳過證件驗證
    if (!isEdit && !validateIdentifier(identifierType, identifierValue)) {
      setIdentifierError(IDENTIFIER_ERROR_MESSAGES[identifierType]);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && editPatient) {
        // 證件類型與末4碼唯讀：僅更新可變欄位
        const updated = await memberPatientApi.update(editPatient.id, {
          name,
          birth_date: birthDate,
          gender,
          phone,
          relation,
        });
        onUpdated?.(updated);
      } else {
        const created = await memberPatientApi.create({
          name,
          identifier_type: identifierType,
          identifier_value: identifierValue,
          birth_date: birthDate,
          gender,
          phone,
          relation,
        });
        resetForm();
        onCreated(created);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "儲存失敗，請稍後再試";
      setError(msg.includes("已經是") ? "此身分識別碼已存在" : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "編輯看診對象"
              : isSelf
                ? "新增本人就診資料"
                : "新增看診對象"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "證件類型與號碼不可修改，如需更改請刪除後重新新增"
              : isSelf
                ? "填寫您本人的就診資料，之後預約會自動帶入"
                : "填寫家屬或其他看診人的基本資料"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="np-relation">與您的關係</Label>
            <Select value={relation} onValueChange={setRelation}>
              <SelectTrigger id="np-relation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATION_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {RELATION_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="np-name">
              姓名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="np-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>
              身分識別碼 {!isEdit && <span className="text-destructive">*</span>}
            </Label>
            {isEdit && editPatient ? (
              // 編輯模式：證件類型 + 末4碼唯讀（不可改）
              <Input
                value={`${IDENTIFIER_TYPE_LABELS[editPatient.identifier_type]} ****${editPatient.identifier_last4}`}
                readOnly
                disabled
                className="tabular-nums"
              />
            ) : (
              <>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <Select
                    value={identifierType}
                    onValueChange={(v) => {
                      setIdentifierType(v as IdentifierType);
                      setIdentifierError(null);
                    }}
                  >
                    <SelectTrigger id="np-id-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(IDENTIFIER_TYPE_LABELS) as [
                          IdentifierType,
                          string,
                        ][]
                      ).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="np-id-value"
                    value={identifierValue}
                    onChange={(e) => handleIdentifierChange(e.target.value)}
                    placeholder={IDENTIFIER_PLACEHOLDERS[identifierType]}
                    required
                  />
                </div>
                {identifierError && (
                  <p className="text-xs text-destructive">{identifierError}</p>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="np-birth">
                生日 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="np-birth"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>
                性別 <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={gender}
                onValueChange={setGender}
                className="flex gap-4 pt-2"
              >
                <label
                  htmlFor="np-gender-m"
                  className="flex items-center gap-2"
                >
                  <RadioGroupItem value="M" id="np-gender-m" />
                  <span className="text-sm">男</span>
                </label>
                <label
                  htmlFor="np-gender-f"
                  className="flex items-center gap-2"
                >
                  <RadioGroupItem value="F" id="np-gender-f" />
                  <span className="text-sm">女</span>
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="np-phone">
              手機號碼 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="np-phone"
              type="tel"
              placeholder="0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={15}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !name.trim() ||
                (!isEdit && !identifierValue.trim()) ||
                !birthDate ||
                !gender ||
                !phone.trim()
              }
            >
              {isSubmitting
                ? isEdit
                  ? "儲存中..."
                  : "建立中..."
                : isEdit
                  ? "儲存"
                  : "新增"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
