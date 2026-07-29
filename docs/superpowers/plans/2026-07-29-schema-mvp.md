# Schema MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy `posts` schema with the correct domain entities (profiles, sellers, buyers, events) in both Supabase and the Next.js codebase.

**Architecture:** Four Supabase tables replace the `posts` table. The data layer is split into focused TypeScript modules, one per entity. Legacy components that reference posts are removed and stubbed for Sprint 2.

**Tech Stack:** Next.js 15, TypeScript 5, Supabase (PostgreSQL + Supabase Auth), React 18

## Global Constraints

- All new files must be TypeScript (`.ts` / `.tsx`) — no new `.js` files
- Financial values in USD (numeric, no currency formatting in DB)
- Geography uses US state codes: `'TX'`, `'FL'`, `'GA'`, etc.
- No JSONB on entity fields — only `events.metadata` uses JSONB
- Never reference `posts`, `addPost`, `getPosts`, `getOwnPosts`, `getPostById`, or `deletePost` in new code
- SQL scripts are executed in Supabase Studio → SQL Editor → New Query

---

### Task 1: Create Supabase tables and RLS

**Files:** No code files — SQL executed directly in Supabase Studio.

**Interfaces:**
- Produces: `profiles`, `sellers`, `buyers`, `events` tables with RLS enabled and a `get_email_by_username` RPC function

- [ ] **Step 1: Open Supabase Studio → SQL Editor → New Query**

- [ ] **Step 2: Run — create `profiles` table**

```sql
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  role        text not null check (role in ('broker', 'buyer', 'seller')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();
```

Expected: "Success. No rows returned."

- [ ] **Step 3: Run — create `sellers` table**

```sql
create table public.sellers (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  company_name      text not null,
  state             text,
  annual_revenue    numeric,
  ebitda            numeric,
  ebitda_margin     numeric,
  employee_count    integer,
  years_in_business integer,
  business_type     text check (business_type in ('residential', 'commercial', 'both')),
  work_type         text check (work_type in ('retail', 'insurance', 'both')),
  software          text,
  management_type   text check (management_type in ('owner_operated', 'has_management_team')),
  asking_price      numeric,
  status            text not null default 'active'
                    check (status in ('active', 'under_nda', 'sold', 'inactive')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger sellers_updated_at
  before update on public.sellers
  for each row execute function public.handle_updated_at();
```

Expected: "Success. No rows returned."

- [ ] **Step 4: Run — create `buyers` table**

```sql
create table public.buyers (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles(id) on delete cascade,
  organization_name     text not null,
  revenue_min           numeric,
  revenue_max           numeric,
  ebitda_min            numeric,
  ebitda_max            numeric,
  target_states         text[],
  business_type         text check (business_type in ('residential', 'commercial', 'both', 'any')),
  work_type             text check (work_type in ('retail', 'insurance', 'both', 'any')),
  employee_min          integer,
  employee_max          integer,
  preferred_software    text,
  management_preference text check (management_preference in ('owner_operated', 'has_management_team', 'any')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger buyers_updated_at
  before update on public.buyers
  for each row execute function public.handle_updated_at();
```

Expected: "Success. No rows returned."

- [ ] **Step 5: Run — create `events` table**

```sql
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles(id) on delete set null,
  entity_type  text check (entity_type in ('seller', 'buyer', 'profile', 'access_request')),
  entity_id    uuid,
  action       text not null,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);
```

Expected: "Success. No rows returned."

- [ ] **Step 6: Run — enable RLS and add policies**

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.sellers  enable row level security;
alter table public.buyers   enable row level security;
alter table public.events   enable row level security;

-- profiles: own record access
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_broker"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'broker'
  ));

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_update_broker"
  on public.profiles for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'broker'
  ));

-- sellers: own record + broker full access + buyers see active listings
create policy "sellers_select_own"
  on public.sellers for select
  using (profile_id = auth.uid());

create policy "sellers_select_broker"
  on public.sellers for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'broker'
  ));

create policy "sellers_select_buyer_active"
  on public.sellers for select
  using (
    status = 'active'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'buyer'
    )
  );

create policy "sellers_insert_own"
  on public.sellers for insert
  with check (profile_id = auth.uid());

create policy "sellers_update_own"
  on public.sellers for update
  using (profile_id = auth.uid());

create policy "sellers_update_broker"
  on public.sellers for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'broker'
  ));

create policy "sellers_delete_broker"
  on public.sellers for delete
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'broker'
  ));

-- buyers: own record + broker full access
create policy "buyers_select_own"
  on public.buyers for select
  using (profile_id = auth.uid());

create policy "buyers_select_broker"
  on public.buyers for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'broker'
  ));

create policy "buyers_insert_own"
  on public.buyers for insert
  with check (profile_id = auth.uid());

create policy "buyers_update_own"
  on public.buyers for update
  using (profile_id = auth.uid());

create policy "buyers_update_broker"
  on public.buyers for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'broker'
  ));

-- events: any authenticated user can insert; own events + broker can read
create policy "events_insert_authenticated"
  on public.events for insert
  with check (auth.uid() is not null);

create policy "events_select_own"
  on public.events for select
  using (actor_id = auth.uid());

create policy "events_select_broker"
  on public.events for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'broker'
  ));
```

Expected: "Success. No rows returned."

- [ ] **Step 7: Run — username-to-email RPC function**

Used by the login flow to resolve username → email before authenticating with Supabase.

```sql
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email
  from auth.users u
  inner join public.profiles pr on pr.id = u.id
  where pr.username = p_username
  limit 1;
$$;
```

Expected: "Success. No rows returned."

- [ ] **Step 8: Verify in Supabase Studio → Table Editor**

Confirm you see four tables: `profiles`, `sellers`, `buyers`, `events`. Click each and verify the columns match the schema.

- [ ] **Step 9: Commit docs**

```bash
git add docs/
git commit -m "feat: add MVP schema design spec, CLAUDE.md, and implementation plan"
```

---

### Task 2: TypeScript domain types

**Files:**
- Create: `src/app/lib/types.ts`

**Interfaces:**
- Produces: `Profile`, `Seller`, `Buyer`, `Event`, and all supporting union types — used by every data layer module in Tasks 3–6

- [ ] **Step 1: Create `src/app/lib/types.ts`**

```typescript
export type Role = 'broker' | 'buyer' | 'seller';

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
```

Note: the events interface is named `BrokerEvent` to avoid collision with the native DOM `Event` type.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/types.ts
git commit -m "feat: add TypeScript domain types for profiles, sellers, buyers, events"
```

---

### Task 3: Auth data layer

**Files:**
- Create: `src/app/lib/supabase/auth.ts`

**Interfaces:**
- Consumes: `supabase` client from `./supabase.js`, `subscribeToPush` from `../../utils/pushManage`
- Produces:
  - `signup(email, password, username, role, captchaToken?): Promise<{ success: true; user: User }>`
  - `login(emailOrUsername, password, captchaToken?): Promise<User>`
  - `logout(): Promise<true>`
  - `resetPassword(email): Promise<true>`

- [ ] **Step 1: Create `src/app/lib/supabase/auth.ts`**

```typescript
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
    },
  });

  if (authError) throw new Error(authError.message);
  if (!data.user) throw new Error('No se pudo obtener la información del usuario');

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    username,
    role,
  });

  if (profileError) throw new Error(profileError.message);

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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors from `src/app/lib/supabase/auth.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/supabase/auth.ts
git commit -m "feat: add auth data layer with username login support"
```

---

### Task 4: Profiles data layer

**Files:**
- Create: `src/app/lib/supabase/profiles.ts`

**Interfaces:**
- Consumes: `supabase` from `./supabase.js`, `Profile` from `../types`
- Produces:
  - `getProfile(): Promise<Profile>`
  - `updateProfile(data: Partial<Pick<Profile, 'username'>>): Promise<Profile>`

- [ ] **Step 1: Create `src/app/lib/supabase/profiles.ts`**

```typescript
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
  updates: Partial<Pick<Profile, 'username'>>
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/supabase/profiles.ts
git commit -m "feat: add profiles data layer"
```

---

### Task 5: Sellers data layer

**Files:**
- Create: `src/app/lib/supabase/sellers.ts`

**Interfaces:**
- Consumes: `supabase` from `./supabase.js`, `Seller` from `../types`
- Produces:
  - `createSeller(data: SellerInput): Promise<Seller>`
  - `getOwnSeller(): Promise<Seller | null>`
  - `getAllSellers(): Promise<Seller[]>`
  - `getSellerById(id: string): Promise<Seller>`
  - `updateSeller(id: string, data: SellerUpdate): Promise<Seller>`
  - `deleteSeller(id: string): Promise<void>`

Where:
```typescript
type SellerInput = Omit<Seller, 'id' | 'profile_id' | 'created_at' | 'updated_at' | 'status'>
type SellerUpdate = Partial<Omit<Seller, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>
```

- [ ] **Step 1: Create `src/app/lib/supabase/sellers.ts`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/supabase/sellers.ts
git commit -m "feat: add sellers data layer"
```

---

### Task 6: Buyers data layer

**Files:**
- Create: `src/app/lib/supabase/buyers.ts`

**Interfaces:**
- Consumes: `supabase` from `./supabase.js`, `Buyer` from `../types`
- Produces:
  - `createBuyer(data: BuyerInput): Promise<Buyer>`
  - `getOwnBuyer(): Promise<Buyer | null>`
  - `getAllBuyers(): Promise<Buyer[]>`
  - `updateBuyer(id: string, data: BuyerUpdate): Promise<Buyer>`

Where:
```typescript
type BuyerInput = Omit<Buyer, 'id' | 'profile_id' | 'created_at' | 'updated_at'>
type BuyerUpdate = Partial<Omit<Buyer, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>
```

- [ ] **Step 1: Create `src/app/lib/supabase/buyers.ts`**

```typescript
import { supabase } from './supabase';
import type { Buyer } from '../types';

type BuyerInput = Omit<Buyer, 'id' | 'profile_id' | 'created_at' | 'updated_at'>;
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/supabase/buyers.ts
git commit -m "feat: add buyers data layer"
```

---

### Task 7: Events data layer

**Files:**
- Create: `src/app/lib/supabase/events.ts`

**Interfaces:**
- Consumes: `supabase` from `./supabase.js`, `EntityType` from `../types`
- Produces:
  - `logEvent(entityType: EntityType, entityId: string, action: string, metadata?: Record<string, unknown>): Promise<void>`

- [ ] **Step 1: Create `src/app/lib/supabase/events.ts`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/supabase/events.ts
git commit -m "feat: add events audit log data layer"
```

---

### Task 8: Remove legacy posts code

This task eliminates all references to the `posts` schema and updates pages to remove broken imports.

**Files:**
- Modify: `src/app/lib/supabase/supabase_manage.js` — replace body with re-exports from new modules
- Delete: `src/shared/components/createPost/createPost.tsx`
- Modify: `src/shared/components/dashboard/dashboard.tsx` — stub (marketplace is Sprint 2)
- Modify: `src/app/seller/page.tsx` — remove CreatePost and Dashboard imports
- Modify: `src/app/buyer/page.tsx` — remove Dashboard import

**Interfaces:**
- Consumes: all modules from Tasks 3–7
- Produces: zero references to `posts` remaining in the codebase

- [ ] **Step 1: Replace `supabase_manage.js` with re-exports**

Replace the entire contents of `src/app/lib/supabase/supabase_manage.js` with:

```javascript
// Backwards-compat re-exports. Import directly from the typed modules in new code.
export { signup, login, logout, resetPassword } from './auth';
export { getProfile, updateProfile } from './profiles';
export { createSeller, getOwnSeller, getAllSellers, getSellerById, updateSeller, deleteSeller } from './sellers';
export { createBuyer, getOwnBuyer, getAllBuyers, updateBuyer } from './buyers';
export { logEvent } from './events';
```

- [ ] **Step 2: Delete `createPost.tsx`**

Delete `src/shared/components/createPost/createPost.tsx` entirely.

- [ ] **Step 3: Stub `dashboard.tsx`**

Replace the entire contents of `src/shared/components/dashboard/dashboard.tsx` with:

```tsx
"use client";

// Marketplace and broker dashboard rebuilt in Sprint 2.
export default function Dashboard() {
  return null;
}
```

- [ ] **Step 4: Update `src/app/seller/page.tsx`**

Replace the entire file:

```tsx
"use client";

import { useAuth } from "../utils/isAuth";

const steps = [
  { title: "Initial Consultation", description: "Learn your goals, timeline, and exit expectations." },
  { title: "Business Evaluation", description: "Analyze financials, market position, and assets to determine fair market value." },
  { title: "Tailored Marketing Strategy", description: "Develop a confidential, targeted plan to reach qualified buyers." },
  { title: "Buyer Engagement", description: "Present your business to vetted buyers and highlight its unique strengths." },
  { title: "Expert Negotiation", description: "Leverage our experience to secure the best terms and protect your interests." },
  { title: "Closing & Transition", description: "Support you through legal, financial, and operational steps until the deal is finalized." },
];

const benefits = [
  "Understanding your personal and financial goals.",
  "Showcasing your business's history, operations, and reputation.",
  "Evaluating financial performance and key selling points.",
  "Designing a tailored marketing strategy to reach qualified buyers.",
  "Positioning your company to attract serious interest from acquirers, private equity, and investors.",
  "Negotiating from a position of strength to protect your legacy.",
];

const Seller = () => {
  const { isLoggedIn } = useAuth();

  return (
    <section className='mhWrapper flex-col'>
      <article className='container'>
        <div className='p-4 sm:p-6 animate-fadeInUp'>
          <h1 className='text-4xl pb-4'>Sell-Side Business Brokerage</h1>
          <p className='text-lg max-w-2xl leading-relaxed opacity-90'>
            Selling your roofing business is more than a transaction. It&apos;s a decision
            that impacts your legacy, your team, and your future. Our role is to guide you
            every step of the way, ensuring your business is valued, marketed, and sold with
            integrity and care.
          </p>
        </div>
      </article>

      <article className='container p-4 sm:p-6 animate-fadeInUp'>
        <span className='inline-block text-xs font-semibold uppercase tracking-widest opacity-60 pb-4'>
          Investment-Grade Readiness Assessment
        </span>
        <h2 className='text-3xl pb-4'>Why Selling Your Roofing Business with a Broker Matters</h2>
        <p className='text-lg max-w-2xl leading-relaxed opacity-90 pb-6'>
          Our exclusive focus on the roofing industry gives us unmatched insight into what
          drives buyer interest and value.
        </p>
        <p className='text-base font-semibold pb-3'>We help you by:</p>
        <ul className='flex flex-col gap-2 max-w-xl'>
          {benefits.map((benefit, i) => (
            <li key={i} className='flex items-start gap-3'>
              <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-white opacity-70' />
              <span className='text-base leading-relaxed opacity-90'>{benefit}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className='container p-4 sm:p-6 pb-10 animate-fadeInUp'>
        <h2 className='text-3xl pb-10'>Comprehensive Sale Process</h2>
        <div className='overflow-x-auto pb-4'>
          <div className='flex min-w-[720px]'>
            {steps.map((step, i) => (
              <div key={i} className='relative flex flex-1 flex-col items-center text-center px-2'>
                {i < steps.length - 1 && (
                  <div className='absolute top-5 left-1/2 w-full h-px bg-white/30' />
                )}
                <div className='relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white/10 text-sm font-bold backdrop-blur-sm'>
                  {i + 1}
                </div>
                <h3 className='mt-4 text-sm font-semibold leading-tight'>{step.title}</h3>
                <p className='mt-2 text-xs leading-relaxed opacity-75 max-w-[140px]'>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </article>

      {isLoggedIn && (
        <article className='container p-4 sm:p-6 animate-fadeInUp'>
          <p className='text-base opacity-60'>Seller onboarding portal coming in Sprint 2.</p>
        </article>
      )}
    </section>
  );
};

export default Seller;
```

- [ ] **Step 5: Update `src/app/buyer/page.tsx`**

Replace the entire file:

```tsx
"use client";

import Button from "../../shared/components/button/button";
import { useAuth } from "../utils/isAuth";

const steps = [
  { title: "Initial Consultation", description: "Supporting you through closing and transition." },
  { title: "Target Identification", description: "Leverage our network to find roofing businesses that fit your strategy." },
  { title: "Due Diligence", description: "Evaluate financial health, operational efficiency, and market position." },
  { title: "Negotiation", description: "Secure fair terms and advocate on your behalf to get the best deal." },
  { title: "Closing", description: "Manage the transaction process from start to finish." },
  { title: "Transition Support", description: "Provide guidance to ensure a smooth integration and successful handover." },
];

const benefits = [
  "Understanding your growth goals and acquisition strategy.",
  "Identifying roofing businesses that align with your criteria.",
  "Reviewing financials, operations, and market position.",
  "Conducting thorough due diligence.",
  "Negotiating terms that protect your interests.",
  "Supporting you through closing and transition.",
];

const Buyer = () => {
  const { isLoggedIn } = useAuth();

  return (
    <section className='mhWrapper flex-col'>
      <article className='container'>
        <div className='p-4 sm:p-6 animate-fadeInUp'>
          <h1 className='text-4xl pb-4'>Acquire Roofing Businesses with Confidence</h1>
          <p className='text-lg max-w-2xl leading-relaxed opacity-90 pb-3'>
            We help investors and operators identify, evaluate, and acquire high-quality roofing companies.
          </p>
          <p className='text-lg max-w-2xl leading-relaxed opacity-90'>
            If you&apos;re looking to buy a roofing business, our team provides the expertise and process
            to help you identify and acquire the right opportunity.
          </p>
        </div>
      </article>

      <article className='container p-4 sm:p-6 animate-fadeInUp'>
        <div className='flex flex-col items-start gap-3 max-w-xs'>
          <Button version='primary' text='Start Buyer Onboarding' />
          <p className='text-sm opacity-60'>
            All conversations are confidential and tailored to your acquisition goals.
          </p>
        </div>
      </article>

      <article className='container p-4 sm:p-6 animate-fadeInUp'>
        <h2 className='text-3xl pb-4'>Why Acquisition Matters</h2>
        <p className='text-lg max-w-2xl leading-relaxed opacity-90 pb-6'>
          Acquiring a roofing business is one of the fastest ways to grow your company,
          expand market share, and increase profitability.
        </p>
        <p className='text-base font-semibold pb-3'>We help you by:</p>
        <ul className='flex flex-col gap-2 max-w-xl'>
          {benefits.map((benefit, i) => (
            <li key={i} className='flex items-start gap-3'>
              <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-white opacity-70' />
              <span className='text-base leading-relaxed opacity-90'>{benefit}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className='container p-4 sm:p-6 pb-10 animate-fadeInUp'>
        <span className='inline-block text-xs font-semibold uppercase tracking-widest opacity-60 pb-4'>
          Buy-Side Business Brokerage
        </span>
        <h2 className='text-3xl pb-10'>Comprehensive Acquisition Process</h2>
        <div className='overflow-x-auto pb-4'>
          <div className='flex min-w-[720px]'>
            {steps.map((step, i) => (
              <div key={i} className='relative flex flex-1 flex-col items-center text-center px-2'>
                {i < steps.length - 1 && (
                  <div className='absolute top-5 left-1/2 w-full h-px bg-white/30' />
                )}
                <div className='relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white/10 text-sm font-bold backdrop-blur-sm'>
                  {i + 1}
                </div>
                <h3 className='mt-4 text-sm font-semibold leading-tight'>{step.title}</h3>
                <p className='mt-2 text-xs leading-relaxed opacity-75 max-w-[140px]'>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </article>

      {isLoggedIn && (
        <article className='container p-4 sm:p-6 animate-fadeInUp'>
          <p className='text-base opacity-60'>Buyer marketplace coming in Sprint 2.</p>
        </article>
      )}
    </section>
  );
};

export default Buyer;
```

- [ ] **Step 6: Verify no remaining posts references**

```bash
grep -r "posts\|addPost\|getPosts\|getOwnPosts\|getPostById\|deletePost\|createPost\|CreatePost" \
  /Users/valentingonzalez/Proyects/brokerage/src --include="*.ts" --include="*.tsx" --include="*.js"
```

Expected: zero results (only `supabase_manage.js` if it still has a re-export comment, which is fine).

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Run dev server and verify pages load**

```bash
npm run dev
```

Navigate to `/seller` and `/buyer` — both should render without console errors. Authenticated sections show the sprint placeholder messages.

- [ ] **Step 9: Commit**

```bash
git add src/app/lib/supabase/supabase_manage.js
git add src/shared/components/dashboard/dashboard.tsx
git add src/app/seller/page.tsx
git add src/app/buyer/page.tsx
git rm src/shared/components/createPost/createPost.tsx
git commit -m "feat: remove legacy posts schema, clean up components for Sprint 2"
```
