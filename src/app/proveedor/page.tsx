"use client";

import CreatePost from "../../shared/components/createPost/createPost";
import Dashboard from "../../shared/components/dashboard/dashboard";
import ProtectedRoute from "../utils/protectedRoute";

const Proveedor = () => {
  return (
    <section>
      <article className='container'>
        <div className='p-4 sm:p-6 animate-fadeInUp'>
          <h1 className='text-4xl pb-4'>Encontrá al cliente ideal</h1>
          <h2 className='text-3xl caveat'>
            Creá tu post con el proyecto que estas ofreciendo
          </h2>
        </div>
      </article>
      <CreatePost />
      <Dashboard />
    </section>
  );
};

export default ProtectedRoute(Proveedor);
