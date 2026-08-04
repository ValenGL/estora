"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "../alert/alert";
import Button from "../button/button";
import { supabase } from "./../../../app/lib/supabase/supabase";
import { login } from "./../../../app/lib/supabase/supabase_manage";
import { useAuth } from "./../../../app/utils/isAuth";

import "./loginForm.scss";

const RECAPTCHA_SITE_KEY = "6LfEX3QtAAAAAG6arHcjbcMh4aFHPw8IF5ZudC5X";

declare global {
  interface Window {
    google?: any;
    handleSignInWithGoogle: (response: any) => void;
    grecaptcha: {
      enterprise: {
        ready: (cb: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const nonceRef = useRef<string | null>(null);
  const { isLoggedIn, role } = useAuth();

  useEffect(() => {
    if (isLoggedIn && role !== "pending") router.push("/inicio");
  }, [isLoggedIn, role, router]);

  const handleGoogleSignIn = useCallback(
    async (response: any) => {
      const { credential } = response;

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
        nonce: nonceRef.current ?? undefined,
      });

      if (error) {
        console.error("Error al iniciar sesión con Google:", error.message);
        setError("Error al iniciar sesión con Google.");
      } else {
        console.log("Usuario autenticado con Google:", data);
        router.push("/inicio");
      }
    },
    [router]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).handleSignInWithGoogle = handleGoogleSignIn;

    const setupNonce = async () => {
      const nonce = btoa(
        String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
      );
      nonceRef.current = nonce;

      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(nonce)
      );
      const hashedNonce = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: (window as any).handleSignInWithGoogle,
          nonce: hashedNonce,
        });
        window.google.accounts.id.prompt();
      } else {
        const el = document.getElementById("g_id_onload");
        if (el) el.setAttribute("data-nonce", hashedNonce);
      }
    };

    setupNonce();
  }, [handleGoogleSignIn]);

  function handleRegister() {
    router.push("/registro");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setEmailError("Email is not valid.");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      await new Promise<void>((resolve) => window.grecaptcha.enterprise.ready(resolve));
      const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action: "LOGIN" });

      const verify = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'LOGIN' }),
      });
      if (!verify.ok) {
        const errData = await verify.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || 'Bot verification failed. Please try again.');
      }

      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='flex flex-col justify-center u-bgcolor-estora-dark shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] p-6 m-4 sm:m-6 sm:px-12 rounded-2xl'>
      <div className='pb-4'>
        <h3 className='text-2xl'>Sign in</h3>
      </div>

      {error && (
        <Alert classNames='mb-4' type='danger' closable>
          <span>{error}</span>
        </Alert>
      )}

      <form className='flex flex-col' onSubmit={handleSubmit}>
        <div className='grid relative py-2'>
          <label className='pr-4 pb-2' htmlFor='email'>
            <span>Email</span>
          </label>
          <input
            className='px-3 py-1 border border-gray-300 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100'
            id='email'
            type='email'
            required
            placeholder='Insert your email'
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            disabled={loading}
          />
          {emailError && (
            <span className='absolute bottom-0 animate-fadeInDown text-red-500 text-sm'>
              {emailError}
            </span>
          )}
        </div>

        <div className='grid relative py-2'>
          <label className='pr-4 pb-2' htmlFor='password'>
            <span>Password</span>
          </label>
          <input
            className='px-3 py-1 mb-8 lg:mb-5 border border-gray-300 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100'
            id='password'
            type='password'
            required
            placeholder='Insert your password'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            disabled={loading}
          />
          {passwordError && (
            <span className='absolute bottom-0 animate-fadeInDown text-red-500 text-sm'>
              {passwordError}
            </span>
          )}
        </div>

        <div className='flex my-4'>
          <Button
            text={loading ? "Starting..." : "Enter"}
            version={loading ? "disabled" : "outlined"}
            block
            type='submit'
          />

          <div
            id='g_id_onload'
            data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
            data-context='signin'
            data-ux_mode='popup'
            data-callback='handleSignInWithGoogle'
            data-auto_select='true'
            data-itp_support='true'
          ></div>

          <div
            className='g_id_signin flex items-center'
            data-type='icon'
            data-shape='square'
            data-theme='outline'
            data-text='signin_with'
            data-size='medium'
          ></div>
        </div>
      </form>

      <div className='mb-4'>
        <Button
          text="Don't have an account?"
          version='outlined'
          block
          onClick={handleRegister}
        />
      </div>
    </section>
  );
};

export default LoginForm;
