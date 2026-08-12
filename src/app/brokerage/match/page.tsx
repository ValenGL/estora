"use client";

import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loader from '../../../shared/components/loader/loader';
import MatchView from '../../../shared/components/matchView/matchView';
import { getAllBuyers } from '../../lib/supabase/buyers';
import { getAllSellers } from '../../lib/supabase/sellers';
import type { Buyer, Seller } from '../../lib/types';
import { useAuth } from '../../utils/isAuth';
import ProtectedRoute from '../../utils/protectedRoute';

const MatchPage = () => {
  const { effectiveRole } = useAuth();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role is still loading — do not fetch or redirect yet.
  // Role is confirmed non-broker — redirect.
  // Role is confirmed broker — proceed to fetch below.
  if (effectiveRole !== null && effectiveRole !== 'broker') {
    redirect('/inicio');
  }

  useEffect(() => {
    // Only fetch when the role is confirmed as broker.
    // When effectiveRole is null (still loading) this block is skipped,
    // preventing seller-identifying data from leaking to non-broker users.
    if (effectiveRole !== 'broker') return;

    Promise.all([getAllBuyers(), getAllSellers()])
      .then(([b, s]) => { setBuyers(b); setSellers(s); })
      .catch(() => setError('Failed to load data. Please refresh.'))
      .finally(() => setLoading(false));
  }, [effectiveRole]);

  // While role is being resolved, show loader with no data fetched.
  if (effectiveRole === null) {
    return <Loader block />;
  }

  return (
    <section className="ph-4 sm:ph-6 animate-fadeInUp" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-3xl font-bold">Match</h1>
        {!loading && (
          <span className="text-sm opacity-60">
            {buyers.length} buyers · {sellers.length} sellers
          </span>
        )}
      </div>

      {loading && <Loader block />}
      {error && (
        <div className="flex items-center gap-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            type="button"
            className="text-xs underline opacity-70"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !error && <MatchView buyers={buyers} sellers={sellers} />}
    </section>
  );
};

export default ProtectedRoute(MatchPage);
