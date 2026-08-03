export type Role = 'broker' | 'buyer' | 'seller' | 'pending';

export type BusinessType = 'residential' | 'commercial' | 'both';
export type WorkType = 'retail' | 'insurance' | 'both';
export type ManagementType = 'owner_operated' | 'has_management_team';
export type SellerStatus = 'active' | 'under_nda' | 'sold' | 'inactive';
export type ManagementPreference = 'owner_operated' | 'has_management_team' | 'any';
export type BuyerBusinessType = BusinessType | 'any';
export type BuyerWorkType = WorkType | 'any';
export type EntityType = 'seller' | 'buyer' | 'profile' | 'access_request';

export interface Profile {
  id: string;
  username: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  profile_id: string;
  company_name: string;
  state: string | null;
  annual_revenue: number | null;
  ebitda: number | null;
  ebitda_margin: number | null;
  employee_count: number | null;
  years_in_business: number | null;
  business_type: BusinessType | null;
  work_type: WorkType | null;
  software: string | null;
  management_type: ManagementType | null;
  asking_price: number | null;
  status: SellerStatus;
  phone: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Buyer {
  id: string;
  profile_id: string;
  organization_name: string;
  revenue_min: number | null;
  revenue_max: number | null;
  ebitda_min: number | null;
  ebitda_max: number | null;
  target_states: string[] | null;
  business_type: BuyerBusinessType | null;
  work_type: BuyerWorkType | null;
  employee_min: number | null;
  employee_max: number | null;
  preferred_software: string | null;
  management_preference: ManagementPreference | null;
  created_at: string;
  updated_at: string;
}

export interface BrokerEvent {
  id: string;
  actor_id: string | null;
  entity_type: EntityType | null;
  entity_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
