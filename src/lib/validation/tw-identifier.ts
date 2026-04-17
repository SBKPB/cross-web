/**
 * 台灣身分證 / 居留證 / 護照號碼驗證
 *
 * 與後端 app/core/tw_identifier.py 同一套演算法。
 * 用 Zod .refine() 或表單 onChange 即時驗證。
 */

import type { IdentifierType } from "@/types/member-patient";

const LETTER_MAP: Record<string, number> = {
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16,
  H: 17, I: 34, J: 18, K: 19, L: 20, M: 21, N: 22,
  O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27, U: 28,
  V: 29, W: 32, X: 30, Y: 31, Z: 33,
};

const WEIGHTS = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];

function checksumOk(value: string): boolean {
  if (value.length !== 10) return false;
  const head = value[0];
  const n = LETTER_MAP[head];
  if (n === undefined) return false;

  const digits = [Math.floor(n / 10), n % 10];
  for (let i = 1; i < value.length; i++) {
    const d = parseInt(value[i], 10);
    if (isNaN(d)) return false;
    digits.push(d);
  }

  let total = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    total += digits[i] * WEIGHTS[i];
  }
  return total % 10 === 0;
}

/** 台灣身分證 A123456789（第 2 碼 1=男 2=女） */
export function validateNationalId(value: string): boolean {
  const v = value.toUpperCase().trim();
  if (!/^[A-Z][12]\d{8}$/.test(v)) return false;
  return checksumOk(v);
}

/** 居留證統一證號（舊式 A+[A-D]+8碼 / 新式 A+[89]+8碼） */
export function validateArc(value: string): boolean {
  const v = value.toUpperCase().trim();
  if (!/^[A-Z][A-D89]\d{8}$/.test(v)) return false;

  const second = v[1];
  if (/[A-D]/.test(second)) {
    const firstNum = LETTER_MAP[v[0]];
    const secondNum = LETTER_MAP[second] % 10;
    const digits = [Math.floor(firstNum / 10), firstNum % 10, secondNum];
    for (let i = 2; i < v.length; i++) {
      const d = parseInt(v[i], 10);
      if (isNaN(d)) return false;
      digits.push(d);
    }
    let total = 0;
    for (let i = 0; i < WEIGHTS.length; i++) {
      total += digits[i] * WEIGHTS[i];
    }
    return total % 10 === 0;
  }

  return checksumOk(v);
}

/** 護照：寬鬆格式（各國差異大） */
export function validatePassport(value: string): boolean {
  return /^[A-Z0-9]{6,20}$/i.test(value.trim());
}

/** 依 type dispatch 對應驗證 */
export function validateIdentifier(
  type: IdentifierType,
  value: string,
): boolean {
  switch (type) {
    case "national_id":
      return validateNationalId(value);
    case "arc":
      return validateArc(value);
    case "passport":
      return validatePassport(value);
    default:
      return false;
  }
}
