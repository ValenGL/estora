// src/app/page.tsx
"use client";

import Script from "next/script";
import Dashboard from "./../shared/components/dashboard/dashboard";
import Ecosystem from "./../shared/components/ecosystem/ecosystem";
import Hero from "./../shared/components/hero/hero";
import InstallPrompt from "./../shared/components/installPrompt/installPrompt";
import LoginForm from "./../shared/components/loginForm/loginForm";

export default function Root() {
  return (
    <>
      <InstallPrompt />
      <Script
        src='https://accounts.google.com/gsi/client'
        strategy='lazyOnload'
      />
      <section className='grid lg:grid-cols-2'>
        <Hero />
        <LoginForm />
      </section>
      <Ecosystem />
      <Dashboard shortDashboard />
    </>
  );
}
