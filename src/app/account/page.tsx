"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../utils/isAuth";
import { supabase } from "../lib/supabase/supabase";
import { getOwnSeller, updateSeller } from "../lib/supabase/sellers";
import { getOwnBuyer, updateBuyer } from "../lib/supabase/buyers";
import { US_STATES } from "../lib/data/usStates";
import Loader from "../../shared/components/loader/loader";
import ProtectedRoute from "../utils/protectedRoute";
import type {
  Seller,
  Buyer,
  BusinessType,
  WorkType,
  ManagementType,
  BuyerBusinessType,
  BuyerWorkType,
  ManagementPreference,
} from "../lib/types";
import "./account.scss";

// ---- Format helpers ----

function formatMoney(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function stateLabel(code: string | null): string {
  if (!code) return "—";
  return US_STATES.find((s) => s.code === code)?.label ?? code;
}

// ---- Form interfaces ----

interface SellerForm {
  company_name: string;
  annual_revenue: string;
  ebitda: string;
  state: string;
  employee_count: string;
  years_in_business: string;
  business_type: BusinessType | "";
  work_type: WorkType | "";
  software: string;
  management_type: ManagementType | "";
  phone: string;
  website: string;
}

interface BuyerForm {
  organization_name: string;
  revenue_min: string;
  revenue_max: string;
  ebitda_min: string;
  ebitda_max: string;
  target_states: string[];
  business_type: BuyerBusinessType | "";
  work_type: BuyerWorkType | "";
  employee_min: string;
  employee_max: string;
  preferred_software: string;
  management_preference: ManagementPreference | "";
}

// ---- DB record → form string mapping ----

function sellerToForm(s: Seller): SellerForm {
  return {
    company_name: s.company_name,
    annual_revenue:
      s.annual_revenue !== null ? String(s.annual_revenue / 1_000_000) : "",
    ebitda: s.ebitda !== null ? String(s.ebitda / 100_000) : "",
    state: s.state ?? "",
    employee_count:
      s.employee_count !== null ? String(s.employee_count) : "",
    years_in_business:
      s.years_in_business !== null ? String(s.years_in_business) : "",
    business_type: s.business_type ?? "",
    work_type: s.work_type ?? "",
    software: s.software ?? "",
    management_type: s.management_type ?? "",
    phone: s.phone ?? "",
    website: s.website ?? "",
  };
}

function buyerToForm(b: Buyer): BuyerForm {
  return {
    organization_name: b.organization_name,
    revenue_min:
      b.revenue_min !== null ? String(b.revenue_min / 1_000_000) : "",
    revenue_max:
      b.revenue_max !== null ? String(b.revenue_max / 1_000_000) : "",
    ebitda_min:
      b.ebitda_min !== null ? String(b.ebitda_min / 100_000) : "",
    ebitda_max:
      b.ebitda_max !== null ? String(b.ebitda_max / 100_000) : "",
    target_states: b.target_states ?? [],
    business_type: b.business_type ?? "",
    work_type: b.work_type ?? "",
    employee_min:
      b.employee_min !== null ? String(b.employee_min) : "",
    employee_max:
      b.employee_max !== null ? String(b.employee_max) : "",
    preferred_software: b.preferred_software ?? "",
    management_preference: b.management_preference ?? "",
  };
}

// ---- SellerSection ----

function SellerSection({
  seller,
  onUpdate,
}: {
  seller: Seller;
  onUpdate: (updated: Seller) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SellerForm>(sellerToForm(seller));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setForm(sellerToForm(seller));
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const setField =
    (name: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const isValid =
    form.company_name.trim() !== "" &&
    !isNaN(parseFloat(form.annual_revenue)) &&
    parseFloat(form.annual_revenue) >= 0 &&
    !isNaN(parseFloat(form.ebitda)) &&
    parseFloat(form.ebitda) >= 0 &&
    form.state !== "" &&
    !isNaN(parseInt(form.employee_count, 10)) &&
    parseInt(form.employee_count, 10) >= 1 &&
    !isNaN(parseInt(form.years_in_business, 10)) &&
    parseInt(form.years_in_business, 10) >= 0 &&
    form.business_type !== "" &&
    form.work_type !== "" &&
    form.software.trim() !== "" &&
    form.management_type !== "";

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSeller(seller.id, {
        company_name: form.company_name.trim(),
        annual_revenue: parseFloat(form.annual_revenue) * 1_000_000,
        ebitda: parseFloat(form.ebitda) * 100_000,
        state: form.state,
        employee_count: parseInt(form.employee_count, 10),
        years_in_business: parseInt(form.years_in_business, 10),
        business_type: form.business_type as BusinessType,
        work_type: form.work_type as WorkType,
        software: form.software.trim(),
        management_type: form.management_type as ManagementType,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
      });
      onUpdate(updated);
      setEditing(false);
    } catch {
      setError("Error al guardar los cambios. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="account-section u-bgcolor-estora-black">
        <div className="account-section__header">
          <h2 className="account-section__title">Mi negocio</h2>
          <button
            className="account-btn account-btn--ghost"
            onClick={startEdit}
            type="button"
          >
            Editar
          </button>
        </div>
        <div className="account-fields">
          <div className="account-field">
            <p className="account-field__label">Nombre del negocio</p>
            <p className="account-field__value">{seller.company_name}</p>
          </div>
          <div className="account-field-row">
            <div className="account-field">
              <p className="account-field__label">Revenue anual</p>
              <p className="account-field__value">
                {formatMoney(seller.annual_revenue)}
              </p>
            </div>
            <div className="account-field">
              <p className="account-field__label">EBITDA</p>
              <p className="account-field__value">
                {formatMoney(seller.ebitda)}
              </p>
            </div>
          </div>
          <div className="account-field-row">
            <div className="account-field">
              <p className="account-field__label">Estado</p>
              <p className="account-field__value">
                {stateLabel(seller.state)}
              </p>
            </div>
            <div className="account-field">
              <p className="account-field__label">Empleados</p>
              <p className="account-field__value">
                {seller.employee_count ?? "—"}
              </p>
            </div>
          </div>
          <div className="account-field">
            <p className="account-field__label">Años en el negocio</p>
            <p className="account-field__value">
              {seller.years_in_business ?? "—"}
            </p>
          </div>
          <div className="account-field">
            <p className="account-field__label">
              Tipo de negocio / trabajo / gestión
            </p>
            <div className="account-chips">
              <span className="account-chip">
                {seller.business_type ?? "—"}
              </span>
              <span className="account-chip">{seller.work_type ?? "—"}</span>
              <span className="account-chip">
                {seller.management_type?.replace(/_/g, " ") ?? "—"}
              </span>
            </div>
          </div>
          <div className="account-field">
            <p className="account-field__label">Software</p>
            <p className="account-field__value">{seller.software ?? "—"}</p>
          </div>
          <div className="account-field-row">
            <div className="account-field">
              <p className="account-field__label">Teléfono</p>
              <p className="account-field__value">{seller.phone ?? "—"}</p>
            </div>
            <div className="account-field">
              <p className="account-field__label">Website</p>
              <p className="account-field__value">{seller.website ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-section u-bgcolor-estora-black">
      <div className="account-section__header">
        <h2 className="account-section__title">Mi negocio</h2>
      </div>
      <div className="account-edit-form">
        <div className="account-edit-field">
          <label htmlFor="company_name">Nombre del negocio *</label>
          <input
            id="company_name"
            type="text"
            value={form.company_name}
            onChange={setField("company_name")}
            disabled={saving}
          />
        </div>
        <div className="account-edit-row">
          <div className="account-edit-field">
            <label htmlFor="annual_revenue">Revenue (millones) *</label>
            <input
              id="annual_revenue"
              type="number"
              step="0.1"
              min="0"
              value={form.annual_revenue}
              onChange={setField("annual_revenue")}
              disabled={saving}
            />
          </div>
          <div className="account-edit-field">
            <label htmlFor="ebitda">EBITDA (cien miles) *</label>
            <input
              id="ebitda"
              type="number"
              step="0.1"
              min="0"
              value={form.ebitda}
              onChange={setField("ebitda")}
              disabled={saving}
            />
          </div>
        </div>
        <div className="account-edit-field">
          <label htmlFor="state">Estado *</label>
          <select
            id="state"
            value={form.state}
            onChange={setField("state")}
            disabled={saving}
          >
            <option value="">Seleccionar estado...</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="account-edit-row">
          <div className="account-edit-field">
            <label htmlFor="employee_count">Empleados *</label>
            <input
              id="employee_count"
              type="number"
              min="1"
              step="1"
              value={form.employee_count}
              onChange={setField("employee_count")}
              disabled={saving}
            />
          </div>
          <div className="account-edit-field">
            <label htmlFor="years_in_business">Años en el negocio *</label>
            <input
              id="years_in_business"
              type="number"
              min="0"
              step="1"
              value={form.years_in_business}
              onChange={setField("years_in_business")}
              disabled={saving}
            />
          </div>
        </div>
        <div className="account-edit-field">
          <label>Tipo de negocio *</label>
          <div className="account-radio-group">
            {(["residential", "commercial", "both"] as BusinessType[]).map(
              (opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`account-radio-btn${
                    form.business_type === opt
                      ? " account-radio-btn--selected"
                      : ""
                  }`}
                  onClick={() =>
                    setForm((p) => ({ ...p, business_type: opt }))
                  }
                  disabled={saving}
                >
                  {opt}
                </button>
              )
            )}
          </div>
        </div>
        <div className="account-edit-field">
          <label>Tipo de trabajo *</label>
          <div className="account-radio-group">
            {(["retail", "insurance", "both"] as WorkType[]).map((opt) => (
              <button
                key={opt}
                type="button"
                className={`account-radio-btn${
                  form.work_type === opt ? " account-radio-btn--selected" : ""
                }`}
                onClick={() => setForm((p) => ({ ...p, work_type: opt }))}
                disabled={saving}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="account-edit-field">
          <label htmlFor="software">Software *</label>
          <input
            id="software"
            type="text"
            value={form.software}
            onChange={setField("software")}
            disabled={saving}
          />
        </div>
        <div className="account-edit-field">
          <label>Gestión *</label>
          <div className="account-radio-group">
            {(
              ["owner_operated", "has_management_team"] as ManagementType[]
            ).map((opt) => (
              <button
                key={opt}
                type="button"
                className={`account-radio-btn${
                  form.management_type === opt
                    ? " account-radio-btn--selected"
                    : ""
                }`}
                onClick={() =>
                  setForm((p) => ({ ...p, management_type: opt }))
                }
                disabled={saving}
              >
                {opt.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="account-edit-row">
          <div className="account-edit-field">
            <label htmlFor="phone">Teléfono</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={setField("phone")}
              disabled={saving}
            />
          </div>
          <div className="account-edit-field">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="url"
              value={form.website}
              onChange={setField("website")}
              disabled={saving}
            />
          </div>
        </div>
        {error && <p className="account-error">{error}</p>}
        <div className="account-edit-actions">
          <button
            className="account-btn account-btn--primary"
            onClick={handleSave}
            disabled={!isValid || saving}
            type="button"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            className="account-btn account-btn--ghost"
            onClick={cancel}
            disabled={saving}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- BuyerSection ----

function BuyerSection({
  buyer,
  onUpdate,
}: {
  buyer: Buyer;
  onUpdate: (updated: Buyer) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BuyerForm>(buyerToForm(buyer));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setForm(buyerToForm(buyer));
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const setField =
    (name: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const toggleState = (code: string) =>
    setForm((prev) => ({
      ...prev,
      target_states: prev.target_states.includes(code)
        ? prev.target_states.filter((s) => s !== code)
        : [...prev.target_states, code],
    }));

  const revMin = parseFloat(form.revenue_min);
  const revMax = parseFloat(form.revenue_max);
  const ebitdaMin = parseFloat(form.ebitda_min);
  const ebitdaMax = parseFloat(form.ebitda_max);
  const empMin = parseInt(form.employee_min, 10);
  const empMax = parseInt(form.employee_max, 10);

  const isValid =
    form.organization_name.trim().length >= 2 &&
    !isNaN(revMin) &&
    !isNaN(revMax) &&
    revMin >= 0 &&
    revMax > 0 &&
    revMin <= revMax &&
    !isNaN(ebitdaMin) &&
    !isNaN(ebitdaMax) &&
    ebitdaMin >= 0 &&
    ebitdaMax > 0 &&
    ebitdaMin <= ebitdaMax &&
    form.target_states.length >= 1 &&
    form.business_type !== "" &&
    form.work_type !== "" &&
    !isNaN(empMin) &&
    !isNaN(empMax) &&
    empMin >= 0 &&
    empMin <= empMax &&
    form.preferred_software.trim() !== "" &&
    form.management_preference !== "";

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateBuyer(buyer.id, {
        organization_name: form.organization_name.trim(),
        revenue_min: revMin * 1_000_000,
        revenue_max: revMax * 1_000_000,
        ebitda_min: ebitdaMin * 100_000,
        ebitda_max: ebitdaMax * 100_000,
        target_states: form.target_states,
        business_type: form.business_type as BuyerBusinessType,
        work_type: form.work_type as BuyerWorkType,
        employee_min: empMin,
        employee_max: empMax,
        preferred_software: form.preferred_software.trim(),
        management_preference: form.management_preference as ManagementPreference,
      });
      onUpdate(updated);
      setEditing(false);
    } catch {
      setError("Error al guardar los cambios. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const fmtRevenue = (v: number | null) =>
    v !== null ? `$${(v / 1_000_000).toFixed(1)}M` : "—";
  const fmtEbitda = formatMoney;

  if (!editing) {
    return (
      <div className="account-section u-bgcolor-estora-black">
        <div className="account-section__header">
          <h2 className="account-section__title">Mi Buy Box</h2>
          <button
            className="account-btn account-btn--ghost"
            onClick={startEdit}
            type="button"
          >
            Editar
          </button>
        </div>
        <div className="account-fields">
          <div className="account-field">
            <p className="account-field__label">Organización</p>
            <p className="account-field__value">{buyer.organization_name}</p>
          </div>
          <div className="account-field-row">
            <div className="account-field">
              <p className="account-field__label">Revenue objetivo</p>
              <p className="account-field__value">
                {fmtRevenue(buyer.revenue_min)} –{" "}
                {fmtRevenue(buyer.revenue_max)}
              </p>
            </div>
            <div className="account-field">
              <p className="account-field__label">EBITDA objetivo</p>
              <p className="account-field__value">
                {fmtEbitda(buyer.ebitda_min)} – {fmtEbitda(buyer.ebitda_max)}
              </p>
            </div>
          </div>
          <div className="account-field">
            <p className="account-field__label">Estados objetivo</p>
            <div className="account-chips">
              {(buyer.target_states ?? []).map((s) => (
                <span key={s} className="account-chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="account-field">
            <p className="account-field__label">
              Tipo de negocio / trabajo / gestión
            </p>
            <div className="account-chips">
              <span className="account-chip">
                {buyer.business_type ?? "—"}
              </span>
              <span className="account-chip">{buyer.work_type ?? "—"}</span>
              <span className="account-chip">
                {buyer.management_preference?.replace(/_/g, " ") ?? "—"}
              </span>
            </div>
          </div>
          <div className="account-field-row">
            <div className="account-field">
              <p className="account-field__label">Empleados objetivo</p>
              <p className="account-field__value">
                {buyer.employee_min ?? "—"} – {buyer.employee_max ?? "—"}
              </p>
            </div>
            <div className="account-field">
              <p className="account-field__label">Software preferido</p>
              <p className="account-field__value">
                {buyer.preferred_software ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const businessTypeOptions: BuyerBusinessType[] = [
    "residential",
    "commercial",
    "both",
    "any",
  ];
  const workTypeOptions: BuyerWorkType[] = [
    "retail",
    "insurance",
    "both",
    "any",
  ];
  const mgmtOptions: ManagementPreference[] = [
    "owner_operated",
    "has_management_team",
    "any",
  ];

  return (
    <div className="account-section u-bgcolor-estora-black">
      <div className="account-section__header">
        <h2 className="account-section__title">Mi Buy Box</h2>
      </div>
      <div className="account-edit-form">
        <div className="account-edit-field">
          <label htmlFor="organization_name">Organización *</label>
          <input
            id="organization_name"
            type="text"
            value={form.organization_name}
            onChange={setField("organization_name")}
            disabled={saving}
          />
        </div>
        <div className="account-edit-row">
          <div className="account-edit-field">
            <label htmlFor="revenue_min">Revenue mín (millones) *</label>
            <input
              id="revenue_min"
              type="number"
              min="0"
              step="0.1"
              value={form.revenue_min}
              onChange={setField("revenue_min")}
              disabled={saving}
            />
          </div>
          <div className="account-edit-field">
            <label htmlFor="revenue_max">Revenue máx (millones) *</label>
            <input
              id="revenue_max"
              type="number"
              min="0"
              step="0.1"
              value={form.revenue_max}
              onChange={setField("revenue_max")}
              disabled={saving}
            />
          </div>
        </div>
        <div className="account-edit-row">
          <div className="account-edit-field">
            <label htmlFor="ebitda_min">EBITDA mín (cien miles) *</label>
            <input
              id="ebitda_min"
              type="number"
              min="0"
              step="0.1"
              value={form.ebitda_min}
              onChange={setField("ebitda_min")}
              disabled={saving}
            />
          </div>
          <div className="account-edit-field">
            <label htmlFor="ebitda_max">EBITDA máx (cien miles) *</label>
            <input
              id="ebitda_max"
              type="number"
              min="0"
              step="0.1"
              value={form.ebitda_max}
              onChange={setField("ebitda_max")}
              disabled={saving}
            />
          </div>
        </div>
        <div className="account-edit-field">
          <label>Estados objetivo *</label>
          <div className="account-states-grid">
            {US_STATES.map((s) => (
              <button
                key={s.code}
                type="button"
                className={`account-state-btn${
                  form.target_states.includes(s.code)
                    ? " account-state-btn--selected"
                    : ""
                }`}
                onClick={() => toggleState(s.code)}
                title={s.label}
                disabled={saving}
              >
                {s.code}
              </button>
            ))}
          </div>
        </div>
        <div className="account-edit-field">
          <label>Tipo de negocio *</label>
          <div className="account-radio-group">
            {businessTypeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`account-radio-btn${
                  form.business_type === opt
                    ? " account-radio-btn--selected"
                    : ""
                }`}
                onClick={() => setForm((p) => ({ ...p, business_type: opt }))}
                disabled={saving}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="account-edit-field">
          <label>Tipo de trabajo *</label>
          <div className="account-radio-group">
            {workTypeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`account-radio-btn${
                  form.work_type === opt ? " account-radio-btn--selected" : ""
                }`}
                onClick={() => setForm((p) => ({ ...p, work_type: opt }))}
                disabled={saving}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="account-edit-row">
          <div className="account-edit-field">
            <label htmlFor="employee_min">Empleados mín *</label>
            <input
              id="employee_min"
              type="number"
              min="0"
              step="1"
              value={form.employee_min}
              onChange={setField("employee_min")}
              disabled={saving}
            />
          </div>
          <div className="account-edit-field">
            <label htmlFor="employee_max">Empleados máx *</label>
            <input
              id="employee_max"
              type="number"
              min="0"
              step="1"
              value={form.employee_max}
              onChange={setField("employee_max")}
              disabled={saving}
            />
          </div>
        </div>
        <div className="account-edit-field">
          <label htmlFor="preferred_software">Software preferido *</label>
          <input
            id="preferred_software"
            type="text"
            value={form.preferred_software}
            onChange={setField("preferred_software")}
            disabled={saving}
          />
        </div>
        <div className="account-edit-field">
          <label>Preferencia de gestión *</label>
          <div className="account-radio-group">
            {mgmtOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`account-radio-btn${
                  form.management_preference === opt
                    ? " account-radio-btn--selected"
                    : ""
                }`}
                onClick={() =>
                  setForm((p) => ({ ...p, management_preference: opt }))
                }
                disabled={saving}
              >
                {opt.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="account-error">{error}</p>}
        <div className="account-edit-actions">
          <button
            className="account-btn account-btn--primary"
            onClick={handleSave}
            disabled={!isValid || saving}
            type="button"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            className="account-btn account-btn--ghost"
            onClick={cancel}
            disabled={saving}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main page ----

const AccountPage = () => {
  const { role } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [seller, setSeller] = useState<Seller | null>(null);
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [noRecord, setNoRecord] = useState(false);

  useEffect(() => {
    if (!role || role === "pending") return;

    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? "");

      try {
        if (role === "seller") {
          const s = await getOwnSeller();
          if (!s) setNoRecord(true);
          else setSeller(s);
        } else if (role === "buyer") {
          const b = await getOwnBuyer();
          if (!b) setNoRecord(true);
          else setBuyer(b);
        }
      } catch {
        setNoRecord(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [role]);

  if (loading || !role) return <Loader block />;

  const onboardingPath =
    role === "seller" ? "/seller/onboarding" : "/buyer/onboarding";

  return (
    <section className="mhWrapper flex-col">
      <article className="container">
        <div className="account-page">
          <div className="account-email">
            <p className="account-email__label">Email de la cuenta</p>
            <p className="account-email__value">{email}</p>
          </div>

          {noRecord && (
            <div className="account-banner">
              <p className="account-banner__text">
                No tenés un perfil completo.
              </p>
              <button
                className="account-banner__link"
                onClick={() => router.push(onboardingPath)}
                type="button"
              >
                Completar perfil →
              </button>
            </div>
          )}

          {role === "seller" && seller && (
            <SellerSection seller={seller} onUpdate={setSeller} />
          )}
          {role === "buyer" && buyer && (
            <BuyerSection buyer={buyer} onUpdate={setBuyer} />
          )}
        </div>
      </article>
    </section>
  );
};

export default ProtectedRoute(AccountPage);
