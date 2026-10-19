import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { DeveloperDocument } from "@/components/developers/document";
import { developerDocuments, developerRepository } from "@/lib/developers";

export const dynamicParams = false;
export function generateStaticParams() {
  return developerDocuments.map(({ slug }) => ({ slug }));
}
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const document = developerDocuments.find((item) => item.slug === slug);
  if (!document) return {};
  return {
    title: `${document.title} · 開發者`,
    description: document.description,
    alternates: { canonical: `/developers/docs/${slug}` },
    openGraph: {
      title: `${document.title} · Cross 開發者`,
      url: `/developers/docs/${slug}`,
    },
  };
}

export default async function DeveloperDocPage({ params }: Props) {
  const { slug } = await params;
  const index = developerDocuments.findIndex((item) => item.slug === slug);
  if (index < 0) notFound();
  const document = developerDocuments[index];
  const next = developerDocuments[index + 1];
  const links = developerDocuments.map((item) => (
    <Link
      key={item.slug}
      href={`/developers/docs/${item.slug}`}
      aria-current={item.slug === slug ? "page" : undefined}
      className={`block rounded-xl px-4 py-2.5 text-sm transition ${item.slug === slug ? "bg-accent/60 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
    >
      {item.title}
    </Link>
  ));
  return (
    <div className="home-container py-8 sm:py-12">
      <Link
        href="/developers"
        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        開發者入口
      </Link>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <aside className="min-w-0 lg:sticky lg:top-28">
          <nav aria-label="開發者文件" className="hidden space-y-1 lg:block">
            <p className="mb-4 px-4 font-mono text-xs text-muted-foreground">
              DEVELOPER PREVIEW
            </p>
            {links}
          </nav>
          <details className="rounded-2xl border border-border bg-card p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium">
              文件導覽 · {document.title}
            </summary>
            <nav aria-label="行動版開發者文件" className="mt-3 space-y-1">
              {links}
            </nav>
          </details>
        </aside>
        <article className="min-w-0 max-w-4xl">
          <DeveloperDocument markdown={document.markdown} />
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <a
              href={`${developerRepository}/blob/main/docs/${slug}.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
            >
              在 GitHub 查看來源{" "}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
            {next ? (
              <Link
                href={`/developers/docs/${next.slug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary"
              >
                下一篇：{next.title}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link href="/join" className="text-sm font-medium text-primary">
                了解共同合作
              </Link>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
