export type IdentifierType = "national_id" | "arc" | "passport";

export interface MemberPatientRead {
  id: string;
  user_id: string;
  name: string;
  identifier_type: IdentifierType;
  identifier_last4: string;
  birth_date: string;
  gender: string;
  phone: string | null;
  relation: string;
  is_active: boolean;
}

export interface MemberPatientCreate {
  name: string;
  identifier_type: IdentifierType;
  identifier_value: string;
  birth_date: string;
  gender: string;
  phone?: string;
  relation?: string;
}

export interface MemberPatientUpdate {
  name?: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  relation?: string;
}
