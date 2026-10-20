import assert from "node:assert/strict";
import test from "node:test";
import { filterAndSortClinics, parseSearchFilters } from "../src/lib/clinic-search.ts";

// 搜尋頁的篩選與排序（移植自舊版 clinic-search-view.tsx 的 filteredClinics useMemo，邏輯逐行相同）。

const ALL = {
  search: "",
  hospitalLevel: "all",
  serviceCategories: [],
  city: "all",
  facilityType: "all",
  paymentType: "all",
};

let seq = 0;
function clinic(overrides = {}) {
  seq += 1;
  return {
    id: `c${seq}`,
    clinic_name: `診所${seq}`,
    hospital_level: "clinic",
    departments: [],
    phone: null,
    address: null,
    city: undefined,
    facility_type: "healthcare",
    payment_type: undefined,
    is_featured: false,
    ...overrides,
  };
}

const ids = (list) => list.map((c) => c.id);

test("關鍵字以 categoryLabels 對照子類別中文、比對名稱／地址／人員", () => {
  const a = clinic({ clinic_name: "仁愛診所", departments: ["pediatrics"] });
  const b = clinic({ address: "台北市信義區" });
  const c = clinic({ members: [{ id: "m", name: "王醫師", role: "doctor", specialties: ["過敏"] }] });
  const list = [a, b, c];
  const labels = { pediatrics: "兒科" };
  assert.deepEqual(ids(filterAndSortClinics(list, { ...ALL, search: "兒科" }, "default", labels)), [a.id]);
  assert.deepEqual(ids(filterAndSortClinics(list, { ...ALL, search: "臺北" }, "default", labels)), [b.id]);
  assert.deepEqual(ids(filterAndSortClinics(list, { ...ALL, search: "過敏" }, "default", labels)), [c.id]);
});

test("醫療分級只在「全部／看診」大類生效（避免隱形篩選）", () => {
  const center = clinic({ hospital_level: "medical_center" });
  const small = clinic({ hospital_level: "clinic" });
  const aes = clinic({ hospital_level: "clinic", facility_type: "aesthetic" });
  const list = [center, small, aes];
  assert.deepEqual(ids(filterAndSortClinics(list, { ...ALL, hospitalLevel: "medical_center" }, "default", {})), [center.id]);
  assert.deepEqual(
    ids(filterAndSortClinics(list, { ...ALL, facilityType: "healthcare", hospitalLevel: "medical_center" }, "default", {})),
    [center.id],
  );
  assert.deepEqual(
    ids(filterAndSortClinics(list, { ...ALL, facilityType: "aesthetic", hospitalLevel: "medical_center" }, "default", {})),
    [aes.id],
  );
});

test("子類別多選 OR 命中；縣市；大類", () => {
  const a = clinic({ departments: ["pediatrics"], city: "臺北市" });
  const b = clinic({ departments: ["ent"], city: "高雄市" });
  const c = clinic({ departments: ["dermatology"], city: "臺北市", facility_type: "beauty" });
  const list = [a, b, c];
  assert.deepEqual(ids(filterAndSortClinics(list, { ...ALL, serviceCategories: ["ent", "pediatrics"] }, "default", {})), [a.id, b.id]);
  assert.deepEqual(ids(filterAndSortClinics(list, { ...ALL, city: "臺北市" }, "default", {})), [a.id, c.id]);
  assert.deepEqual(ids(filterAndSortClinics(list, { ...ALL, facilityType: "beauty" }, "default", {})), [c.id]);
});

test("付款方式只在看診大類生效：健保命中 nhi+both、自費命中 self_pay+both、缺值視為 nhi", () => {
  const nhi = clinic({ payment_type: "nhi" });
  const self = clinic({ payment_type: "self_pay" });
  const both = clinic({ payment_type: "both" });
  const none = clinic({});
  const list = [nhi, self, both, none];
  const hc = { ...ALL, facilityType: "healthcare" };
  assert.deepEqual(ids(filterAndSortClinics(list, { ...hc, paymentType: "nhi" }, "default", {})), [nhi.id, both.id, none.id]);
  assert.deepEqual(ids(filterAndSortClinics(list, { ...hc, paymentType: "self_pay" }, "default", {})), [self.id, both.id]);
  assert.deepEqual(ids(filterAndSortClinics(list, { ...ALL, paymentType: "self_pay" }, "default", {})), ids(list));
});

test("排序：精選一律置頂；default 其餘維持後端順序；rating 由高到低（無評分最後）；name 依 zh-Hant", () => {
  const a = clinic({ clinic_name: "乙", rating: 4.1 });
  const b = clinic({ clinic_name: "甲", rating: undefined });
  const f = clinic({ clinic_name: "丙", rating: 3, is_featured: true });
  const c = clinic({ clinic_name: "丁", rating: 4.9 });
  const list = [a, b, f, c];
  assert.deepEqual(ids(filterAndSortClinics(list, ALL, "default", {})), [f.id, a.id, b.id, c.id]);
  assert.deepEqual(ids(filterAndSortClinics(list, ALL, "rating", {})), [f.id, c.id, a.id, b.id]);
  const byName = [a, b, c].map((x) => x.clinic_name).sort((x, y) => x.localeCompare(y, "zh-Hant"));
  assert.deepEqual(
    filterAndSortClinics(list, ALL, "name", {}).map((x) => x.clinic_name),
    ["丙", ...byName],
  );
  assert.deepEqual(ids(list), [a.id, b.id, f.id, c.id], "不改動輸入陣列");
});

// ---- 網址參數 → 初始篩選（移植自舊版 app/search/page.tsx，逐行相同；預期值對照 3100 基準實際的 initialFilters） ----

const params = (qs) => new URLSearchParams(qs);
const DEFAULTS = {
  search: "",
  city: "all",
  serviceCategories: [],
  hospitalLevel: "all",
  facilityType: "all",
  paymentType: "all",
};

test("parseSearchFilters：沒有參數時全部為預設值；不認得的參數（page、大寫 Q）忽略", () => {
  assert.deepEqual(parseSearchFilters(params("")), DEFAULTS);
  assert.deepEqual(parseSearchFilters(params("page=2&Q=abc&sort=rating")), DEFAULTS);
});

test("parseSearchFilters：q 原樣成為關鍵字（+ 為空白、無效的 % 跳脫保留原字串、; 不是分隔符）", () => {
  assert.deepEqual(parseSearchFilters(params("q=a+b")), { ...DEFAULTS, search: "a b" });
  assert.deepEqual(parseSearchFilters(params("q=%ZZ")), { ...DEFAULTS, search: "%ZZ" });
  assert.deepEqual(parseSearchFilters(params("q=%E5%85%92%E7%A7%91;city=x")), { ...DEFAULTS, search: "兒科;city=x" });
  assert.deepEqual(parseSearchFilters(params("q=")), DEFAULTS);
});

test("parseSearchFilters：type=self_pay 向後相容 → 看診 + 自費；明確的 payment 優先", () => {
  assert.deepEqual(parseSearchFilters(params("type=self_pay")), {
    ...DEFAULTS,
    facilityType: "healthcare",
    paymentType: "self_pay",
  });
  assert.deepEqual(parseSearchFilters(params("type=self_pay&payment=nhi")), {
    ...DEFAULTS,
    facilityType: "healthcare",
    paymentType: "nhi",
  });
  assert.deepEqual(parseSearchFilters(params("type=healthcare&payment=self_pay")), {
    ...DEFAULTS,
    facilityType: "healthcare",
    paymentType: "self_pay",
  });
});

test("parseSearchFilters：付款方式只在看診大類保留，醫療分級只在看診／全部保留", () => {
  assert.deepEqual(parseSearchFilters(params("payment=nhi")), DEFAULTS);
  assert.deepEqual(parseSearchFilters(params("type=aesthetic&payment=nhi&level=clinic")), {
    ...DEFAULTS,
    facilityType: "aesthetic",
  });
  assert.deepEqual(parseSearchFilters(params("level=medical_center")), { ...DEFAULTS, hospitalLevel: "medical_center" });
  assert.deepEqual(parseSearchFilters(params("type=healthcare&level=clinic")), {
    ...DEFAULTS,
    facilityType: "healthcare",
    hospitalLevel: "clinic",
  });
  assert.deepEqual(parseSearchFilters(params("type=beauty&level=clinic")), { ...DEFAULTS, facilityType: "beauty" });
});

test("parseSearchFilters：cat 逗號分隔（去空白、去空項）優先，否則退回舊 dept 單值", () => {
  assert.deepEqual(parseSearchFilters(params("cat=a,%20b,,c%20")), { ...DEFAULTS, serviceCategories: ["a", "b", "c"] });
  assert.deepEqual(parseSearchFilters(params("cat=a&dept=z")), { ...DEFAULTS, serviceCategories: ["a"] });
  assert.deepEqual(parseSearchFilters(params("dept=pediatrics")), { ...DEFAULTS, serviceCategories: ["pediatrics"] });
  // 空字串的 cat 視為沒給 → 退回 dept；只有逗號 → 空陣列（不退回 dept）
  assert.deepEqual(parseSearchFilters(params("cat=&dept=z")), { ...DEFAULTS, serviceCategories: ["z"] });
  assert.deepEqual(parseSearchFilters(params("cat=,&dept=z")), DEFAULTS);
  assert.deepEqual(parseSearchFilters(params("dept=")), DEFAULTS);
});

test("parseSearchFilters：無效值照舊原樣帶入（空字串只有 type 退回全部；city／level／payment 的空字串保留）", () => {
  assert.deepEqual(parseSearchFilters(params("type=")), DEFAULTS);
  assert.deepEqual(parseSearchFilters(params("type=foo&level=clinic&payment=nhi")), { ...DEFAULTS, facilityType: "foo" });
  assert.deepEqual(parseSearchFilters(params("city=")), { ...DEFAULTS, city: "" });
  assert.deepEqual(parseSearchFilters(params("city=&type=self_pay")), {
    ...DEFAULTS,
    city: "",
    facilityType: "healthcare",
    paymentType: "self_pay",
  });
  assert.deepEqual(parseSearchFilters(params("city=不存在市")), { ...DEFAULTS, city: "不存在市" });
  assert.deepEqual(parseSearchFilters(params("level=")), { ...DEFAULTS, hospitalLevel: "" });
  assert.deepEqual(parseSearchFilters(params("level=bogus")), { ...DEFAULTS, hospitalLevel: "bogus" });
  assert.deepEqual(parseSearchFilters(params("type=healthcare&payment=")), {
    ...DEFAULTS,
    facilityType: "healthcare",
    paymentType: "",
  });
  assert.deepEqual(parseSearchFilters(params("type=healthcare&payment=xyz")), {
    ...DEFAULTS,
    facilityType: "healthcare",
    paymentType: "xyz",
  });
});

test("parseSearchFilters：重複的參數取第一個值（舊版 Next 會變成陣列而讓頁面出錯，屬已知且刻意的差異）", () => {
  assert.deepEqual(parseSearchFilters(params("q=a&q=b")), { ...DEFAULTS, search: "a" });
  assert.deepEqual(parseSearchFilters(params("cat=a&cat=b")), { ...DEFAULTS, serviceCategories: ["a"] });
});
