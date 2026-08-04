import { supabase } from './supabase';
import type { EntityType, BrokerEvent } from '../types';

export const logEvent = async (
  entityType: EntityType,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('events').insert({
    actor_id: user?.id ?? null,
    entity_type: entityType,
    entity_id: entityId,
    action,
    metadata: metadata ?? null,
  });

  if (error) throw error;
};

export const logProfileUpdate = async (
  entityType: 'seller' | 'buyer',
  entityId: string,
  changes: { field: string; old: unknown; new: unknown }[]
): Promise<void> => {
  if (changes.length === 0) return;
  await logEvent(entityType, entityId, 'updated', { changes });
};

export const getProfileHistory = async (
  entityType: 'seller' | 'buyer',
  entityId: string
): Promise<BrokerEvent[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data as BrokerEvent[];
};
