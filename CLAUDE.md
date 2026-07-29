# The Roofing Biz Broker Portal — Project Context

## What We're Building

A roofing M&A brokerage platform that connects buyers (acquiring organizations) and sellers (roofing companies) through a broker intermediary. The broker is never replaced — the platform amplifies their work. Every interaction generates data that enriches the system over time.

This is not a CRM or a website. It is the beginning of an intelligent ecosystem for roofing business M&A.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database / Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Styling:** SCSS + Tailwind CSS
- **Deployment:** Vercel (assumed)

## User Roles

Three roles, all managed via the `profiles` table:

- **broker** — full read/write access to everything. Assigned manually in Supabase Studio.
- **buyer** — represents an acquiring organization. Self-assigned during onboarding.
- **seller** — represents a roofing company for sale. Self-assigned during onboarding.

## Core Database Schema (MVP Sprint 1)

```
profiles     — role management, linked 1:1 to auth.users, includes unique username
sellers      — roofing companies listed for sale (revenue, EBITDA, location, services, etc.)
buyers       — acquiring organizations with Buy Box criteria (ranges, geography, preferences)
events       — audit log for all system interactions (fuel for future AI/analytics)
```

Full schema spec: `docs/superpowers/specs/2026-07-29-schema-mvp-design.md`

## Authentication

- Supabase Auth handles email/password.
- Users can log in with email or username.
- Username login: look up email in `profiles` by username, then authenticate with Supabase using that email.

## Key Business Rules

- Buyers see sellers anonymously in the marketplace (no name, address, or brand revealed).
- To reveal a seller, a buyer must request access → broker reviews → NDA signed → CIM access granted. This flow must never be bypassed.
- All actions must be logged to the `events` table.
- The broker is the only role that can see identifying seller information without going through the NDA flow.

## Sprint History

- **Sprint 1 (current):** Entity definitions — `profiles`, `sellers`, `buyers`, `events` tables. Replace legacy `posts` schema.
- **Sprint 2 (next):** Matching engine — compatibility score between buyers and sellers.

## Deferred Features

Investment Grade Score, PRPR, Roofing Academy, Data Room, CIM, Workflow, Due Diligence, Closing, CRM, AI matching, AI valuations, Benchmarking, Analytics, Capital Raising.

## Important Notes

- The legacy `posts` table (from a previous project) is being replaced. Do not add new code that references `posts`, `addPost`, `getPosts`, `getOwnPosts`, `getPostById`, or `deletePost`.
- A full RLS security review is scheduled for a future sprint. For now, use the simple `profiles.role` approach.
- The schema uses fixed columns (Option A). No JSONB for entity fields. Exception: `events.metadata` only.
- All financial values are in USD.
- Geography uses US state codes (e.g. 'TX', 'FL', 'GA').
