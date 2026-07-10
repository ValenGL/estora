"use client";

import AboutSection from "../../shared/components/aboutSection/aboutSection";
import BigDivider from "../../shared/components/bigDivider/bigDivider";

const Estora = () => {
  return (
    <section className='mhWrapper flex-col'>
      <article className='container'>
        <div className='p-4 sm:p-6 animate-fadeInUp'>
          <h1 className='text-4xl pb-4'>Quiénes somos.</h1>
          <h2 className='text-3xl caveat'>
            Y por qué elegimos conectar ofertas y demandas de forma simple.
          </h2>
        </div>
      </article>
      <AboutSection
        title='Pablo ofrece su negocio'
        text='Publica su proyecto o servicio en el tablero.'
        img='1'
      />
      <BigDivider />
      <AboutSection
        title='Marcelo busca un proyecto establecido'
        text='Encuentra oportunidades de inversion rentables.'
        img='2'
        inverted
      />
    </section>
  );
};

export default Estora;
