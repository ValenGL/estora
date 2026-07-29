# Onboarding Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-step post-registration onboarding flow that sets the user's role (Buy/Sell) and username before granting access to the platform.

**Architecture:** Single route `/onboarding` with local step state. Role is written to Supabase on panel click (step 1 is immediately locked). Username is validated on the frontend on every keystroke and uniqueness-checked only on submit. AuthContext is extended to carry `role` and a `refreshRole` function so ProtectedRoute can gate pending users without extra Supabase calls on every render.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL + Auth), SCSS, React 18.

## Global Constraints

- Role type lives in `src/app/lib/types.ts` — any new role value must be added there first.
- `updateProfile` in `src/app/lib/supabase/profiles.ts` is the only function allowed to write to the `profiles` table from the client.
- Username rules: only `a-z 0-9 _ -`, min 3 / max 20 chars, must start with a letter, stored lowercase.
- No `router.push` calls inside form submit handlers for redirects that depend on auth state — use the `useEffect + isLoggedIn/role` pattern established in `loginForm.tsx`.
- Do not reference `posts`, `addPost`, `getPosts` or any legacy posts API.

---

### Task 1: Add `"pending"` to Role + extend AuthContext with role and refreshRole

**Files:**
- Modify: `src/app/lib/types.ts`
- Modify: `src/app/utils/isAuth.tsx`

**Interfaces:**
- Produces: `Role` type now includes `"pending"` · `useAuth()` returns `{ user, isLoggedIn, isLoading, role: Role | null, refreshRole: () => Promise<void> }`

- [ ] **Step 1: Add `"pending"` to the Role type**

In `src/app/lib/types.ts`, change line 1:

```ts
export type Role = 'broker' | 'buyer' | 'seller' | 'pending';
```

- [ ] **Step 2: Extend AuthContext interface and state in `isAuth.tsx`**

Replace the entire file content:

```tsx
"use client";

import { useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "../lib/types";
import { supabase } from "./../lib/supabase/supabase";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  role: Role | null;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  role: null,
  refreshRole: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    setRole((data?.role as Role) ?? null);
  };

  const refreshRole = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    await fetchRole(currentUser.id);
  }, []);

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION, replacing the
    // need for a separate getUser() call and eliminating the race condition
    // between initial check and subsequent SIGNED_IN events.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session?.user);

      if (session?.user) {
        await fetchRole(session.user.id);
      } else {
        setRole(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, role, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/valentingonzalez/Proyects/brokerage && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors related to `Role` or `AuthContextType`.

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/types.ts src/app/utils/isAuth.tsx
git commit -m "feat: add pending role + extend AuthContext with role and refreshRole"
```

---

### Task 2: Extend `updateProfile` to accept the `role` field

**Files:**
- Modify: `src/app/lib/supabase/profiles.ts`

**Interfaces:**
- Consumes: `Profile` from `src/app/lib/types.ts` (now includes `"pending"` in `role`)
- Produces: `updateProfile(updates: Partial<Pick<Profile, 'username' | 'role'>>): Promise<Profile>`

- [ ] **Step 1: Update the `updateProfile` signature**

In `src/app/lib/supabase/profiles.ts`, change the `updates` parameter type on line 19:

```ts
export const updateProfile = async (
  updates: Partial<Pick<Profile, 'username' | 'role'>>
): Promise<Profile> => {
```

No other changes — the Supabase `.update(updates)` call already handles any subset of fields.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/supabase/profiles.ts
git commit -m "feat: allow updateProfile to update role field"
```

---

### Task 3: Wire signup to `"pending"` role and redirect to `/onboarding`

**Files:**
- Modify: `src/shared/components/registerForm/registerForm.tsx`

**Interfaces:**
- Consumes: `signup` from `src/app/lib/supabase/auth.ts` (signature unchanged — `role: Role` parameter now accepts `"pending"`)

- [ ] **Step 1: Replace `registerForm.tsx` content**

The changes: pass `"pending"` as role, remove the `confirmEmailDialog` state and modal, redirect to `/onboarding` on success.

```tsx
"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { signup } from "./../../../app/lib/supabase/supabase_manage";
import Button from "./../button/button";

const RegisterForm: React.FC = () => {
  const router = useRouter();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<any>(null);

  const handleVerify = (token: string) => {
    setCaptchaToken(token);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;
    const passwordConfirm = passwordConfirmRef.current?.value;

    if (!email || !password || !passwordConfirm) {
      setError("Todos los campos son requeridos");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!captchaToken) {
      setError("Por favor, completa el CAPTCHA");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const username = email.split("@")[0];
      await signup(email, password, username, "pending", captchaToken);

      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  }

  return (
    <div className='mhWrapper flex-col sm:flex sm:items-center sm:justify-center m-4 sm:m-6'>
      <h1 className='clipped'>Register</h1>
      <h2 className='text-4xl sm:text-6xl caveat'>
        Join the best marketplace for roofing businesses
      </h2>
      <section className='u-bgcolor-estora-dark shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] my-6 p-6 rounded-2xl'>
        <div className='pb-4'>
          <h3 className='text-2xl'>Register in Brokerage</h3>
        </div>
        {error && <span className='text-red-500'>Error: {error}</span>}
        <form className='flex flex-col' onSubmit={handleSubmit}>
          <div className='grid pb-2'>
            <label className='pr-4' htmlFor='email'>
              <span>Email</span>
            </label>
            <input
              className='px-3 py-1 border border-gray-300 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100 sm:col-span-3'
              id='email'
              type='email'
              required
              placeholder='Enter your email'
              ref={emailRef}
              disabled={loading}
            />
          </div>
          <div className='grid pb-2'>
            <label className='pr-4' htmlFor='password'>
              <span>Password</span>
            </label>
            <input
              className='px-3 py-1 border border-gray-300 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100 sm:col-span-3'
              id='password'
              type='password'
              required
              placeholder='Enter your password'
              ref={passwordRef}
              disabled={loading}
            />
          </div>
          <div className='grid pb-2'>
            <label className='pr-4' htmlFor='confirmPassword'>
              <span>Confirm password</span>
            </label>
            <input
              className='px-3 py-1 border border-gray-300 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100 sm:col-span-3'
              id='confirmPassword'
              type='password'
              required
              placeholder='Enter your password again'
              ref={passwordConfirmRef}
              disabled={loading}
            />
          </div>
          <div className='py-4 flex justify-center'>
            <HCaptcha
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
              onVerify={handleVerify}
            />
          </div>
          <div className='my-4'>
            <Button
              text={loading ? "Registering..." : "Register"}
              version={loading ? "disabled" : "outlined"}
              block
              type='submit'
            />
          </div>
        </form>
        <div className='mb-4'>
          <Button
            text='I already have an account'
            version='outlined'
            block
            onClick={() => router.push("/")}
          />
        </div>
      </section>
    </div>
  );
};

export default RegisterForm;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `registerForm`.

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/registerForm/registerForm.tsx
git commit -m "feat: signup with pending role, redirect to /onboarding"
```

---

### Task 4: Guard — redirect pending users from ProtectedRoute to `/onboarding`

**Files:**
- Modify: `src/app/utils/protectedRoute.tsx`

**Interfaces:**
- Consumes: `useAuth()` — now returns `role: Role | null` in addition to `user` and `isLoading`

- [ ] **Step 1: Update `protectedRoute.tsx`**

```tsx
"use client";

import { redirect } from "next/navigation";
import { ComponentType } from "react";
import { useAuth } from "./isAuth";

const ProtectedRoute = <P extends object>(Component: ComponentType<P>) => {
  return function WrappedComponent(props: P) {
    const { user, isLoading, role } = useAuth();

    if (isLoading) return null;
    if (!user) redirect("/");
    if (role === "pending") redirect("/onboarding");

    return <Component {...props} />;
  };
};

export default ProtectedRoute;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test — existing login flow still works**

- Log in with an existing account that has `role = "buyer"` or `"seller"` in Supabase.
- Verify `/inicio` loads without redirect loop.
- Verify logging out redirects to `/`.

- [ ] **Step 4: Commit**

```bash
git add src/app/utils/protectedRoute.tsx
git commit -m "feat: redirect pending-role users to /onboarding in ProtectedRoute"
```

---

### Task 5: Build the onboarding page (Step 1: Buy/Sell + Step 2: Username)

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/app/onboarding/onboarding.scss`

**Interfaces:**
- Consumes: `useAuth()` → `{ user, isLoading, role, refreshRole }`
- Consumes: `updateProfile({ role })` and `updateProfile({ username })` from `src/app/lib/supabase/profiles.ts`

- [ ] **Step 1: Create `onboarding.scss`**

```scss
.onboarding-role-select {
  display: flex;
  height: 100dvh;
}

.onboarding-panel {
  width: 50dvw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s ease;
  color: var(--estora-white);

  &--buy {
    background-color: var(--estora-dark);
  }

  &--sell {
    background-color: var(--estora-black);
  }

  &:hover:not(:disabled) {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &__label {
    font-size: 5rem;
    line-height: 1;
  }

  &__desc {
    font-size: 1.25rem;
    max-width: 240px;
    text-align: center;
    opacity: 0.8;
  }
}

.onboarding-username {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100dvh;
  gap: 1.25rem;

  h2 {
    font-size: 2rem;
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 300px;
  }

  input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  button[type='submit'] {
    width: 100%;
    padding: 0.6rem;
    border-radius: 0.5rem;
    border: 1px solid currentColor;
    background: transparent;
    font-size: 1rem;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.onboarding-error {
  color: #ef4444;
  font-size: 0.875rem;
  align-self: flex-start;
}
```

- [ ] **Step 2: Create `src/app/onboarding/page.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateProfile } from "../lib/supabase/profiles";
import { useAuth } from "../utils/isAuth";
import "./onboarding.scss";

const USERNAME_REGEX = /^[a-z0-9_-]+$/i;

function validateUsername(value: string): string | null {
  if (value.length < 3) return "Mínimo 3 caracteres";
  if (value.length > 20) return "Máximo 20 caracteres";
  if (!/^[a-z]/i.test(value)) return "Debe comenzar con una letra";
  if (!USERNAME_REGEX.test(value)) return "Solo letras, números, _ y -";
  return null;
}

export default function Onboarding() {
  const router = useRouter();
  const { user, isLoading, role, refreshRole } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [panelLoading, setPanelLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push("/"); return; }
    if (role !== "pending" && role !== null) router.push("/inicio");
  }, [isLoading, user, role, router]);

  const handleRoleSelect = async (chosen: "buyer" | "seller") => {
    setPanelLoading(true);
    try {
      await updateProfile({ role: chosen });
      setStep(2);
    } catch (err) {
      console.error("Error setting role:", err);
    } finally {
      setPanelLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setUsername(val);
    setUsernameError(validateUsername(val) ?? "");
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateUsername(username);
    if (error) { setUsernameError(error); return; }

    setUsernameLoading(true);
    try {
      await updateProfile({ username });
      await refreshRole();
      router.push("/inicio");
    } catch (err: any) {
      const isDuplicate =
        err?.code === "23505" ||
        err?.message?.toLowerCase().includes("unique") ||
        err?.message?.toLowerCase().includes("duplicate");
      setUsernameError(
        isDuplicate ? "Este username ya está en uso" : "Error al guardar. Intentá de nuevo."
      );
    } finally {
      setUsernameLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <main>
      {step === 1 && (
        <div className="onboarding-role-select">
          <button
            className="onboarding-panel onboarding-panel--buy"
            onClick={() => handleRoleSelect("buyer")}
            disabled={panelLoading}
          >
            <span className="onboarding-panel__label caveat">BUY</span>
            <span className="onboarding-panel__desc">
              I want to acquire a roofing business
            </span>
          </button>
          <button
            className="onboarding-panel onboarding-panel--sell"
            onClick={() => handleRoleSelect("seller")}
            disabled={panelLoading}
          >
            <span className="onboarding-panel__label caveat">SELL</span>
            <span className="onboarding-panel__desc">
              I want to sell my roofing business
            </span>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding-username">
          <h2>Choose your username</h2>
          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="yourname"
              autoComplete="off"
              disabled={usernameLoading}
            />
            {usernameError && (
              <span className="onboarding-error">{usernameError}</span>
            )}
            <button
              type="submit"
              disabled={!!validateUsername(username) || usernameLoading}
            >
              {usernameLoading ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: End-to-end manual test**

Register a fresh account:
- Fill email + password → submit
- Verify redirect lands on `/onboarding`
- Verify two panels appear side by side, full viewport height
- Click BUY — verify loading state appears, then step 2 appears
- Check Supabase Studio → `profiles` table → confirm `role = "buyer"` for that user
- Type a username shorter than 3 chars → verify inline error appears
- Type a username starting with a number → verify inline error appears
- Type a username with special chars (e.g. `user@name`) → verify inline error
- Type a valid username → verify error clears, button enables
- Submit → verify redirect to `/inicio`
- Check Supabase Studio → confirm `username` updated

Repeat and test the SELL panel. Repeat and test a duplicate username.

- [ ] **Step 5: Test guard — pending user intercepted**

- In Supabase Studio, manually set a profile back to `role = "pending"`
- Log in as that user
- Navigate to `/inicio` → verify redirect to `/onboarding`

- [ ] **Step 6: Commit**

```bash
git add src/app/onboarding/page.tsx src/app/onboarding/onboarding.scss
git commit -m "feat: onboarding flow — role selection and username steps"
```
