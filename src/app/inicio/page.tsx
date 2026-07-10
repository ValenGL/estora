"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../../shared/components/button/button";
import Dashboard from "../../shared/components/dashboard/dashboard";
import Ecosystem from "../../shared/components/ecosystem/ecosystem";
import { supabase } from "./../lib/supabase/supabase";
import { logout } from "./../lib/supabase/supabase_manage";
import ProtectedRoute from "./../utils/protectedRoute";

// LogoutButton Component
function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    logout()
      .then(() => console.log("Logout successful"))
      .catch((error) => console.error("Logout failed:", error));
    router.push("/");
  };

  return (
    <div className='flex justify-end items-center'>
      <Button
        version='outlined'
        text='Cerrar sesión'
        type='button'
        onClick={handleLogout}
      />
    </div>
  );
}

// AccountButton Component
function AccountButton() {
  const router = useRouter();

  const handleAccountNavigation = () => {
    router.push("/cuenta"); // Redirect to account page
  };

  return (
    <div className='flex justify-end items-center'>
      <Button
        version='text'
        text='Mi cuenta'
        type='button'
        onClick={handleAccountNavigation}
      />
    </div>
  );
}

// Define the Home component with proper TypeScript typing
const Home = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const getInitialUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser(); // Get the authenticated user
        if (error) {
          console.error("Error fetching user:", error);
          return;
        }
        const userEmail = data?.user?.email || null; // Safely access email
        setCurrentUser(userEmail);
      } catch (err) {
        console.error("Unexpected error fetching user:", err);
      }
    };

    getInitialUser();
  }, []);

  return (
    <>
      <section className='p-4 sm:p-6 animate-fadeInUp'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between'>
          <div className='flex flex-row items-start gap-x-4'>
            <h2 className='sm:text-4xl mb-2 caveat'>Bienvenido:</h2>
            <span className='sm:text-3xl mb-2'>
              {currentUser || "Cargando..."}
            </span>
          </div>
          <div className='flex pt-4 gap-x-4'>
            <AccountButton />
            <LogoutButton />
          </div>
        </div>
      </section>
      <Dashboard shortDashboard dashboardLink hasRefresh />
      <Ecosystem />
    </>
  );
};

export default ProtectedRoute(Home);
