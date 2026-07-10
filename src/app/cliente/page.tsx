"use client";

import Dashboard from "../../shared/components/dashboard/dashboard";
import ProtectedRoute from "../utils/protectedRoute";

const Garper = () => {
  return (
    <section>
      <article className='container'>
        <div className='p-4 sm:p-6 animate-fadeInUp'>
          <h1 className='text-4xl pb-4'>Tablero de anuncios</h1>
          <h2 className='text-3xl caveat'>
            Encontrá el trabajo que estas buscando
          </h2>
        </div>
      </article>
      <Dashboard hasFilters />
    </section>
  );
};

export default ProtectedRoute(Garper);
