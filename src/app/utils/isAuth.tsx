"use client";

import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./../lib/supabase/supabase";

// Definir el tipo del contexto
interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

// Crear el contexto con valores iniciales
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
});

// Proveedor del contexto
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      setIsLoggedIn(!!data.user);
      setIsLoading(false);
    };

    checkUser();

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para consumir el contexto
export const useAuth = () => useContext(AuthContext);
