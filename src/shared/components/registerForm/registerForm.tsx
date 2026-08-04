"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { signup } from "./../../../app/lib/supabase/supabase_manage";
import Button from "./../button/button";

const RECAPTCHA_SITE_KEY = "6LfEX3QtAAAAAG6arHcjbcMh4aFHPw8IF5ZudC5X";

const RegisterForm: React.FC = () => {
  const router = useRouter();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    try {
      setLoading(true);
      setError("");

      await new Promise<void>((resolve) => window.grecaptcha.enterprise.ready(resolve));
      const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action: "REGISTER" });

      const verify = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'REGISTER' }),
      });
      if (!verify.ok) {
        const errData = await verify.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || 'Bot verification failed. Please try again.');
      }

      const username = email.split("@")[0];
      await signup(email, password, username, "pending");

      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
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
