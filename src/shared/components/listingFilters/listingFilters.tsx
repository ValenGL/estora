"use client";

import type { ListingFilters } from "../../../shared/hooks/useListingFilters";
import { US_STATES } from "../../../app/lib/data/usStates";
import "./listingFilters.scss";

interface ListingFiltersProps {
  filters: ListingFilters;
  setFilter: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  resetFilters: () => void;
  isFiltered: boolean;
  mode: 'buyer' | 'full';
}

export default function ListingFiltersBar({
  filters,
  setFilter,
  resetFilters,
  isFiltered,
  mode,
}: ListingFiltersProps) {
  return (
    <div className="listing-filters">

      {mode === 'full' && (
        <div className="listing-filters-group">
          <span className="listing-filters-label">State</span>
          <select
            className="listing-filters-select"
            value={filters.state}
            onChange={(e) => setFilter('state', e.target.value)}
          >
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="listing-filters-group">
        <span className="listing-filters-label">Status</span>
        <select
          className="listing-filters-select"
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Available</option>
          <option value="under_nda">Under NDA</option>
          <option value="sold">Sold</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {mode === 'full' && (
        <>
          <div className="listing-filters-group">
            <span className="listing-filters-label">Business type</span>
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
          </div>

          <div className="listing-filters-group">
            <span className="listing-filters-label">Work type</span>
            <select
              className="listing-filters-select"
              value={filters.workType}
              onChange={(e) => setFilter('workType', e.target.value)}
            >
              <option value="">All types</option>
              <option value="retail">Retail</option>
              <option value="insurance">Insurance</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="listing-filters-group">
            <span className="listing-filters-label">Management</span>
            <select
              className="listing-filters-select"
              value={filters.managementType}
              onChange={(e) => setFilter('managementType', e.target.value)}
            >
              <option value="">All</option>
              <option value="owner_operated">Owner operated</option>
              <option value="has_management_team">Has management team</option>
            </select>
          </div>
        </>
      )}

      <div className="listing-filters-group">
        <span className="listing-filters-label">Revenue ($M)</span>
        <div className="listing-filters-range">
          <input
            className="listing-filters-input"
            type="number"
            min="0"
            step="0.1"
            placeholder="Min"
            value={filters.revenueMin}
            onChange={(e) => setFilter('revenueMin', e.target.value)}
          />
          <span className="listing-filters-sep">–</span>
          <input
            className="listing-filters-input"
            type="number"
            min="0"
            step="0.1"
            placeholder="Max"
            value={filters.revenueMax}
            onChange={(e) => setFilter('revenueMax', e.target.value)}
          />
        </div>
      </div>

      {mode === 'full' && (
        <div className="listing-filters-group">
          <span className="listing-filters-label">EBITDA (×100K)</span>
          <div className="listing-filters-range">
            <input
              className="listing-filters-input"
              type="number"
              min="0"
              step="0.1"
              placeholder="Min"
              value={filters.ebitdaMin}
              onChange={(e) => setFilter('ebitdaMin', e.target.value)}
            />
            <span className="listing-filters-sep">–</span>
            <input
              className="listing-filters-input"
              type="number"
              min="0"
              step="0.1"
              placeholder="Max"
              value={filters.ebitdaMax}
              onChange={(e) => setFilter('ebitdaMax', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="listing-filters-group">
        <span className="listing-filters-label">Years in business</span>
        <div className="listing-filters-range">
          <input
            className="listing-filters-input"
            type="number"
            min="0"
            step="1"
            placeholder="Min"
            value={filters.yearsMin}
            onChange={(e) => setFilter('yearsMin', e.target.value)}
          />
          <span className="listing-filters-sep">–</span>
          <input
            className="listing-filters-input"
            type="number"
            min="0"
            step="1"
            placeholder="Max"
            value={filters.yearsMax}
            onChange={(e) => setFilter('yearsMax', e.target.value)}
          />
        </div>
      </div>

      {isFiltered && (
        <button
          className="listing-filters-clear"
          onClick={resetFilters}
          type="button"
        >
          Clear filters
        </button>
      )}

    </div>
  );
}
