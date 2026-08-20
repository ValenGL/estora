import { useState, useMemo } from 'react';
import type { Buyer } from '../../app/lib/types';

export interface BuyerFilters {
  search: string;
  category: string;
  businessType: string;
  roofingQualified: string;
  source: string;
}

const EMPTY: BuyerFilters = {
  search: '',
  category: '',
  businessType: '',
  roofingQualified: '',
  source: '',
};

export function useBuyerFilters(buyers: Buyer[]) {
  const [filters, setFilters] = useState<BuyerFilters>(EMPTY);

  const setFilter = <K extends keyof BuyerFilters>(key: K, value: BuyerFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(EMPTY);

  const isFiltered = Object.values(filters).some((v) => v !== '');

  const filtered = useMemo(() => {
    return buyers.filter((buyer) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!buyer.organization_name.toLowerCase().includes(q)) return false;
      }
      if (filters.category && buyer.buyer_category !== filters.category) return false;
      if (filters.businessType && buyer.business_type !== filters.businessType) return false;
      if (filters.roofingQualified && buyer.roofing_qualified !== filters.roofingQualified) return false;
      if (filters.source && buyer.source !== filters.source) return false;
      return true;
    });
  }, [buyers, filters]);

  return { filtered, filters, setFilter, resetFilters, isFiltered };
}
