"use client";

import Dashboard from "../../shared/components/dashboard/dashboard";
import ProtectedRoute from "../utils/protectedRoute";

const Buyer = () => {
  return (
    <section>
      <article className='container'>
        <div className='p-4 sm:p-6 animate-fadeInUp'>
          <h1 className='text-4xl pb-4'>Business Dashboard</h1>
          <h2 className='text-3xl caveat'>
            Find the perfect business for you
          </h2>
        </div>
      </article>
      <Dashboard hasFilters />
    </section>
  );
};

export default ProtectedRoute(Buyer);
