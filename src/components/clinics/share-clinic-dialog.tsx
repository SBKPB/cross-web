"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, ExternalLink, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// 民眾端正式網域（與 layout metadataBase 一致）
const SITE_URL = "https://cross.twinhao.com";

interface ShareClinicDialogProps {
  clinicId: string;
  clinicName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareClinicDialog({
  clinicId,
  clinicName,
  open,
  onOpenChange,
}: ShareClinicDialogProps) {
  // 短網址：/c/{UUID 前 8 碼} → 自動轉到完整診所頁（見 app/c/[code]）
  const url = `${SITE_URL}/c/${clinicId.slice(0, 8)}`;
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  // 開啟時產生 QR Code（512px PNG data URL，供預覽與下載）
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪貼簿不可用時使用者仍可手動選取複製
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: clinicName, text: `${clinicName}｜Cross`, url });
    } catch {
      // 使用者取消或裝置不支援 → 忽略
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${clinicName}-QRcode.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>分享診所頁面</DialogTitle>
          <DialogDescription>
            掃描 QR Code 或複製連結，把這個診所頁面分享出去；對方可直接查看並線上預約。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* QR Code 預覽 */}
          <div className="flex flex-col items-center gap-3">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL QR，不適用 next/image
              <img
                src={qrDataUrl}
                alt={`${clinicName} QR Code`}
                className="size-52 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-border"
              />
            ) : (
              <div className="size-52 animate-pulse rounded-3xl bg-muted" />
            )}
            <p className="text-center text-sm font-medium text-foreground">
              {clinicName}
            </p>
          </div>

          {/* 連結 + 複製 */}
          <div className="flex gap-2">
            <Input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="h-11 flex-1 bg-secondary/70 text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={handleCopy}
              aria-label="複製連結"
            >
              {copied ? (
                <Check className="size-4 text-primary" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

          {/* 動作 */}
          {canNativeShare && (
            <Button className="w-full gap-2" onClick={handleNativeShare}>
              <Share2 className="size-4" />
              分享給朋友
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant={canNativeShare ? "outline" : "default"}
              className="flex-1 gap-2"
              onClick={handleDownload}
              disabled={!qrDataUrl}
            >
              <Download className="size-4" />
              下載 QR Code
            </Button>
            <Button variant="outline" className="flex-1 gap-2" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                開啟頁面
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
