import assert from "node:assert/strict";
import test from "node:test";
import { filterAndSortClinics } from "../src/lib/clinic-search.ts";

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
