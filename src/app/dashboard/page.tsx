"use client";

import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../../shared/components/loader/loader";
import SellerCard from "../../shared/components/sellerCard/sellerCard";
import { getAllSellers, deleteSeller } from "../lib/supabase/sellers";
import type { Seller } from "../lib/types";
import { sanitizeForBuyer } from "../lib/utils/sanitize";
import ProtectedRoute from "../utils/protectedRoute";
import { useAuth } from "../utils/isAuth";

const DashboardPage = () => {
  const { effectiveRole } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const isBroker = effectiveRole === 'broker';

  const displaySellers = isBuyer ? sellers.map(sanitizeForBuyer) : sellers;

  const handleDelete = async (id: string) => {
    try {
      await deleteSeller(id);
      setSellers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to delete listing.');
    }
  };

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">All Listings</h1>
        {!loading && (
          <span className="text-sm opacity-60 font-medium">
            {sellers.length} {sellers.length === 1 ? 'listing' : 'listings'}
          </span>
        )}
        {isBroker && (
          <button
            className="ml-auto text-sm px-4 py-2 rounded-lg border border-white/20 hover:border-white/50 transition-colors"
            onClick={() => router.push('/brokerage/listings/new')}
            type="button"
          >
            New listing
          </button>
        )}
      </div>

      {isBuyer && (
        <div className="mb-6 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm">
          You are viewing anonymized listings. Request access to unlock full details.
        </div>
      )}

      {loading && <Loader block />}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && sellers.length === 0 && (
        <p className="opacity-60">No listings available yet.</p>
      )}

      {!loading && !error && sellers.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displaySellers.map((seller) => (
            <SellerCard
              key={seller.id}
              seller={seller}
              blurred={isBuyer}
              onEdit={isBroker ? () => router.push(`/brokerage/listings/${seller.id}/edit`) : undefined}
              onDelete={isBroker ? () => handleDelete(seller.id) : undefined}
            />
          ))}
        </div>
      )}

    </section>
  );
};

export default ProtectedRoute(DashboardPage);
