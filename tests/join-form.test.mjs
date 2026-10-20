import assert from "node:assert/strict";
import test from "node:test";
import {
  INITIAL_JOIN_FORM,
  JOIN_PENDING_STORAGE_KEY,
  JOIN_STEPS,
  MIN_PASSWORD,
  buildJoinPayload,
  missingInStep1,
  restorePendingJoin,
  selectJoinCategory,
  toggleServiceCategory,
  validateOtpForm,
  validateVerifyPassword,
  verifyCodeErrorMessage,
} from "../src/lib/join/join-form.ts";

// 移植自舊版 components/join/join-form.tsx 與 verify-form.tsx 的純邏輯

const filled = {
  ...INITIAL_JOIN_FORM,
  business_name: "  康博美學診所 ",
  contact_name: " 王小明 ",
  phone: " 0912345678 ",
  email: " owner@example.com ",
  city: "臺北市",
};

test("初始表單、三步驟、sessionStorage 鍵名與舊版相同", () => {
  assert.deepEqual(INITIAL_JOIN_FORM, {
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
  });
  assert.deepEqual(JOIN_STEPS, [
    { title: "商家類型", hint: "你經營的是哪一種？" },
    { title: "基本資料", hint: "怎麼聯絡到你" },
    { title: "服務資訊", hint: "提供哪些服務（可略過）" },
  ]);
  assert.equal(JOIN_PENDING_STORAGE_KEY, "cross_join_pending");
  assert.equal(MIN_PASSWORD, 8);
});

test("第二步缺項：依欄位順序列出（含 Email 格式），欄位 id 供聚焦", () => {
  assert.deepEqual(missingInStep1(INITIAL_JOIN_FORM), [
    { id: "business_name", label: "商家名稱" },
    { id: "contact_name", label: "聯絡人姓名" },
    { id: "phone", label: "聯絡電話" },
    { id: "email", label: "Email" },
    { id: "city", label: "縣市" },
  ]);
  assert.deepEqual(missingInStep1({ ...filled, email: "wang@gmail" }), [{ id: "email", label: "Email 格式" }]);
  assert.deepEqual(missingInStep1({ ...filled, business_name: "   " }), [{ id: "business_name", label: "商家名稱" }]);
  assert.deepEqual(missingInStep1(filled), []);
});

test("送出內容：去頭尾空白、選填空值不送、facility_type 由類型推導、付費類型只有診所送", () => {
  assert.deepEqual(buildJoinPayload(filled), {
    category: "clinic",
    facility_type: "healthcare",
    business_name: "康博美學診所",
    contact_name: "王小明",
    phone: "0912345678",
    email: "owner@example.com",
    city: "臺北市",
    address: undefined,
    team_size: undefined,
    message: undefined,
    hp: undefined,
    service_categories: undefined,
    services: undefined,
    payment_type: "nhi",
  });
  const beauty = {
    ...selectJoinCategory(filled, "beauty"),
    address: " 中正路 1 號 ",
    team_size: "6-15",
    message: " 你好 ",
    hp: "bot",
    service_categories: ["bea_nail"],
    services: " 美睫 ",
  };
  assert.deepEqual(buildJoinPayload(beauty), {
    category: "beauty",
    facility_type: "beauty",
    business_name: "康博美學診所",
    contact_name: "王小明",
    phone: "0912345678",
    email: "owner@example.com",
    city: "臺北市",
    address: "中正路 1 號",
    team_size: "6-15",
    message: "你好",
    hp: "bot",
    service_categories: ["bea_nail"],
    services: "美睫",
  });
});

test("切換商家類型清空已選服務子類別並重設付款方式；子類別可複選切換", () => {
  const withCats = { ...filled, service_categories: ["a", "b"], payment_type: "both" };
  const switched = selectJoinCategory(withCats, "aesthetic");
  assert.equal(switched.category, "aesthetic");
  assert.deepEqual(switched.service_categories, []);
  assert.equal(switched.payment_type, "nhi");
  assert.equal(switched.business_name, filled.business_name);

  const one = toggleServiceCategory(INITIAL_JOIN_FORM, "x");
  assert.deepEqual(one.service_categories, ["x"]);
  const two = toggleServiceCategory(one, "y");
  assert.deepEqual(two.service_categories, ["x", "y"]);
  assert.deepEqual(toggleServiceCategory(two, "x").service_categories, ["y"]);
  assert.deepEqual(INITIAL_JOIN_FORM.service_categories, []);
});

test("驗證碼表單：6 位數字 → 密碼至少 8 碼 → 兩次一致", () => {
  assert.equal(validateOtpForm("12345", "password1", "password1"), "請輸入信中的 6 位數驗證碼");
  assert.equal(validateOtpForm("12345a", "password1", "password1"), "請輸入信中的 6 位數驗證碼");
  assert.equal(validateOtpForm("123456", "short", "short"), "密碼至少 8 碼");
  assert.equal(validateOtpForm("123456", "password1", "password2"), "兩次輸入的密碼不一致");
  assert.equal(validateOtpForm("123456", "password1", "password1"), null);
});

test("驗證碼失敗訊息：只有字串 detail 才顯示（422 的陣列不 render），其餘用預設", () => {
  assert.equal(verifyCodeErrorMessage({ detail: "驗證碼錯誤" }), "驗證碼錯誤");
  assert.equal(verifyCodeErrorMessage({ detail: [{ msg: "x" }] }), "驗證失敗，請稍後再試");
  assert.equal(verifyCodeErrorMessage(null), "驗證失敗，請稍後再試");
});

test("驗證信連結的設定密碼：至少 8 碼、兩次一致", () => {
  assert.equal(validateVerifyPassword("1234567", "1234567"), "密碼至少 8 碼");
  assert.equal(validateVerifyPassword("12345678", "12345679"), "兩次輸入的密碼不一致");
  assert.equal(validateVerifyPassword("12345678", "12345678"), null);
});

test("重整後還原「已送出」狀態：有 email 才還原，壞資料當作全新填寫", () => {
  assert.equal(restorePendingJoin(null), null);
  assert.equal(restorePendingJoin("{"), null);
  assert.equal(restorePendingJoin(JSON.stringify({ form: { ...INITIAL_JOIN_FORM } })), null);
  assert.equal(restorePendingJoin(JSON.stringify({})), null);
  const saved = { ...filled, email: "owner@example.com" };
  assert.deepEqual(restorePendingJoin(JSON.stringify({ form: saved })), saved);
});
