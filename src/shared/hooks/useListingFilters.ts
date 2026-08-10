import { useState, useMemo } from 'react';
import type { Seller } from '../../app/lib/types';

export interface ListingFilters {
  state: string;
  status: string;
  businessType: string;
  workType: string;
  managementType: string;
  revenueMin: string;
  revenueMax: string;
  ebitdaMin: string;
  ebitdaMax: string;
  yearsMin: string;
  yearsMax: string;
}

const EMPTY: ListingFilters = {
  state: '',
  status: '',
  businessType: '',
  workType: '',
  managementType: '',
  revenueMin: '',
  revenueMax: '',
  ebitdaMin: '',
  ebitdaMax: '',
  yearsMin: '',
  yearsMax: '',
};

export function useListingFilters(sellers: Seller[]) {
  const [filters, setFilters] = useState<ListingFilters>(EMPTY);

  const setFilter = <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(EMPTY);

  const isFiltered = Object.values(filters).some((v) => v !== '');

  const filtered = useMemo(() => {
    return sellers.filter((seller) => {
      if (filters.state && seller.state !== filters.state) return false;
      if (filters.status && seller.status !== filters.status) return false;
      if (filters.businessType && seller.business_type !== filters.businessType) return false;
      if (filters.workType && seller.work_type !== filters.workType) return false;
      if (filters.managementType && seller.management_type !== filters.managementType) return false;

      if (filters.revenueMin !== '') {
        const min = parseFloat(filters.revenueMin) * 1_000_000;
        if (seller.annual_revenue === null || seller.annual_revenue < min) return false;
      }
      if (filters.revenueMax !== '') {
        const max = parseFloat(filters.revenueMax) * 1_000_000;
        if (seller.annual_revenue === null || seller.annual_revenue > max) return false;
      }

      if (filters.ebitdaMin !== '') {
        const min = parseFloat(filters.ebitdaMin) * 100_000;
        if (seller.ebitda === null || seller.ebitda < min) return false;
      }
      if (filters.ebitdaMax !== '') {
        const max = parseFloat(filters.ebitdaMax) * 100_000;
        if (seller.ebitda === null || seller.ebitda > max) return false;
      }

      if (filters.yearsMin !== '') {
        const min = parseInt(filters.yearsMin, 10);
        if (seller.years_in_business === null || seller.years_in_business < min) return false;
      }
      if (filters.yearsMax !== '') {
        const max = parseInt(filters.yearsMax, 10);
        if (seller.years_in_business === null || seller.years_in_business > max) return false;
      }

      return true;
    });
  }, [sellers, filters]);

  return { filtered, filters, setFilter, resetFilters, isFiltered };
}
