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
  effectiveRole: Role | null;
  setDebugRole: (role: Role | null) => void;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  role: null,
  effectiveRole: null,
  setDebugRole: () => {},
  refreshRole: async () => {},
});

// Module-level — stable, no closure issues
const fetchRole = async (
  userId: string,
  setRole: (role: Role | null) => void
) => {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  setRole((data?.role as Role) ?? null);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [debugRole, setDebugRoleState] = useState<Role | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('debug_role') as Role | null;
    if (stored) setDebugRoleState(stored);
  }, []);

  const setDebugRole = useCallback((newRole: Role | null) => {
    setDebugRoleState(newRole);
    if (newRole === null) {
      localStorage.removeItem('debug_role');
    } else {
      localStorage.setItem('debug_role', newRole);
    }
  }, []);

  const effectiveRole = debugRole ?? role;

  const refreshRole = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    await fetchRole(currentUser.id, setRole);
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
        await fetchRole(session.user.id, setRole);
      } else {
        setRole(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, role, effectiveRole, setDebugRole, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
