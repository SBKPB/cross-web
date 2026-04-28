"use client";

import { useState } from "react";
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
} from "@/lib/constants/patient-constants";
import type { IdentifierType } from "@/types/member-patient";

interface NewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (patient: MemberPatientRead) => void;
}

export function NewPatientDialog({
  open,
  onOpenChange,
  onCreated,
}: NewPatientDialogProps) {
  const [name, setName] = useState("");
  const [identifierType, setIdentifierType] =
    useState<IdentifierType>("national_id");
  const [identifierValue, setIdentifierValue] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("other");
  const [error, setError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setIdentifierType("national_id");
    setIdentifierValue("");
    setBirthDate("");
    setGender("");
    setPhone("");
    setRelation("other");
    setError(null);
    setIdentifierError(null);
  };

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

    if (!validateIdentifier(identifierType, identifierValue)) {
      setIdentifierError(IDENTIFIER_ERROR_MESSAGES[identifierType]);
      return;
    }

    setIsSubmitting(true);
    try {
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
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "建立失敗，請稍後再試";
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
          <DialogTitle>新增看診對象</DialogTitle>
          <DialogDescription>
            填寫家屬或其他看診人的基本資料
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
              {error}
            </div>
          )}

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
              身分識別碼 <span className="text-destructive">*</span>
            </Label>
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

          <div className="grid grid-cols-2 gap-4">
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
            <div className="grid gap-2">
              <Label htmlFor="np-relation">關係</Label>
              <Select value={relation} onValueChange={setRelation}>
                <SelectTrigger id="np-relation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">配偶</SelectItem>
                  <SelectItem value="child">子女</SelectItem>
                  <SelectItem value="parent">父母</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                !identifierValue.trim() ||
                !birthDate ||
                !gender ||
                !phone.trim()
              }
            >
              {isSubmitting ? "建立中..." : "新增"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
