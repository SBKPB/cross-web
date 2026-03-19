"use client";

import { MessageCircle } from "lucide-react";
import { LINE_BRAND_COLOR, LINE_FRIEND_URL, LINE_OA_ID } from "@/lib/constants/line-constants";

interface LineFriendButtonProps {
  className?: string;
}

export function LineFriendButton({ className }: LineFriendButtonProps) {
  if (!LINE_FRIEND_URL && !LINE_OA_ID) return null;

  const isMobile =
    typeof window !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // 行動裝置用 LINE 深度連結，桌面用網頁連結
  const href = isMobile && LINE_OA_ID
    ? `line://ti/p/${LINE_OA_ID}`
    : LINE_FRIEND_URL;

  if (!href) return null;

  return (
    <a
      href={href}
      target={isMobile ? "_self" : "_blank"}
      rel="noopener noreferrer"
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-base font-medium text-white transition-opacity hover:opacity-90 ${className ?? ""}`}
      style={{ backgroundColor: LINE_BRAND_COLOR }}
    >
      <MessageCircle className="size-5" />
      <span>加入 LINE 好友</span>
    </a>
  );
}
