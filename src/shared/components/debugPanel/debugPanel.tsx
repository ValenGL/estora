"use client";

import { useAuth } from "../../../app/utils/isAuth";
import type { Role } from "../../../app/lib/types";

const ROLES: Role[] = ['broker', 'buyer', 'seller'];

const ROLE_COLORS: Record<Role, string> = {
  broker: '#16a34a',
  buyer: '#2563eb',
  seller: '#d97706',
  pending: '#6b7280',
};

export default function DebugPanel() {
  if (process.env.NODE_ENV === 'production') return null;

  const { role, effectiveRole, setDebugRole } = useAuth();
  const isOverriding = effectiveRole !== role;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9999,
        background: '#0a1310ee',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '12px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: '160px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#fafafa',
      }}
    >
      <div style={{ opacity: 0.5, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Debug Panel
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ opacity: 0.6 }}>role:</span>
        <span
          style={{
            background: effectiveRole ? ROLE_COLORS[effectiveRole] : '#6b7280',
            color: '#fff',
            borderRadius: '999px',
            padding: '1px 8px',
            fontSize: '10px',
            fontWeight: 700,
          }}
        >
          {effectiveRole ?? 'none'}
        </span>
        {isOverriding && (
          <span style={{ opacity: 0.4, fontSize: '9px' }}>(override)</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setDebugRole(r)}
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              border: effectiveRole === r ? `1.5px solid ${ROLE_COLORS[r]}` : '1px solid rgba(255,255,255,0.2)',
              background: effectiveRole === r ? `${ROLE_COLORS[r]}33` : 'transparent',
              color: '#fafafa',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: effectiveRole === r ? 700 : 400,
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {isOverriding && (
        <button
          onClick={() => setDebugRole(null)}
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: '#fca5a5',
            cursor: 'pointer',
            fontSize: '10px',
          }}
        >
          reset
        </button>
      )}
    </div>
  );
}
