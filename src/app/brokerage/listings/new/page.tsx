"use client";

import { redirect, useRouter } from "next/navigation";
import { useAuth } from "../../../utils/isAuth";
import ListingForm from "../../../../shared/components/listingForm/listingForm";
import { createSellerAsBroker } from "../../../lib/supabase/brokerSellers";
import type { BrokerSellerInput } from "../../../lib/supabase/brokerSellers";
import ProtectedRoute from "../../../utils/protectedRoute";

const NewListingPage = () => {
  const { effectiveRole } = useAuth();
  const router = useRouter();

  if (effectiveRole !== 'broker' && effectiveRole !== null) {
    redirect('/inicio');
  }

  const handleSubmit = async (data: BrokerSellerInput) => {
    await createSellerAsBroker(data);
    router.push('/brokerage');
  };

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-6">New listing</h1>
      <ListingForm
        submitLabel="Create listing"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/brokerage')}
      />
    </section>
  );
};

export default ProtectedRoute(NewListingPage);
