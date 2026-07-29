"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "../alert/alert";
import Button from "../button/button";
import { supabase } from "./../../../app/lib/supabase/supabase";
import { useAuth } from "./../../../app/utils/isAuth";
import { login } from "./../../../app/lib/supabase/supabase_manage";

import "./loginForm.scss";

declare global {
  interface Window {
    google?: any;
    handleSignInWithGoogle: (response: any) => void;
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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<any>(null);
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

  const handleVerify = (token: string) => {
    setCaptchaToken(token);
  };

  function handleRegister() {
    router.push("/registro");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setEmailError("El correo no es válido.");
      return;
    }
    if (password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (!captchaToken) {
      setError("Por favor, completa el CAPTCHA.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password, captchaToken);
    } catch (err: any) {
      setError(
        err.message || "Error al iniciar sesión. Credenciales incorrectas."
      );
    } finally {
      setLoading(false);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  return (
    <section className='flex flex-col justify-center u-bgcolor-estora-dark shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] p-6 m-4 sm:m-6 sm:px-12 rounded-2xl'>
      <div className='pb-4'>
        <h3 className='text-2xl'>Iniciar sesión</h3>
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
            className='px-3 py-1 border border-gray-300 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100 sm:col-span-3'
            id='email'
            type='email'
            required
            placeholder='Ingresá tu correo electrónico'
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            disabled={loading}
          />
          {emailError && (
            <span className='absolute bottom-0 animate-fadeInDown text-red-5 00 text-sm'>
              {emailError}
            </span>
          )}
        </div>

        <div className='grid relative py-2 mb-4'>
          <label className='pr-4 pb-2' htmlFor='password'>
            <span>Contraseña</span>
          </label>
          <input
            className='px-3 py-1 mb-8 lg:mb-5 border border-gray-300 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100 sm:col-span-3'
            id='password'
            type='password'
            required
            placeholder='Ingresá tu contraseña'
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

        <div className='pb-4 flex justify-center'>
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            onVerify={handleVerify}
          />
        </div>

        <div className='flex my-4'>
          <Button
            text={loading ? "Iniciando..." : "Entrar"}
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
          text='No tengo cuenta'
          version='outlined'
          block
          onClick={handleRegister}
        />
      </div>
    </section>
  );
};

export default LoginForm;
