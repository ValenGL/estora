import type { Seller } from '../types';

export function sanitizeForBuyer(seller: Seller, index: number): Seller {
  return {
    ...seller,
    company_name: `Roofing Business #${index + 1}`,
    state: null,
    ebitda: null,
    ebitda_margin: null,
    asking_price: null,
    employee_count: null,
    years_in_business: null,
    business_type: null,
    work_type: null,
    software: null,
    management_type: null,
    // annual_revenue is intentionally kept real — only visible field for buyers
  };
}
