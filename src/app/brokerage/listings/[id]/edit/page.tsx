"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "../../../../utils/isAuth";
import { getSellerById, updateSeller } from "../../../../lib/supabase/sellers";
import type { Seller } from "../../../../lib/types";
import type { BrokerSellerInput } from "../../../../lib/supabase/brokerSellers";
import ListingForm from "../../../../../shared/components/listingForm/listingForm";
import Loader from "../../../../../shared/components/loader/loader";
import ProtectedRoute from "../../../../utils/protectedRoute";

const EditListingPage = ({ params }: { params: { id: string } }) => {
  const { effectiveRole } = useAuth();
  const router = useRouter();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (effectiveRole !== 'broker' && effectiveRole !== null) {
    redirect('/inicio');
  }

  useEffect(() => {
    getSellerById(params.id)
      .then(setSeller)
      .catch(() => setFetchError('Listing not found.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (data: BrokerSellerInput) => {
    await updateSeller(params.id, data);
    router.push('/brokerage');
  };

  if (loading) return <Loader block />;
  if (fetchError || !seller) return <p className="p-6 text-red-400">{fetchError ?? 'Listing not found.'}</p>;

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-6">Edit listing</h1>
      <ListingForm
        initialValues={{
          company_name: seller.company_name,
          annual_revenue: seller.annual_revenue ?? undefined,
          ebitda: seller.ebitda ?? undefined,
          asking_price: seller.asking_price,
          state: seller.state ?? undefined,
          employee_count: seller.employee_count ?? undefined,
          years_in_business: seller.years_in_business ?? undefined,
          business_type: seller.business_type ?? undefined,
          work_type: seller.work_type ?? undefined,
          software: seller.software ?? undefined,
          management_type: seller.management_type ?? undefined,
          status: seller.status,
          phone: seller.phone,
          website: seller.website,
        }}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/brokerage')}
      />
    </section>
  );
};

export default ProtectedRoute(EditListingPage);
