"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";

interface MemberAppointment {
  id: string;
  facility_name: string;
  staff_name: string | null;
  appointment_date: string;
  appointment_time: string;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  booking_number: string;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "已預約",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到診",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

function formatDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

function formatTime(t: string) {
  return t.substring(0, 5);
}

export default function MemberPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [appointments, setAppointments] = useState<MemberAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth?next=/member");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<MemberAppointment[]>(
        "/api/v1/member/appointments",
      );
      setAppointments(data);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchAppointments();
  }, [authLoading, isAuthenticated, fetchAppointments]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 px-4 py-5 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-bold text-foreground">
            {user?.display_name || user?.email || "我的帳號"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理預約紀錄與看診對象
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
        {/* 快捷列 */}
        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1 gap-2">
            <Link href="/member/patients">
              <Users className="size-4" />
              看診對象管理
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 gap-2">
            <Link href="/">
              <CalendarDays className="size-4" />
              預約看診
            </Link>
          </Button>
        </div>

        {/* 預約列表 */}
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">
            預約紀錄
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          ) : appointments.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-8 text-center">
              <CalendarDays className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                尚無預約紀錄
              </p>
              <Button asChild size="sm">
                <Link href="/">立即預約</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <Card key={appt.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 text-center text-primary">
                      <div className="text-lg font-bold">
                        {formatDate(appt.appointment_date)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(appt.appointment_time)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">
                          {appt.facility_name}
                        </span>
                        <Badge variant={STATUS_VARIANT[appt.status]}>
                          {STATUS_LABEL[appt.status]}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {appt.staff_name && `${appt.staff_name} · `}
                        {appt.booking_number}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
