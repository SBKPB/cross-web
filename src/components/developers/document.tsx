import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { developerDocLink } from "@/lib/developers";
import { CodeBlock } from "./code-block";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}

export function DeveloperDocument({ markdown }: { markdown: string }) {
  return (
    <div className="developer-document space-y-6 text-sm leading-8 text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="scroll-mt-28 pt-7 text-xl font-semibold tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="pt-3 text-lg font-semibold">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-muted-foreground">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-3 pl-6 text-muted-foreground">
              {children}
            </ol>
          ),
          a: ({ href, children }) => {
            const target = href ? developerDocLink(href) : undefined;
            if (!target) return <span>{children}</span>;
            return target.startsWith("/") ? (
              <Link
                href={target}
                className="font-medium text-primary underline underline-offset-4"
              >
                {children}
              </Link>
            ) : (
              <a
                href={target}
                className="font-medium text-primary underline underline-offset-4"
              >
                {children}
              </a>
            );
          },
          code: ({ className, children }) =>
            className?.startsWith("language-") ? (
              <CodeBlock
                code={textOf(children).replace(/\n$/, "")}
                label={className.replace("language-", "")}
              />
            ) : (
              <code className="break-words rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                {children}
              </code>
            ),
          pre: ({ children }) => <div>{children}</div>,
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-100 text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-4 py-3 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-4 py-3 align-top text-muted-foreground">
              {children}
            </td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
