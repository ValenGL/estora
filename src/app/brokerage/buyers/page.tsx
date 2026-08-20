"use client";

import { redirect, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Loader from "../../../shared/components/loader/loader";
import { useBuyerFilters } from "../../../shared/hooks/useBuyerFilters";
import { getAllBuyers } from "../../lib/supabase/buyers";
import type { Buyer, BuyerSource } from "../../lib/types";
import { useAuth } from "../../utils/isAuth";
import ProtectedRoute from "../../utils/protectedRoute";

function formatMoney(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

const CATEGORIES = [
  'PE / Institutional',
  'Strategic / Industry',
  'Search Fund',
  'Family Office',
  'Independent Sponsor',
  'Holding Company',
  'Buy-Side Broker',
  'Individual / Operator',
  'Unknown',
];

const SOURCE_LABEL: Record<BuyerSource, string> = {
  onboarding: 'Self-registered',
  first_migration: 'Imported',
};

const PAGE_SIZE_OPTIONS = [10, 50, 100] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

const BuyersPage = () => {
  const { effectiveRole } = useAuth();
  const router = useRouter();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);

  if (effectiveRole !== 'broker' && effectiveRole !== null) {
    redirect('/inicio');
  }

  useEffect(() => {
    getAllBuyers()
      .then(setBuyers)
      .catch(() => setError('Failed to load buyers.'))
      .finally(() => setLoading(false));
  }, []);

  const { filtered, filters, setFilter, resetFilters, isFiltered } = useBuyerFilters(buyers);

  // Reset to page 1 whenever filters or page size change
  useEffect(() => { setPage(1); }, [filtered.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const countLabel = isFiltered
    ? `${filtered.length} of ${buyers.length} buyers`
    : `${buyers.length} buyers`;

  return (
    <section className="ph-4 sm:ph-6 animate-fadeInUp">

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Buyers</h1>
        {!loading && (
          <span className="text-sm opacity-60 font-medium">{countLabel}</span>
        )}
      </div>

      {!loading && (
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text"
            placeholder="Search by name…"
            className="listing-filters-input px-3 py-2 rounded-lg border border-white/20 bg-transparent text-sm focus:outline-none focus:border-white/50"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
          <select
            className="listing-filters-select"
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="listing-filters-select"
            value={filters.businessType}
            onChange={(e) => setFilter('businessType', e.target.value)}
          >
            <option value="">All types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="both">Both</option>
          </select>
          <select
            className="listing-filters-select"
            value={filters.roofingQualified}
            onChange={(e) => setFilter('roofingQualified', e.target.value)}
          >
            <option value="">All roofing status</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Possible">Possible</option>
            <option value="No">No</option>
          </select>
          <select
            className="listing-filters-select"
            value={filters.source}
            onChange={(e) => setFilter('source', e.target.value)}
          >
            <option value="">All sources</option>
            <option value="first_migration">Imported</option>
            <option value="onboarding">Self-registered</option>
          </select>
          {isFiltered && (
            <button
              className="listing-filters-clear text-xs opacity-60 hover:opacity-100 underline"
              onClick={resetFilters}
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {loading && <Loader block />}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!loading && !error && buyers.length === 0 && (
        <p className="opacity-60">No buyers yet.</p>
      )}

      {!loading && !error && buyers.length > 0 && filtered.length === 0 && (
        <p className="opacity-60">No buyers match the current filters.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left opacity-50 uppercase text-xs tracking-wider border-b border-white/10">
                  <th className="pb-2 pr-4 font-medium">Organization</th>
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Roofing</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Revenue target</th>
                  <th className="pb-2 pr-4 font-medium">EBITDA target</th>
                  <th className="pb-2 pr-4 font-medium">HQ</th>
                  <th className="pb-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((buyer) => (
                  <tr
                    key={buyer.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => router.push(`/brokerage/buyers/${buyer.id}`)}
                  >
                    <td className="py-3 pr-4 font-medium">{buyer.organization_name}</td>
                    <td className="py-3 pr-4 opacity-70 text-xs">{buyer.buyer_category ?? '—'}</td>
                    <td className="py-3 pr-4">
                      {buyer.roofing_qualified === 'Confirmed' && (
                        <span className="text-green-400 text-xs font-medium">Confirmed</span>
                      )}
                      {buyer.roofing_qualified === 'Possible' && (
                        <span className="text-amber-400 text-xs font-medium">Possible</span>
                      )}
                      {buyer.roofing_qualified === 'No' && (
                        <span className="opacity-40 text-xs">No</span>
                      )}
                      {!buyer.roofing_qualified && <span className="opacity-30">—</span>}
                    </td>
                    <td className="py-3 pr-4 opacity-70 text-xs">{buyer.business_type ?? '—'}</td>
                    <td className="py-3 pr-4 opacity-70">
                      {buyer.revenue_min !== null || buyer.revenue_max !== null
                        ? `${formatMoney(buyer.revenue_min)} – ${formatMoney(buyer.revenue_max)}`
                        : <span className="opacity-40">—</span>}
                    </td>
                    <td className="py-3 pr-4 opacity-70">
                      {buyer.ebitda_min !== null || buyer.ebitda_max !== null
                        ? `${formatMoney(buyer.ebitda_min)} – ${formatMoney(buyer.ebitda_max)}`
                        : <span className="opacity-40">—</span>}
                    </td>
                    <td className="py-3 pr-4 opacity-70">{buyer.hq_state ?? '—'}</td>
                    <td className="py-3 opacity-50 text-xs">{SOURCE_LABEL[buyer.source]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between my-4 text-sm">
            <div className="flex items-center gap-2 opacity-60">
              <span>Show</span>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`px-2 py-0.5 rounded text-xs border transition-colors ${pageSize === size ? 'border-white/50 opacity-100' : 'border-white/20 hover:border-white/40'}`}
                  onClick={() => setPageSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="opacity-40 text-xs">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page === 1}
                className="px-3 py-1 rounded border border-white/20 text-xs disabled:opacity-20 hover:border-white/40 transition-colors"
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-white/20 text-xs disabled:opacity-20 hover:border-white/40 transition-colors"
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

    </section>
  );
};

export default ProtectedRoute(BuyersPage);
