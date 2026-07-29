"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useRouter } from "next/navigation";
import { RefObject, useRef, useState } from "react";
import { signup } from "./../../../app/lib/supabase/supabase_manage";
import Button from "./../button/button";
import Modal from "./../modal/modal";

const RegisterForm: React.FC = () => {
  const router = useRouter();

  const emailRef: RefObject<HTMLInputElement> = useRef(null);
  const passwordRef: RefObject<HTMLInputElement> = useRef(null);
  const passwordConfirmRef: RefObject<HTMLInputElement> = useRef(null);

  const [error, setError] = useState("");
  const [confirmEmailDialog, setConfirmEmailDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<any>(null);

  const handleVerify = (token: string) => {
    setCaptchaToken(token);
  };

  function handleAlreadyRegister() {
    router.push("/");
  }

  const closeModal = () => {
    setConfirmEmailDialog(false);
    router.push("/");
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

      // username defaults to email prefix; role selection rebuilt in Sprint 2
      const username = email.split("@")[0];
      await signup(email, password, username, "buyer", captchaToken ?? undefined);

      setConfirmEmailDialog(true);
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
      <h1 className='clipped'>Registrarse</h1>
      <h2 className='text-4xl sm:text-6xl caveat'>
        Queremos que seas parte del futuro.
      </h2>
      <section className='u-bgcolor-estora-dark shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] my-6 p-6 rounded-2xl'>
        <div className='pb-4'>
          <h3 className='text-2xl'>Registrar usuario en ESTORA</h3>
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
              placeholder='Ingresá tu correo electrónico'
              ref={emailRef}
              disabled={loading}
            />
          </div>
          <div className='grid pb-2'>
            <label className='pr-4' htmlFor='password'>
              <span>Contraseña</span>
            </label>
            <input
              className='px-3 py-1 border border-gray-300 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100 sm:col-span-3'
              id='password'
              type='password'
              required
              placeholder='Ingresá tu contraseña'
              ref={passwordRef}
              disabled={loading}
            />
          </div>
          <div className='grid pb-2'>
            <label className='pr-4' htmlFor='confirmPassword'>
              <span>Confirmar contraseña</span>
            </label>
            <input
              className='px-3 py-1 border border-gray-300 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100 sm:col-span-3'
              id='confirmPassword'
              type='password'
              required
              placeholder='Volvé a ingresar tu contraseña'
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
              text={loading ? "Registrando..." : "Registrarme"}
              version={loading ? "disabled" : "outlined"}
              block
              type='submit'
            />
          </div>
        </form>
        <div className='mb-4'>
          <Button
            text='Ya tengo cuenta'
            version='outlined'
            block
            onClick={handleAlreadyRegister}
          />
        </div>
      </section>

      {confirmEmailDialog && (
        <Modal onClose={closeModal}>
          <div className='p-4 u-color-estora-black'>
            <p>
              Te llegará un correo de confirmación pronto, por favor valida tu
              mail.
            </p>
            <div className='flex items-center pt-4'>
              <Button
                version='secondary'
                color='white'
                text='Ya lo confirmé'
                onClick={closeModal}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RegisterForm;
