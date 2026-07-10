"use client";

import { useEffect, useState } from "react";
import Dashboard from "../../shared/components/dashboard/dashboard";
import Profile from "../../shared/components/profile/profile";
import PushNotificationManager from "./../../shared/components/pushNotificationManager/pushNotificationManager";
import { supabase } from "./../lib/supabase/supabase";

const Account: any = () => {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  return (
    <section className='mhWrapper flex-col'>
      <article className='container'>
        <div className='p-4 sm:p-6 animate-fadeInUp'>
          <h1 className='text-4xl pb-4'>Mi cuenta.</h1>
          <h2 className='text-3xl caveat'>Acá podes gestionar tus posts.</h2>
        </div>
      </article>
      <Profile />
      <Dashboard ownDashboard />
      <PushNotificationManager userId={userId} />
    </section>
  );
};

export default Account;
