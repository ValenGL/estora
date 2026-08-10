"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "../utils/isAuth";
import { getAllSellers, deleteSeller } from "../lib/supabase/sellers";
import type { Seller } from "../lib/types";
import Loader from "../../shared/components/loader/loader";
import ListingFiltersBar from "../../shared/components/listingFilters/listingFilters";
import { useListingFilters } from "../../shared/hooks/useListingFilters";
import ProtectedRoute from "../utils/protectedRoute";

function formatMoney(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

const STATUS_LABEL: Record<Seller['status'], string> = {
  active: 'Available',
  under_nda: 'Under NDA',
  sold: 'Sold',
  inactive: 'Inactive',
};

const STATUS_COLOR: Record<Seller['status'], string> = {
  active: 'text-green-400',
  under_nda: 'text-amber-400',
  sold: 'text-gray-400',
  inactive: 'text-gray-500',
};

const BrokeragePage = () => {
  const { effectiveRole } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (effectiveRole !== 'broker' && effectiveRole !== null) {
    redirect('/inicio');
  }

  useEffect(() => {
    getAllSellers()
      .then(setSellers)
      .catch(() => setError('Failed to load listings.'))
      .finally(() => setLoading(false));
  }, []);

  const { filtered, filters, setFilter, resetFilters, isFiltered } = useListingFilters(sellers);

  const handleDelete = async (id: string) => {
    try {
      await deleteSeller(id);
      setSellers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to delete listing.');
    } finally {
      setDeletingId(null);
    }
  };

  const countLabel = isFiltered
    ? `${filtered.length} of ${sellers.length} ${sellers.length === 1 ? 'listing' : 'listings'}`
    : `${sellers.length} ${sellers.length === 1 ? 'listing' : 'listings'}`;

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Listings</h1>
        {!loading && (
          <span className="text-sm opacity-60 font-medium">{countLabel}</span>
        )}
        <button
          className="ml-auto text-sm px-4 py-2 rounded-lg border border-white/20 hover:border-white/50 transition-colors"
          onClick={() => router.push('/brokerage/listings/new')}
          type="button"
        >
          New listing
        </button>
      </div>

      {!loading && (
        <ListingFiltersBar
          filters={filters}
          setFilter={setFilter}
          resetFilters={resetFilters}
          isFiltered={isFiltered}
          mode="full"
        />
      )}

      {loading && <Loader block />}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!loading && !error && sellers.length === 0 && (
        <div className="opacity-60">
          <p>No listings yet.</p>
          <button className="underline text-sm mt-1" onClick={() => router.push('/brokerage/listings/new')} type="button">
            Create your first listing
          </button>
        </div>
      )}

      {!loading && !error && sellers.length > 0 && filtered.length === 0 && (
        <p className="opacity-60">No listings match the current filters.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-50 uppercase text-xs tracking-wider border-b border-white/10">
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">State</th>
                <th className="pb-2 pr-4 font-medium">Revenue</th>
                <th className="pb-2 pr-4 font-medium">EBITDA</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((seller) => (
                <tr key={seller.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4 font-medium">{seller.company_name}</td>
                  <td className="py-3 pr-4 opacity-70">{seller.state ?? '—'}</td>
                  <td className="py-3 pr-4">{formatMoney(seller.annual_revenue)}</td>
                  <td className="py-3 pr-4">{formatMoney(seller.ebitda)}</td>
                  <td className={`py-3 pr-4 font-medium ${STATUS_COLOR[seller.status]}`}>
                    {STATUS_LABEL[seller.status]}
                  </td>
                  <td className="py-3">
                    {deletingId === seller.id ? (
                      <span className="flex items-center gap-2">
                        <span className="text-xs opacity-60">Delete?</span>
                        <button
                          className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                          onClick={() => handleDelete(seller.id)}
                          type="button"
                        >
                          Confirm
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded border border-white/20 hover:border-white/50 transition-colors"
                          onClick={() => setDeletingId(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded border border-white/20 hover:border-white/50 transition-colors"
                          onClick={() => router.push(`/brokerage/listings/${seller.id}/edit`)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 hover:border-red-400 transition-colors"
                          onClick={() => setDeletingId(seller.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </section>
  );
};

export default ProtectedRoute(BrokeragePage);
