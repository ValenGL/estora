import { supabase } from './supabase';
import type { Seller, BusinessType, WorkType, ManagementType, SellerStatus } from '../types';

export interface BrokerSellerInput {
  company_name: string;
  state: string;
  annual_revenue: number;
  ebitda: number;
  employee_count: number;
  years_in_business: number;
  business_type: BusinessType;
  work_type: WorkType;
  software: string;
  management_type: ManagementType;
  asking_price: number | null;
  status: SellerStatus;
  phone: string | null;
  website: string | null;
}

export const createSellerAsBroker = async (data: BrokerSellerInput): Promise<Seller> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('No authenticated user');

  const { data: seller, error } = await supabase
    .from('sellers')
    .insert({ ...data, profile_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return seller as Seller;
};
