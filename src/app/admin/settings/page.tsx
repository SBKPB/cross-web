"use client";

import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">系統設定</h1>
        <p className="text-muted-foreground text-sm">
          調整系統參數與偏好設定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            系統設定
          </CardTitle>
          <CardDescription>
            此功能正在開發中，敬請期待。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            未來將提供系統參數調整、通知設定、資料備份等功能。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
