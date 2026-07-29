import { supabase } from './supabase';
import type { EntityType } from '../types';

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
