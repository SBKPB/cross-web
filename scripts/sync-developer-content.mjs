// 只同步明確列出的公開文件與範例，不複製私有設定。
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const source = resolve("../cross-developers");
const docs = [
  ["quickstart", "快速開始", "啟動本機沙盒，完成第一筆事件。"],
  ["api", "API 契約", "登錄、接收、讀回與錯誤處理。"],
  ["ecg", "ECG 波形", "導程、單位、取樣率與校驗規則。"],
  ["app-integration", "App 整合", "保存與補傳流程，以及機型 adapter 邊界。"],
  ["vendor-onboarding", "廠商接入", "準備第一個機型所需的資料。"],
  ["roadmap", "交付路線", "已完成的能力與後續交付順序。"],
];
await mkdir("src/content/developers", { recursive: true });
await mkdir("public/developers", { recursive: true });
const content = await Promise.all(
  docs.map(async ([slug, title, description]) => ({
    slug,
    title,
    description,
    markdown: await readFile(resolve(source, `docs/${slug}.md`), "utf8"),
  })),
);
await writeFile(
  "src/content/developers/docs.json",
  JSON.stringify(content, null, 2) + "\n",
);
for (const [origin, target] of [
  ["openapi/cross-sandbox.openapi.json", "openapi.json"],
  ["fixtures/ecg-waveform.json", "ecg-waveform.json"],
  ["fixtures/ecg.json", "ecg.json"],
  ["fixtures/heart-rate.json", "heart-rate.json"],
  ["fixtures/patient.json", "patient.json"],
  ["fixtures/device.json", "device.json"],
  ["examples/python/upload.py", "upload.py"],
  ["examples/javascript/upload.mjs", "upload.mjs"],
])
  await writeFile(
    resolve("public/developers", target),
    await readFile(resolve(source, origin)),
  );
await writeFile(
  "public/developers/cross-developers-preview.zip",
  await readFile("../docs/artifacts/cross-developers-preview-0.3.1.zip"),
);
console.log("已同步 6 份公開文件與明確列出的開發者資源。");
