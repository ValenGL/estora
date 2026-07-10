"use client";

import Image from "next/image";

import { Button } from "../../stories/button/Button";

const Privacidad = () => {
  return (
    <article className='container select-none p-4'>
      {/* hero */}
      <section className='flex flex-col lg:flex-cols-2'>
        <div className='pb-4'>
          <h1 className='text-4xl pb-4'>Centro de privacidad Estora</h1>
          <p className='pb-4'>
            En Estora usamos y protegemos tus datos personales para mejorar
            nuestros servicios y ofrecerte una experiencia personalizada.
          </p>
          <div>
            <ul className='flex gap-4'>
              <li className='font-semibold'>
                - Administrá el uso de tus datos
              </li>
              <li className='font-semibold'>- Conocé tus derechos</li>
            </ul>
          </div>
        </div>
        <div className='flex justify-center p-4'>
          <Image
            src={`/assets/images/Privacidad-hero.svg`}
            loading='lazy'
            height={350}
            width={350}
            alt='Privacidad'
          />
        </div>
      </section>
      {/* Datos personales */}
      <section className='pb-4'>
        <div>
          <h2 className='text-3xl pb-4 underline'>
            Gestioná tus datos personales
          </h2>
          <p className='pb-4'>
            Podés acceder, revisar, actualizar y corregir tus datos personales.
          </p>
        </div>
        <dl>
          <dt className='text-xl pb-4'>Modificá o corregí tus datos</dt>
          <dd className='pb-4'>
            - Mantener actualizados tus datos personales nos permite ofrecerte
            una experiencia personalizada, garantizar el uso correcto de
            nuestras plataformas y el cumplimiento de las regulaciones vigentes.
          </dd>
          <dd className='pb-4 '>
            - Todos los datos personales que nos das tienen que ser exactos y
            verídicos para evitar la suspensión en los servicios que te
            ofrecemos o la inhabilitación de tu cuenta.
          </dd>
          <dt className='flex text-xl pb-4'>
            Integramos tus datos en nuestras plataformas
          </dt>
          <dd className='pb-4 '>
            - Buscamos que convertirte en Garper o publicar un laburo, sea
            rápido y fácil en todo nuestro ecosistema.
          </dd>
        </dl>

        <Button
          text='Gestionar tus datos'
          version='primary'
          color='black'
          type='button'
        />
      </section>
      <section className='pb-4'>
        <div>
          <h2 className='text-3xl pb-4 underline'>
            Configurá tus preferencias
          </h2>
          <p className='pb-4'>
            Podés controlar tu experiencia mediante la configuración de los
            permisos de privacidad. Habilitar estas opciones nos permite
            mostrarte trabajos relevantes según tus necesidades.
          </p>
          <p className='pb-4 '>
            Cómo funcionan las recomendaciones que aparecen en tu cuenta:
          </p>
        </div>
        <dl>
          <dt className='flex text-xl pb-4'>Personalizan tu experiencia</dt>
          <dd className='pb-4 '>
            Te damos recomendaciones útiles de trabajos de acuerdo a la
            información de tus últimas búsquedas y favoritos.
          </dd>
          <dt className='flex text-xl pb-4'>
            Nos ayudan a mejorar nuestros servicios
          </dt>
          <dd className='pb-8 '>
            Cierta información sobre tu actividad cuando navegás nuestro sitio,
            nos permite analizar tus preferencias para mejorar nuestros
            servicios o crear nuevas soluciones.
          </dd>
        </dl>
        <div>
          <Button
            text='Configurar preferencias'
            version='primary'
            type='button'
            color='black'
          />
        </div>
      </section>
      {/* Cookies */}
      <section className='pb-4'>
        <div>
          <h2 className='text-3xl pb-4 underline'>Cómo usamos las cookies</h2>
          <div className=''>
            <p className='pb-4'>
              Las cookies nos permiten conocer cómo navegás nuestras páginas y
              mantener su funcionamiento. Con esta información, hacemos que sea
              más fácil, rápido y seguro usar tu cuenta.
            </p>
            <p className='pb-4'>
              Si desactivás ciertas cookies, es posible que no puedas disfrutar
              de algunas funcionalidades de nuestros sitios.
            </p>
          </div>
        </div>
        {/* board */}
        <div className='grid mb-4 grid-cols-2 p-4 rounded-2xl u-bgcolor-estora-white select-none text-black'>
          <div className='flex flex-col items-center text-center'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              height='24px'
              viewBox='0 -960 960 960'
              width='24px'
              className='mb-2'
            >
              <path d='M220-80q-24.75 0-42.37-17.63Q160-115.25 160-140v-434q0-24.75 17.63-42.38Q195.25-634 220-634h70v-96q0-78.85 55.61-134.42Q401.21-920 480.11-920q78.89 0 134.39 55.58Q670-808.85 670-730v96h70q24.75 0 42.38 17.62Q800-598.75 800-574v434q0 24.75-17.62 42.37Q764.75-80 740-80H220Zm0-60h520v-434H220v434Zm260.17-140q31.83 0 54.33-22.03T557-355q0-30-22.67-54.5t-54.5-24.5q-31.83 0-54.33 24.5t-22.5 55q0 30.5 22.67 52.5t54.5 22ZM350-634h260v-96q0-54.17-37.88-92.08-37.88-37.92-92-37.92T388-822.08q-38 37.91-38 92.08v96ZM220-140v-434 434Z' />
            </svg>
            <h3 className='text-xl font-bold'>Facilitan tu experiencia</h3>
            <p className='hidden md:flex px-4'>
              Recordamos tus datos para un ingreso fácil y rápido desde tus
              dispositivos habituales.
            </p>
          </div>
          <div className='flex flex-col items-center text-center'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              height='24px'
              viewBox='0 -960 960 960'
              width='24px'
              className='mb-2'
            >
              <path d='M260-40q-24.75 0-42.37-17.63Q200-75.25 200-100v-760q0-24.75 17.63-42.38Q235.25-920 260-920h440q24.75 0 42.38 17.62Q760-884.75 760-860v760q0 24.75-17.62 42.37Q724.75-40 700-40H260Zm0-90v30h440v-30H260Zm0-700h440v-30H260v30Zm220 530q-59.54 0-115.77 18T260-235v45h440v-45q-48-29-104.23-47-56.23-18-115.77-18Zm0-60q60 0 115.5 15.5T700-302v-468H260v468q50-27 105-42.5T480-360Zm.76-63Q529-423 563-456.76q34-33.77 34-82Q597-587 563.24-621q-33.77-34-82-34Q433-655 399-621.24q-34 33.77-34 82Q365-491 398.76-457q33.77 34 82 34Zm.24-60q-23 0-39.5-16.5T425-539q0-23 16.5-39.5T481-595q23 0 39.5 16.5T537-539q0 23-16.5 39.5T481-483Zm-1 293h220-440 220Zm1-349Zm-1-291Zm0 700Z' />
            </svg>
            <h3 className='text-xl font-bold'>Más seguridad</h3>
            <p className='hidden md:flex pl-2'>
              Refuerzan la seguridad de nuestro sitio y protegen a tu cuenta de
              posibles ataques maliciosos.
            </p>
          </div>
        </div>
        <div className='flex space-x-6'>
          <div>
            <Button
              text='Configurar cookies'
              version='primary'
              type='button'
              color='black'
            />
          </div>
          <div>
            <Button text='Conocer más' version='text' type='button' />
          </div>
        </div>
      </section>
    </article>
  );
};

export default Privacidad;
