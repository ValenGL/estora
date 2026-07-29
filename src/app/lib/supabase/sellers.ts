import { supabase } from './supabase';
import type { Seller } from '../types';

type SellerInput = Omit<Seller, 'id' | 'profile_id' | 'created_at' | 'updated_at' | 'status'>;
type SellerUpdate = Partial<Omit<Seller, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>;

export const createSeller = async (data: SellerInput): Promise<Seller> => {
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

export const getOwnSeller = async (): Promise<Seller | null> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data as Seller;
};

export const getAllSellers = async (): Promise<Seller[]> => {
  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Seller[];
};

export const getSellerById = async (id: string): Promise<Seller> => {
  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Seller;
};

export const updateSeller = async (id: string, updates: SellerUpdate): Promise<Seller> => {
  const { data, error } = await supabase
    .from('sellers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Seller;
};

export const deleteSeller = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('sellers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
