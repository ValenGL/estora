# Account Page — Change History Log

**Date:** 2026-08-04
**Status:** Approved
**Sprint:** 3 — Account Edit (addendum)

---

## Goal

After a seller or buyer saves changes to their profile on `/account`, a log entry is written to the `events` table recording which fields changed and their old vs new values. The last 10 entries are displayed below the edit section as a grouped change history.

---

## 1. Data Layer

**New file:** `src/app/lib/supabase/events.ts`

### `logProfileUpdate`

```ts
logProfileUpdate(
  entityType: 'seller' | 'buyer',
  entityId: string,
  changes: { field: string; old: unknown; new: unknown }[]
): Promise<void>
```

Inserts one row into the `events` table:
- `actor_id` — authenticated user id from `supabase.auth.getUser()`
- `entity_type` — `'seller'` or `'buyer'`
- `entity_id` — the record's `id`
- `action` — `'updated'`
- `metadata` — `{ changes: [{ field, old, new }, ...] }` — only fields where `old !== new`

If `changes` is empty (nothing actually changed), do not insert — return early.

### `getProfileHistory`

```ts
getProfileHistory(
  entityType: 'seller' | 'buyer',
  entityId: string
): Promise<BrokerEvent[]>
```

Queries `events` filtered by `entity_type` and `entity_id`, ordered by `created_at` descending, limit 10. Returns typed `BrokerEvent[]` (type already defined in `src/app/lib/types.ts`).

---

## 2. Change Detection

Change detection runs in `SellerSection.handleSave` and `BuyerSection.handleSave`, **before** calling `updateSeller`/`updateBuyer`.

For seller, compare each editable field between the current `seller` prop and the parsed form values:

```ts
const changes = [];
if (seller.company_name !== form.company_name.trim())
  changes.push({ field: 'company_name', old: seller.company_name, new: form.company_name.trim() });
if (seller.annual_revenue !== parseFloat(form.annual_revenue) * 1_000_000)
  changes.push({ field: 'annual_revenue', old: seller.annual_revenue, new: parseFloat(form.annual_revenue) * 1_000_000 });
// ... same pattern for all editable fields
```

For buyer, same pattern for all `BuyerForm` fields. `target_states` comparison uses `JSON.stringify` on both arrays sorted alphabetically.

---

## 3. Save Flow (modified)

After `updateSeller`/`updateBuyer` resolves successfully:

1. Call `logProfileUpdate(entityType, entityId, changes)` — no `await`, fire and forget
2. If `changes.length > 0`, prepend a synthetic `BrokerEvent` to local `history` state using the current timestamp (optimistic update — no refetch)
3. Call `onUpdate(updated)` and `setEditing(false)` as before

The optimistic event shape:
```ts
{
  id: crypto.randomUUID(),
  actor_id: null,
  entity_type: entityType,
  entity_id: entityId,
  action: 'updated',
  metadata: { changes },
  created_at: new Date().toISOString(),
}
```

---

## 4. History Fetch on Mount

Both `SellerSection` and `BuyerSection` gain a `useEffect` on mount that calls `getProfileHistory` and sets a `history` state. Errors are silently ignored (history is a non-critical UI element).

```ts
const [history, setHistory] = useState<BrokerEvent[]>([]);

useEffect(() => {
  getProfileHistory('seller', seller.id)
    .then(setHistory)
    .catch(() => {});
}, [seller.id]);
```

---

## 5. ChangeHistory Component (local to page.tsx)

Rendered below the edit section in both `SellerSection` and `BuyerSection`. Hidden when `history.length === 0`.

**Field name map** — converts DB field names to human-readable labels:
```ts
const FIELD_LABELS: Record<string, string> = {
  company_name: 'Business name',
  annual_revenue: 'Annual revenue',
  ebitda: 'EBITDA',
  state: 'State',
  employee_count: 'Employees',
  years_in_business: 'Years in business',
  business_type: 'Business type',
  work_type: 'Work type',
  software: 'Software',
  management_type: 'Management',
  phone: 'Phone',
  website: 'Website',
  organization_name: 'Organization',
  revenue_min: 'Min revenue',
  revenue_max: 'Max revenue',
  ebitda_min: 'Min EBITDA',
  ebitda_max: 'Max EBITDA',
  target_states: 'Target states',
  employee_min: 'Min employees',
  employee_max: 'Max employees',
  preferred_software: 'Preferred software',
  management_preference: 'Management preference',
};
```

**Value formatting:**
- `annual_revenue`, `ebitda`, `revenue_min`, `revenue_max`, `ebitda_min`, `ebitda_max` → `formatMoney()`
- `state` → `stateLabel()`
- `target_states` (array) → sorted and joined with `, `
- All other strings → replace `_` with space, capitalize first letter
- Numbers → `String(v)`
- `null` → `—`

**Timestamp formatting:**
```ts
new Date(event.created_at).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
  hour: 'numeric', minute: '2-digit',
})
// → "Aug 4, 2026, 3:42 PM"
```

**Rendering:** entries with no valid `changes` in metadata are skipped. Each entry shows the timestamp header followed by a row per changed field.

---

## 6. Files Changed / Created

**New:**
- `src/app/lib/supabase/events.ts` — `logProfileUpdate`, `getProfileHistory`

**Modified:**
- `src/app/account/page.tsx` — add history state + fetch to `SellerSection` and `BuyerSection`; add `ChangeHistory` local component; wire change detection and log call into `handleSave`

**Unchanged:**
- `src/app/lib/types.ts` — `BrokerEvent` type already covers `events` rows
- `src/app/account/account.scss` — history styles added inline (minimal: a section divider, timestamp header, field row)

---

## 7. Out of Scope

- Broker viewing another user's history
- Pagination beyond 10 entries
- Undo/revert from history
- Filtering history by field
