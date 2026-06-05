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
  // 主要服務子類別 code（多選，屬於該 facility_type 的 service-categories taxonomy）
  // 取代原本診所單值 medical_department 的角色，四大類皆適用。
  service_categories?: string[];
  // 付費類型（診所專屬：健保 / 自費 / 兩者）
  payment_type?: PaymentType;
  /** @deprecated 改用 service_categories 多選；保留僅為相容尚未更新的呼叫端。 */
  medical_department?: ApiMedicalDepartment;
  // 補充說明用自由文字（選填，與 service_categories 並存）
  services?: string;
  message?: string;
  // 反垃圾訊息蜜罐（正常使用者永遠為空）
  hp?: string;
}
