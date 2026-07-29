# Schema MVP Design — The Roofing Biz Broker Portal

**Date:** 2026-07-29  
**Sprint:** MVP Sprint 1 — Entity Definitions  
**Status:** Approved

---

## Context

The project is a roofing M&A brokerage platform connecting buyers and sellers of roofing businesses, with a broker as the central intermediary. The existing `posts` table belongs to a previous unrelated project and must be fully replaced by the domain schema defined here.

The matching engine and access request flow are deferred to Sprint 2.

---

## Scope of This Sprint

Define and implement the three core entities:
- `profiles` — role management for all users
- `sellers` — roofing companies listed for sale
- `buyers` — organizations with acquisition criteria (Buy Box)
- `events` — audit log for all system interactions

Not in scope: matching engine, access requests, NDA flow, Investment Grade Score, PRPR, Academy.

---

## Architecture Decision

**Option A — Fixed columns per entity** was selected over JSONB or hybrid approaches.

The MVP has well-defined fields from the vision document. Fixed columns provide type safety, simple queries, and clear validation. Schema growth is handled via Supabase migrations. JSONB is reserved for `events.metadata` only, where variable context per event type is genuinely warranted.

---

## Schema

### `profiles`

Central role table. Linked 1:1 with Supabase `auth.users`.

```sql
profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id),
  username    text UNIQUE NOT NULL,
  role        text NOT NULL CHECK (role IN ('broker', 'buyer', 'seller')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)
```

- Broker role is assigned manually via Supabase Studio.
- Buyers and sellers self-assign during onboarding.
- Login accepts email (via Supabase auth) or username (resolved to email via profiles lookup).
- Row Level Security policy will use this table. Full security review is scheduled for a future sprint.

---

### `sellers`

Represents a roofing company listed for sale. One company per seller profile in MVP.

```sql
sellers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid NOT NULL REFERENCES profiles(id),
  company_name      text NOT NULL,
  state             text,
  annual_revenue    numeric,
  ebitda            numeric,
  ebitda_margin     numeric,
  employee_count    integer,
  years_in_business integer,
  business_type     text CHECK (business_type IN ('residential', 'commercial', 'both')),
  work_type         text CHECK (work_type IN ('retail', 'insurance', 'both')),
  software          text,
  management_type   text CHECK (management_type IN ('owner_operated', 'has_management_team')),
  asking_price      numeric,
  status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'under_nda', 'sold', 'inactive')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
)
```

Future fields (deferred): Investment Grade Score, PRPR, Academy indicators.

---

### `buyers`

Represents an acquiring organization with its Buy Box criteria. All criteria are nullable — the vision specifies they must be optional and editable.

```sql
buyers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            uuid NOT NULL REFERENCES profiles(id),
  organization_name     text NOT NULL,
  revenue_min           numeric,
  revenue_max           numeric,
  ebitda_min            numeric,
  ebitda_max            numeric,
  target_states         text[],
  business_type         text CHECK (business_type IN ('residential', 'commercial', 'both', 'any')),
  work_type             text CHECK (work_type IN ('retail', 'insurance', 'both', 'any')),
  employee_min          integer,
  employee_max          integer,
  preferred_software    text,
  management_preference text CHECK (management_preference IN ('owner_operated', 'has_management_team', 'any')),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
)
```

---

### `events`

Audit log for all system interactions. Feeds future AI and analytics features.

```sql
events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid REFERENCES profiles(id),
  entity_type  text CHECK (entity_type IN ('seller', 'buyer', 'profile', 'access_request')),
  entity_id    uuid,
  action       text NOT NULL,
  metadata     jsonb,
  created_at   timestamptz DEFAULT now()
)
```

`metadata` uses JSONB because event context is genuinely variable per action type. This is the only justified JSONB exception in this schema.

Example actions: `created`, `updated`, `deleted`, `status_changed`.

---

## Broker Role

Brokers do not have a separate table. Access control is handled entirely by `role = 'broker'` in `profiles` via RLS. A broker has full read and write access to all entities.

---

## What Replaces `posts`

The existing `posts` table and all references to it (`addPost`, `getPosts`, `getOwnPosts`, `getPostById`, `deletePost` in `supabase_manage.js`, `CreatePost` component, `Dashboard` component) must be replaced with the new domain entities in a future implementation sprint.

---

## Deferred to Sprint 2

- `matches` table (compatibility scores between buyers and sellers)
- `access_requests` table (buyer requests to reveal a seller identity)
- NDA flow
- Full RLS security review
- Matching engine algorithm
