"use client";

import Link from "next/link";
import {
  Building2,
  Settings,
  UserCog,
} from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const adminMenus = [
  {
    title: "院所管理",
    description: "管理院所資料、醫師、職員、服務、預約",
    icon: Building2,
    href: "/admin/clinics",
  },
  {
    title: "使用者管理",
    description: "管理系統使用者與權限設定",
    icon: UserCog,
    href: "/admin/users",
  },
  {
    title: "系統設定",
    description: "調整系統參數與偏好設定",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          Console
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          管理醫療院所、人員、預約及系統設定
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adminMenus.map((menu) => (
          <Link key={menu.title} href={menu.href}>
            <Card className="h-full cursor-pointer transition-all hover:border-blue-200 hover:shadow-lg dark:hover:border-blue-800">
              <CardHeader>
                <div className="mb-2 w-fit rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
                  <menu.icon className="size-5 text-slate-600 dark:text-slate-400" />
                </div>
                <CardTitle className="text-base">{menu.title}</CardTitle>
                <CardDescription className="text-sm">{menu.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
