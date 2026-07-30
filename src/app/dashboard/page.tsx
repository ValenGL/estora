"use client";

import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../../shared/components/loader/loader";
import SellerCard from "../../shared/components/sellerCard/sellerCard";
import { getAllSellers } from "../lib/supabase/sellers";
import type { Seller } from "../lib/types";
import { sanitizeForBuyer } from "../lib/utils/sanitize";
import ProtectedRoute from "../utils/protectedRoute";
import { useAuth } from "../utils/isAuth";

const DashboardPage = () => {
  const { effectiveRole } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role guard: seller and pending roles have no business here
  if (effectiveRole === 'seller' || effectiveRole === 'pending') {
    redirect('/inicio');
  }

  useEffect(() => {
    getAllSellers()
      .then(setSellers)
      .catch(() => setError('Failed to load listings. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const isBuyer = effectiveRole === 'buyer';

  const displaySellers = isBuyer
    ? sellers.map(sanitizeForBuyer)
    : sellers;

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">All Listings</h1>
        {!loading && (
          <span className="text-sm opacity-60 font-medium">
            {sellers.length} {sellers.length === 1 ? 'listing' : 'listings'}
          </span>
        )}
      </div>

      {/* Buyer notice banner */}
      {isBuyer && (
        <div className="mb-6 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm">
          You are viewing anonymized listings. Request access to unlock full details.
        </div>
      )}

      {/* Loading state */}
      {loading && <Loader block />}

      {/* Error state */}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {/* Empty state */}
      {!loading && !error && sellers.length === 0 && (
        <p className="opacity-60">No listings available yet.</p>
      )}

      {/* Grid */}
      {!loading && !error && sellers.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displaySellers.map((seller) => (
            <SellerCard
              key={seller.id}
              seller={seller}
              blurred={isBuyer}
            />
          ))}
        </div>
      )}

    </section>
  );
};

export default ProtectedRoute(DashboardPage);
