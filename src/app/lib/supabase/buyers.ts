import { supabase } from './supabase';
import type { Buyer } from '../types';

type BuyerImportFields = 'external_id' | 'buyer_category' | 'source' | 'imported_by' |
  'roofing_qualified' | 'engagement_level' | 'buyer_status' | 'investment_thesis' |
  'hq_state' | 'website';

type BuyerInput = Omit<Buyer, 'id' | 'profile_id' | 'created_at' | 'updated_at' | BuyerImportFields>;
type BuyerUpdate = Partial<Omit<Buyer, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>;

export const createBuyer = async (data: BuyerInput): Promise<Buyer> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('No authenticated user');

  const { data: buyer, error } = await supabase
    .from('buyers')
    .insert({ ...data, profile_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return buyer as Buyer;
};

export const getOwnBuyer = async (): Promise<Buyer | null> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data as Buyer;
};

export const getAllBuyers = async (): Promise<Buyer[]> => {
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Buyer[];
};

export const updateBuyer = async (id: string, updates: BuyerUpdate): Promise<Buyer> => {
  const { data, error } = await supabase
    .from('buyers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Buyer;
};
