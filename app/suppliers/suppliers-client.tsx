"use client";

import {
  ArrowLeft,
  Edit3,
  Plus,
  Search,
  Store,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type SupplierRecord = {
  _id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  openingBalance: number;
  totalPurchased: number;
  totalPaid: number;
  totalPending: number;
  purchaseCount: number;
};

const emptySupplier: Partial<SupplierRecord> = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstNumber: "",
  address: "",
  city: "",
  state: "Kerala",
  pincode: "",
  openingBalance: 0,
};

export default function SuppliersClient() {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<SupplierRecord>>(emptySupplier);
  const [error, setError] = useState("");

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/suppliers");
    if (response.status === 401 || response.status === 403) {
      window.location.href = "/login";
      return;
    }
    const result = await response.json();
    setSuppliers(result.suppliers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return suppliers;
    return suppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.contactPerson,
        supplier.phone,
        supplier.email,
        supplier.gstNumber,
        supplier.city,
      ].some((value) => String(value ?? "").toLowerCase().includes(query)),
    );
  }, [suppliers, search]);

  async function saveSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/suppliers", {
      method: editing._id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, id: editing._id }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to save supplier");
      return;
    }
    setFormOpen(false);
    await loadSuppliers();
  }

  async function removeSupplier(supplier: SupplierRecord) {
    if (!window.confirm(`Remove ${supplier.name}? Existing purchase history will remain.`)) return;
    const response = await fetch(`/api/suppliers?id=${supplier._id}`, { method: "DELETE" });
    if (response.ok) await loadSuppliers();
  }

  const totalPending = suppliers.reduce((sum, supplier) => sum + supplier.totalPending, 0);
  const totalPurchased = suppliers.reduce((sum, supplier) => sum + supplier.totalPurchased, 0);

  return (
    <main className="workspace-page">
      <header className="workspace-topbar">
        <a href="/"><ArrowLeft size={18} /> Dashboard</a>
        <div className="workspace-brand"><span>S</span> Shape of You</div>
        <a href="/purchases" className="topbar-action"><Plus size={16} /> New purchase</a>
      </header>
      <section className="workspace-content">
        <div className="workspace-heading">
          <div><span>SUPPLIER MANAGEMENT</span><h1>Suppliers</h1><p>Store supplier details and monitor purchases, payments and pending balances.</p></div>
          <button className="primary-btn" onClick={() => { setEditing({ ...emptySupplier }); setError(""); setFormOpen(true); }}><Plus size={17} /> Add supplier</button>
        </div>
        <div className="workspace-stats">
          <article><Truck size={20} /><div><strong>{suppliers.length}</strong><span>Active suppliers</span></div></article>
          <article><Store size={20} /><div><strong>{suppliers.reduce((sum, supplier) => sum + supplier.purchaseCount, 0)}</strong><span>Purchase bills</span></div></article>
          <article><span className="rupee-icon">₹</span><div><strong>₹{totalPurchased.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong><span>Total purchased</span></div></article>
          <article className={totalPending > 0 ? "warning" : ""}><span className="rupee-icon">₹</span><div><strong>₹{totalPending.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong><span>Total pending</span></div></article>
        </div>
        <section className="data-card">
          <div className="data-toolbar"><div><h2>Supplier directory</h2><span>{filtered.length} suppliers</span></div><label className="data-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone, GSTIN or city" /></label></div>
          {loading ? <div className="data-empty">Loading suppliers...</div> : filtered.length === 0 ? (
            <div className="data-empty"><Truck size={32} /><strong>No suppliers found</strong><span>Add a supplier before recording a purchase.</span><button onClick={() => { setEditing({ ...emptySupplier }); setFormOpen(true); }}><Plus size={15} /> Add supplier</button></div>
          ) : (
            <div className="supplier-list">
              {filtered.map((supplier) => (
                <article key={supplier._id}>
                  <span className="supplier-avatar">{supplier.name.slice(0, 2).toUpperCase()}</span>
                  <div><strong>{supplier.name}</strong><small>{supplier.contactPerson || "No contact person"} · {supplier.phone}</small><small>{[supplier.city, supplier.state, supplier.gstNumber && `GSTIN ${supplier.gstNumber}`].filter(Boolean).join(" · ")}</small></div>
                  <span><strong>{supplier.purchaseCount}</strong><small>Purchases</small></span>
                  <span><strong>₹{supplier.totalPurchased.toLocaleString("en-IN")}</strong><small>Total</small></span>
                  <span className={supplier.totalPending > 0 ? "supplier-due" : ""}><strong>₹{supplier.totalPending.toLocaleString("en-IN")}</strong><small>Pending</small></span>
                  <div className="row-actions"><button onClick={() => { setEditing(supplier); setError(""); setFormOpen(true); }}><Edit3 size={15} /></button><button onClick={() => removeSupplier(supplier)}><Trash2 size={15} /></button></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {formOpen && (
        <div className="modal-backdrop" onMouseDown={() => setFormOpen(false)}>
          <form className="product-form" onSubmit={saveSupplier} onMouseDown={(event) => event.stopPropagation()}>
            <div className="user-form-head"><div><span>{editing._id ? "EDIT SUPPLIER" : "NEW SUPPLIER"}</span><h2>{editing._id ? "Update supplier" : "Add supplier"}</h2></div><button type="button" onClick={() => setFormOpen(false)}><X size={19} /></button></div>
            <div className="form-grid">
              <label>Supplier name<input name="name" defaultValue={editing.name} required /></label>
              <label>Contact person<input name="contactPerson" defaultValue={editing.contactPerson} /></label>
              <label>Phone<input name="phone" defaultValue={editing.phone} required inputMode="tel" /></label>
              <label>Email<input name="email" type="email" defaultValue={editing.email} /></label>
              <label>GSTIN<input name="gstNumber" defaultValue={editing.gstNumber} maxLength={15} /></label>
              <label>Opening pending balance<input name="openingBalance" type="number" min="0" step="0.01" defaultValue={editing.openingBalance} /></label>
              <label className="wide">Address<input name="address" defaultValue={editing.address} /></label>
              <label>City<input name="city" defaultValue={editing.city} /></label>
              <label>State<input name="state" defaultValue={editing.state} /></label>
              <label>PIN code<input name="pincode" defaultValue={editing.pincode} /></label>
            </div>
            {error && <div className="login-error">{error}</div>}
            <button className="login-submit" disabled={saving}>{saving ? "Saving..." : "Save supplier"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
