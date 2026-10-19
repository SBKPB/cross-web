import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  FileJson,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CodeBlock } from "@/components/developers/code-block";
import {
  developerDocuments,
  developerPreviewVersion,
  developerRepository,
} from "@/lib/developers";

export const metadata: Metadata = {
  title: "開發者入口",
  description:
    "用 Cross 的本機沙盒、OpenAPI 與 Python／JavaScript 範例，完成心率與合成 ECG 的第一條資料流程。",
  alternates: { canonical: "/developers" },
  openGraph: { title: "Cross 開發者入口", url: "/developers" },
};

export default function DevelopersPage() {
  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="home-container grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
          <div>
            <p className="home-eyebrow">
              CROSS DEVELOPERS / PREVIEW {developerPreviewVersion}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.3] tracking-tight sm:text-5xl">
              從第一筆事件，
              <br />
              開始串接。
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
              不需要設備或預約帳號，先用合成資料驗證登錄、接收、重送與原生讀回。每份文件都對應目前可執行的沙盒。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/developers/docs/quickstart">
                  快速開始 <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href={developerRepository}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub 文件庫 <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            </div>
            <p className="mt-5 text-xs leading-6 text-muted-foreground">
              本機 Developer Preview · Python 3.14 · Node.js 22
            </p>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Terminal className="size-4 text-primary" aria-hidden="true" />
              啟動服務後，執行你的第一筆 ECG
            </div>
            <CodeBlock
              label="Python 客戶端"
              code={"python examples/python/upload.py --kind ecg"}
            />
            <div className="mt-4 rounded-2xl border border-border bg-muted/30 px-5 py-4 font-mono text-xs leading-7">
              <p className="text-primary">登錄 → 上傳 → 原樣重送 → 原生讀回</p>
              <p className="mt-1 text-muted-foreground">
                同一 event_id，保留同一筆紀錄。
              </p>
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              請先依快速開始啟動本機服務並設定授權碼。這是範例客戶端，不是正式
              SDK。
            </p>
          </div>
        </div>
      </section>
      <section className="home-container py-14 sm:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="home-eyebrow">DOCUMENTATION</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              從流程到資料細節。
            </h2>
          </div>
          <a
            href="/developers/openapi.json"
            download
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
          >
            <FileJson className="size-4" aria-hidden="true" />
            下載 OpenAPI 3.1
          </a>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {developerDocuments.map((document, index) => (
            <Card
              key={document.slug}
              className="gap-0 py-0 shadow-sm transition hover:shadow-md"
            >
              <CardContent className="p-6">
                <span className="font-mono text-xs text-primary">
                  0{index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">
                  <Link
                    href={`/developers/docs/${document.slug}`}
                    className="inline-flex items-center gap-2 hover:text-primary"
                  >
                    {document.title}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {document.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="home-container pb-16">
        <div className="grid gap-6 rounded-4xl border border-border bg-card p-7 sm:p-10 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-xl font-semibold">一次取得完整範例。</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              文件、合成資料、OpenAPI、獨立參考服務與兩種語言客戶端都在同一包。下載後可在本機執行完整驗證。
            </p>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              目前沒有公開託管量測 API；真實設備、正式身份、多租戶與 FHIR
              交換仍依後續合作交付。
            </p>
          </div>
          <Button asChild variant="outline" className="self-start">
            <a href="/developers/cross-developers-preview.zip" download>
              <Download aria-hidden="true" />
              下載 Preview {developerPreviewVersion}
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
