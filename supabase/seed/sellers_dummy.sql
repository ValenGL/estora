-- Dummy seller listings based on theroofingbizbroker.com/all-listings/
-- Replace YOUR_BROKER_PROFILE_ID with the broker's actual UUID from the profiles table.
-- Run once in Supabase Studio → SQL Editor.

INSERT INTO sellers (
  profile_id, company_name, state,
  annual_revenue, ebitda, ebitda_margin,
  asking_price, employee_count, years_in_business,
  business_type, work_type, status
) VALUES
(
  'YOUR_BROKER_PROFILE_ID',
  'Texas High-Growth Roofing Co.',
  'TX',
  4500000, 1200000, 26.7,
  5400000, 45, 12,
  'both', 'retail', 'active'
),
(
  'YOUR_BROKER_PROFILE_ID',
  'California Family Roofing Contractor',
  'CA',
  3200000, 780000, 24.4,
  3120000, 22, 18,
  'residential', 'retail', 'active'
),
(
  'YOUR_BROKER_PROFILE_ID',
  'South Florida Commercial Roofing',
  'FL',
  7900000, 2100000, 26.6,
  8400000, 65, 15,
  'commercial', 'insurance', 'under_nda'
),
(
  'YOUR_BROKER_PROFILE_ID',
  'S. Florida Residential Platform',
  'FL',
  7100000, 740000, 10.4,
  3700000, 55, 9,
  'residential', 'retail', 'active'
),
(
  'YOUR_BROKER_PROFILE_ID',
  'North Carolina Roofing Company',
  'NC',
  13200000, 2600000, 19.7,
  10400000, 110, 22,
  'both', 'both', 'active'
);
