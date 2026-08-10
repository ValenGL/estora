import type { Seller } from '../types';

export function sanitizeForBuyer(seller: Seller, index: number): Seller {
  return {
    ...seller,
    company_name: `Roofing Business #${index + 1}`,
    ebitda: null,
    ebitda_margin: null,
    asking_price: null,
    employee_count: null,
    business_type: null,
    work_type: null,
    software: null,
    management_type: null,
    phone: null,
    website: null,
    state: null,
  };
}
