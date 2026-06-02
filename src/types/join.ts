import type {
  ApiMedicalDepartment,
  FacilityType,
  PaymentType,
} from "@/types/clinic";

// 夥伴類型（民眾端分流的延伸：診所 / 醫美診所 / 美業店家 / 其他）
export type JoinCategory = "clinic" | "aesthetic" | "beauty" | "other";

// 夥伴加入申請表單 payload（前端送出 / 後端 route handler 接收）
export interface JoinApplication {
  category: JoinCategory;
  facility_type: FacilityType; // 由 category 推導，方便日後落地到 MedicalFacility
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  team_size?: string;
  // 診所專屬
  medical_department?: ApiMedicalDepartment;
  payment_type?: PaymentType;
  // 醫美 / 美業專屬
  services?: string;
  message?: string;
  // 反垃圾訊息蜜罐（正常使用者永遠為空）
  hp?: string;
}
