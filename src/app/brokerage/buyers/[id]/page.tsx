"use client";

import { redirect, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Loader from "../../../../shared/components/loader/loader";
import { getBuyerById } from "../../../lib/supabase/buyers";
import type { Buyer } from "../../../lib/types";
import { useAuth } from "../../../utils/isAuth";
import ProtectedRoute from "../../../utils/protectedRoute";

function formatMoney(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wider opacity-50">{label}</span>
      <p className="mt-0.5 font-medium">{value ?? <span className="opacity-30">—</span>}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs uppercase tracking-widest opacity-40 mb-4 pb-2 border-b border-white/10">
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        {children}
      </div>
    </div>
  );
}

const BuyerDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const { effectiveRole } = useAuth();
  const router = useRouter();
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (effectiveRole !== 'broker' && effectiveRole !== null) {
    redirect('/inicio');
  }

  useEffect(() => {
    getBuyerById(id)
      .then((b) => {
        if (!b) setFetchError('Buyer not found.');
        else setBuyer(b);
      })
      .catch(() => setFetchError('Failed to load buyer.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader block />;
  if (fetchError || !buyer) {
    return (
      <section className="ph-4 sm:ph-6 animate-fadeInUp">
        <p className="text-red-400">{fetchError ?? 'Buyer not found.'}</p>
        <button className="underline text-sm mt-2 opacity-60" onClick={() => router.push('/brokerage/buyers')} type="button">
          Back to buyers
        </button>
      </section>
    );
  }

  const revenueRange =
    buyer.revenue_min !== null || buyer.revenue_max !== null
      ? `${formatMoney(buyer.revenue_min)} – ${formatMoney(buyer.revenue_max)}`
      : null;

  const ebitdaRange =
    buyer.ebitda_min !== null || buyer.ebitda_max !== null
      ? `${formatMoney(buyer.ebitda_min)} – ${formatMoney(buyer.ebitda_max)}`
      : null;

  const employeeRange =
    buyer.employee_min !== null || buyer.employee_max !== null
      ? `${buyer.employee_min ?? '?'} – ${buyer.employee_max ?? '?'}`
      : null;

  return (
    <section className="ph-4 sm:ph-6 animate-fadeInUp max-w-3xl">

      <button
        className="text-xs opacity-50 hover:opacity-100 mb-6 transition-opacity"
        onClick={() => router.push('/brokerage/buyers')}
        type="button"
      >
        ← Back to buyers
      </button>

      <div className="flex items-start gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold leading-tight">{buyer.organization_name}</h1>
          {buyer.external_id && (
            <span className="text-xs opacity-40 mt-1 inline-block">{buyer.external_id}</span>
          )}
        </div>
        <div className="ml-auto flex gap-2 flex-shrink-0 pt-1">
          <span className="text-xs px-2 py-1 rounded-full border border-white/20 opacity-60">
            {buyer.source === 'first_migration' ? 'Imported' : 'Self-registered'}
          </span>
          {buyer.roofing_qualified === 'Confirmed' && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              Roofing confirmed
            </span>
          )}
          {buyer.roofing_qualified === 'Possible' && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Roofing possible
            </span>
          )}
        </div>
      </div>

      <Section title="Identity">
        <Field label="Category" value={buyer.buyer_category} />
        <Field label="HQ State" value={buyer.hq_state} />
        <Field label="Website" value={
          buyer.website
            ? <a href={`https://${buyer.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="underline opacity-70 hover:opacity-100">{buyer.website}</a>
            : null
        } />
      </Section>

      <Section title="Buy Box">
        <Field label="Revenue target" value={revenueRange} />
        <Field label="EBITDA target" value={ebitdaRange} />
        <Field label="Business type" value={buyer.business_type} />
        <Field label="Work type" value={buyer.work_type} />
        <Field label="Employees" value={employeeRange} />
        <Field label="Software" value={buyer.preferred_software} />
        <Field label="Management" value={buyer.management_preference} />
        <div className="col-span-2 sm:col-span-3">
          <span className="text-xs uppercase tracking-wider opacity-50">Target states</span>
          <p className="mt-0.5 font-medium text-sm">
            {buyer.target_states && buyer.target_states.length > 0
              ? buyer.target_states.length >= 50
                ? 'National (all states)'
                : buyer.target_states.join(', ')
              : <span className="opacity-30">—</span>}
          </p>
        </div>
      </Section>

      <Section title="Intelligence">
        <Field label="Roofing qualified" value={buyer.roofing_qualified} />
        <Field label="Engagement level" value={buyer.engagement_level} />
        <Field label="Buyer status" value={buyer.buyer_status} />
      </Section>

      {buyer.investment_thesis && (
        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-widest opacity-40 mb-3 pb-2 border-b border-white/10">
            Investment Thesis
          </h2>
          <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">
            {buyer.investment_thesis}
          </p>
        </div>
      )}

    </section>
  );
};

export default ProtectedRoute(BuyerDetailPage);
