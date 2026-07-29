import { subscribeToPush } from '../../utils/pushManage';
import type { Role } from '../types';
import { supabase } from './supabase';

export const signup = async (
  email: string,
  password: string,
  username: string,
  role: Role,
  captchaToken?: string
): Promise<{ success: true; user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']> }> => {
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'https://theroofingbizbroker.com/',
      captchaToken,
      data: { username, role },
    },
  });

  if (authError) throw new Error(authError.message);
  if (!data.user) throw new Error('No se pudo obtener la información del usuario');

  // Profile is created automatically by the on_auth_user_created trigger in Supabase,
  // which reads username and role from raw_user_meta_data.
  return { success: true, user: data.user };
};

export const login = async (
  emailOrUsername: string,
  password: string,
  captchaToken?: string
) => {
  let email = emailOrUsername;

  if (!emailOrUsername.includes('@')) {
    const { data, error } = await supabase.rpc('get_email_by_username', {
      p_username: emailOrUsername,
    });
    if (error || !data) throw new Error('Usuario no encontrado');
    email = data as string;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });

  if (error) throw error;

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await subscribeToPush(registration, data.user.id);
    } catch {
      // push subscription failure must not block login
    }
  }

  return data.user;
};

export const logout = async (): Promise<true> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
};

export const resetPassword = async (email: string): Promise<true> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return true;
};
