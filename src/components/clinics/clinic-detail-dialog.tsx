"use client";

import Link from "next/link";
import { Calendar, Clock, Info, MapPin, Navigation, Phone, Star, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HOSPITAL_LEVELS,
  MEDICAL_DEPARTMENTS,
  API_MEDICAL_DEPARTMENTS,
} from "@/lib/constants/clinic-constants";
import type { Clinic } from "@/types/clinic";

interface ClinicDetailDialogProps {
  clinic: Clinic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClinicDetailDialog({
  clinic,
  open,
  onOpenChange,
}: ClinicDetailDialogProps) {
  if (!clinic) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-popover border-border">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold text-foreground">
                {clinic.clinic_name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {clinic.clinic_name}的詳細資訊、科別、聯絡方式與營業時間
              </DialogDescription>
              <div className="flex items-center gap-2">
                <Badge className="text-xs font-medium bg-accent text-primary">
                  {HOSPITAL_LEVELS[clinic.hospital_level]}
                </Badge>
                {clinic.rating && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium text-foreground">{clinic.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* 科別 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">診療科別</h4>
            <div className="flex flex-wrap gap-1.5">
              {clinic.departments.map((dept) => (
                <Badge
                  key={dept}
                  variant="outline"
                  className="text-xs px-2 py-1 border-0 bg-accent text-primary"
                >
                  {MEDICAL_DEPARTMENTS[dept as keyof typeof MEDICAL_DEPARTMENTS] ??
                    API_MEDICAL_DEPARTMENTS[dept as keyof typeof API_MEDICAL_DEPARTMENTS] ??
                    dept}
                </Badge>
              ))}
            </div>
          </div>

          {/* 聯絡資訊 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">聯絡資訊</h4>
            <div className="space-y-2.5 text-sm">
              {clinic.address && (
                <div className="flex items-start gap-3 text-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>{clinic.address}</span>
                </div>
              )}
              {clinic.phone && (
                <div className="flex items-center gap-3 text-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <span>{clinic.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* 門診時間 */}
          {clinic.business_hours && clinic.business_hours.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">門診時間</h4>
              <div className="grid grid-cols-2 gap-1.5 text-sm">
                {clinic.business_hours.map((hours) => (
                  <div key={hours.day} className="contents">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span>{hours.day}</span>
                    </div>
                    <span className={hours.is_closed ? "text-muted-foreground" : "text-foreground"}>
                      {hours.is_closed ? "休診" : `${hours.open} - ${hours.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 專業人員 */}
          {clinic.members && clinic.members.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">專業人員</h4>
              <div className="space-y-2">
                {clinic.members.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <span className="text-foreground font-medium">{member.name}</span>
                      {member.title && (
                        <span className="text-muted-foreground ml-2">{member.title}</span>
                      )}
                      {member.specialties && member.specialties.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          專長: {member.specialties.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {clinic.members.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-7">
                    還有 {clinic.members.length - 3} 位人員...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 服務項目 */}
          {clinic.services && clinic.services.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">服務項目</h4>
              <div className="space-y-1.5">
                {clinic.services.slice(0, 4).map((service) => (
                  <div key={service.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{service.name}</span>
                    <span className="font-medium text-primary">
                      NT$ {service.price.toLocaleString()}
                    </span>
                  </div>
                ))}
                {clinic.services.length > 4 && (
                  <p className="text-xs text-muted-foreground">
                    還有 {clinic.services.length - 4} 項服務...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-primary text-white hover:bg-primary/90"
              asChild
            >
              <Link href={`/booking/${clinic.id}`}>
                <Calendar className="h-4 w-4 mr-2" />
                立即預約
              </Link>
            </Button>
            <Button
              className="flex-1 bg-white text-primary border border-primary/40 hover:bg-accent/50"
              asChild
            >
              <Link href={`/clinic/${clinic.id}`}>
                <Info className="h-4 w-4 mr-2" />
                詳細介紹
              </Link>
            </Button>
            {clinic.address && (
              <Button
                className="bg-white text-primary border border-border hover:bg-accent/50 px-3"
                asChild
                title="導航前往"
              >
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
