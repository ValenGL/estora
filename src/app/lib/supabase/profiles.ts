import { supabase } from './supabase';
import type { Profile } from '../types';

export const getProfile = async (): Promise<Profile> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data as Profile;
};

export const updateProfile = async (
  updates: Partial<Pick<Profile, 'username' | 'role'>>
): Promise<Profile> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
};
