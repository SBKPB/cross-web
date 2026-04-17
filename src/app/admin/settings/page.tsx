"use client";

import { Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  lumaIconBadge,
  lumaPageContainer,
  lumaSectionDesc,
  lumaSectionTitle,
} from "@/lib/styles/luma";
import { useRequireSystemAdmin } from "@/lib/auth/use-require-system-admin";

export default function AdminSettingsPage() {
  useRequireSystemAdmin();
  return (
    <div className={lumaPageContainer}>
      <div className="space-y-1">
        <h1 className={lumaSectionTitle}>系統設定</h1>
        <p className={lumaSectionDesc}>調整系統參數與偏好設定</p>
      </div>

      <Card>
        <CardHeader>
          <div className={lumaIconBadge}>
            <Settings className="size-5" />
          </div>
          <CardTitle>開發中</CardTitle>
          <CardDescription>
            未來將提供系統參數調整、通知設定、資料備份等功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            此功能正在開發中，敬請期待。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
