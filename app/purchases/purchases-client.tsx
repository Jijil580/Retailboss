"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  PackagePlus,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type SupplierRecord = {
  _id: string;
  name: string;
  phone: string;
};

type ProductRecord = {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  imageUrl?: string;
  purchasePrice: number;
  taxPercent: number;
  unit: string;
};

type PurchaseItemInput = {
  productId: string;
  productQuery: string;
  quantity: number;
  unitCost: number;
  taxPercent: number;
};

type PurchaseRecord = {
  _id: string;
  purchaseNumber: string;
  supplierBillNumber: string;
  supplierId: string;
  supplier: { name: string; phone: string };
  purchaseDate: string;
  items: Array<{ name: string; sku: string; quantity: number; unitCost: number; total: number }>;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  pending: number;
  paymentMode: string;
  status: string;
  notes?: string;
};

const todayValue = () => new Date().toISOString().slice(0, 10);
const emptyItem = (): PurchaseItemInput => ({
  productId: "",
  productQuery: "",
  quantity: 1,
  unitCost: 0,
  taxPercent: 0,
});

export default function PurchasesClient() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "Kerala",
    pincode: "",
  });
  const [supplierBillNumber, setSupplierBillNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayValue());
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItemInput[]>([emptyItem()]);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [purchaseResponse, supplierResponse, productResponse] = await Promise.all([
      fetch("/api/purchases"),
      fetch("/api/suppliers"),
      fetch("/api/products"),
    ]);
    if ([purchaseResponse, supplierResponse, productResponse].some((response) => response.status === 401)) {
      window.location.href = "/login";
      return;
    }
    const [purchaseResult, supplierResult, productResult] = await Promise.all([
      purchaseResponse.json(),
      supplierResponse.json(),
      productResponse.json(),
    ]);
    setPurchases(purchaseResult.purchases ?? []);
    setSuppliers(supplierResult.suppliers ?? []);
    setProducts(productResult.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );
  const tax = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitCost * item.taxPercent) / 100,
    0,
  );
  const total = subtotal + tax;
  const pending = Math.max(0, total - Math.min(total, paid));

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return purchases.filter((purchase) => {
      const searchable = [
        purchase.purchaseNumber,
        purchase.supplierBillNumber,
        purchase.supplier.name,
        purchase.supplier.phone,
        ...purchase.items.flatMap((item) => [item.name, item.sku]),
      ].join(" ").toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (filterSupplier && String(purchase.supplierId) !== filterSupplier) return false;
      if (filterStatus && purchase.status !== filterStatus) return false;
      if (month) {
        const date = new Date(purchase.purchaseDate);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (value !== month) return false;
      }
      return true;
    });
  }, [purchases, search, month, filterSupplier, filterStatus]);

  function openPurchase() {
    if (products.length === 0) {
      setError("Add a product before creating a purchase.");
      return;
    }
    setSupplierId(suppliers.length ? "" : "__new__");
    setNewSupplier({ name: "", contactPerson: "", phone: "", email: "", gstNumber: "", address: "", city: "", state: "Kerala", pincode: "" });
    setSupplierBillNumber("");
    setPurchaseDate(todayValue());
    setPaymentMode("cash");
    setPaid(0);
    setNotes("");
    setItems([emptyItem()]);
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function updateItem(index: number, values: Partial<PurchaseItemInput>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...values } : item,
      ),
    );
  }

  function chooseProduct(index: number, productId: string) {
    const product = products.find((entry) => entry._id === productId);
    updateItem(index, {
      productId,
      productQuery: product ? `${product.name} · ${product.sku}` : "",
      unitCost: product?.purchasePrice || 0,
      taxPercent: product?.taxPercent || 0,
    });
  }

  function matchingProducts(query: string) {
    const value = query.toLowerCase().trim();
    if (!value) return [];
    return products
      .filter((product) =>
        [product.name, product.sku, product.barcode]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(value)),
      )
      .slice(0, 6);
  }

  async function savePurchase(event: FormEvent) {
    event.preventDefault();
    if (items.some((item) => !item.productId)) {
      setError("Type and choose a matching product for every purchase row.");
      return;
    }
    setSaving(true);
    setError("");
    const response = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId,
        newSupplier: supplierId === "__new__" ? newSupplier : undefined,
        supplierBillNumber,
        purchaseDate,
        paymentMode,
        paid,
        notes,
        items,
      }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to save purchase");
      return;
    }
    setFormOpen(false);
    setSuccess(`${result.purchase.purchaseNumber} saved and stock updated.`);
    await loadData();
  }

  async function recordPayment(purchase: PurchaseRecord) {
    const entered = window.prompt(
      `Pending ₹${purchase.pending.toLocaleString("en-IN")}. Enter payment amount:`,
      String(purchase.pending),
    );
    if (entered === null) return;
    const amount = Number(entered);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    const modeInput = window.prompt("Payment mode: cash, upi, card, or bank", "cash");
    if (modeInput === null) return;
    const mode = modeInput.trim().toLowerCase();
    if (!["cash", "upi", "card", "bank"].includes(mode)) {
      setError("Payment mode must be cash, upi, card, or bank.");
      return;
    }
    const response = await fetch("/api/purchases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: purchase._id, amount, mode }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Unable to record payment");
      return;
    }
    setSuccess(`Payment recorded for ${purchase.purchaseNumber}.`);
    setError("");
    await loadData();
  }

  const allTotal = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const allPaid = purchases.reduce((sum, purchase) => sum + purchase.paid, 0);
  const allPending = purchases.reduce((sum, purchase) => sum + purchase.pending, 0);

  return (
    <main className="workspace-page">
      <header className="workspace-topbar">
        <a href="/"><ArrowLeft size={18} /> Dashboard</a>
        <div className="workspace-brand"><span>S</span> Shape of You</div>
        <a href="/suppliers" className="topbar-action"><Truck size={16} /> Suppliers</a>
      </header>
      <section className="workspace-content">
        <div className="workspace-heading">
          <div><span>STOCK INWARD</span><h1>Purchases</h1><p>Record supplier bills, increase inventory, and track paid and pending amounts.</p></div>
          <button className="primary-btn" onClick={openPurchase}><PackagePlus size={17} /> New purchase</button>
        </div>
        <div className="workspace-stats">
          <article><ShoppingCart size={20} /><div><strong>{purchases.length}</strong><span>Purchase bills</span></div></article>
          <article><span className="rupee-icon">₹</span><div><strong>₹{allTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong><span>Total purchased</span></div></article>
          <article><CheckCircle2 size={20} /><div><strong>₹{allPaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong><span>Total paid</span></div></article>
          <article className={allPending > 0 ? "warning" : ""}><CircleDollarSign size={20} /><div><strong>₹{allPending.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong><span>Total pending</span></div></article>
        </div>
        {error && !formOpen && <div className="workspace-alert error">{error}</div>}
        {success && <div className="workspace-alert success"><CheckCircle2 size={15} /> {success}</div>}
        <section className="data-card">
          <div className="data-toolbar"><div><h2>Purchase history</h2><span>{filtered.length} of {purchases.length} records</span></div><label className="data-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Bill, supplier, product or SKU" /></label></div>
          <div className="sales-filters">
            <label><CalendarDays size={14} /><span>Month</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
            <label><span>Supplier</span><select value={filterSupplier} onChange={(event) => setFilterSupplier(event.target.value)}><option value="">All</option>{suppliers.map((supplier) => <option value={supplier._id} key={supplier._id}>{supplier.name}</option>)}</select></label>
            <label><span>Status</span><select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}><option value="">All</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="credit">Credit</option></select></label>
            {(search || month || filterSupplier || filterStatus) && <button onClick={() => { setSearch(""); setMonth(""); setFilterSupplier(""); setFilterStatus(""); }}><RotateCcw size={14} /> Clear</button>}
            <strong>Filtered: ₹{filtered.reduce((sum, purchase) => sum + purchase.total, 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
          </div>
          {loading ? <div className="data-empty">Loading purchases...</div> : filtered.length === 0 ? (
            <div className="data-empty"><ShoppingCart size={32} /><strong>No purchases found</strong><span>Add a supplier purchase to increase product stock.</span><button onClick={openPurchase}><Plus size={15} /> New purchase</button></div>
          ) : (
            <div className="purchase-list">
              {filtered.map((purchase) => (
                <article key={purchase._id}>
                  <span className="purchase-icon"><ShoppingCart size={17} /></span>
                  <div><strong>{purchase.purchaseNumber}</strong><small>{new Date(purchase.purchaseDate).toLocaleDateString("en-IN")} · Supplier bill {purchase.supplierBillNumber || "—"}</small><small>{purchase.supplier.name} · {purchase.supplier.phone}</small></div>
                  <span><strong>{purchase.items.reduce((sum, item) => sum + item.quantity, 0)} units</strong><small>{purchase.items.map((item) => item.name).join(", ")}</small></span>
                  <span><strong>₹{purchase.total.toLocaleString("en-IN")}</strong><small>Total</small></span>
                  <span><strong>₹{purchase.paid.toLocaleString("en-IN")}</strong><small>Paid</small></span>
                  <span className={purchase.pending > 0 ? "supplier-due" : ""}><strong>₹{purchase.pending.toLocaleString("en-IN")}</strong><small>Pending</small></span>
                  <span className={purchase.status === "paid" ? "account-status active" : "account-status"}>{purchase.status}</span>
                  {purchase.pending > 0 ? <button className="purchase-pay-btn" onClick={() => recordPayment(purchase)}>Pay balance</button> : <span className="purchase-paid"><CheckCircle2 size={15} /></span>}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {formOpen && (
        <div className="modal-backdrop" onMouseDown={() => setFormOpen(false)}>
          <form className="purchase-form" onSubmit={savePurchase} onMouseDown={(event) => event.stopPropagation()}>
            <div className="user-form-head"><div><span>NEW PURCHASE</span><h2>Record supplier bill</h2></div><button type="button" onClick={() => setFormOpen(false)}><X size={19} /></button></div>
            <div className="purchase-meta-grid">
              <label>Supplier<select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} required><option value="">Choose supplier</option>{suppliers.map((supplier) => <option value={supplier._id} key={supplier._id}>{supplier.name} · {supplier.phone}</option>)}<option value="__new__">+ Add new supplier</option></select></label>
              <label>Supplier bill number<input value={supplierBillNumber} onChange={(event) => setSupplierBillNumber(event.target.value)} placeholder="Optional" /></label>
              <label>Purchase date<input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} required /></label>
            </div>
            {supplierId === "__new__" && (
              <div className="inline-supplier-form">
                <div><strong>New supplier details</strong><small>The supplier will be saved automatically with this purchase.</small></div>
                <div className="purchase-meta-grid">
                  <label>Supplier name<input value={newSupplier.name} onChange={(event) => setNewSupplier((current) => ({ ...current, name: event.target.value }))} required /></label>
                  <label>Phone<input value={newSupplier.phone} onChange={(event) => setNewSupplier((current) => ({ ...current, phone: event.target.value }))} required inputMode="tel" /></label>
                  <label>Contact person<input value={newSupplier.contactPerson} onChange={(event) => setNewSupplier((current) => ({ ...current, contactPerson: event.target.value }))} /></label>
                  <label>Email<input type="email" value={newSupplier.email} onChange={(event) => setNewSupplier((current) => ({ ...current, email: event.target.value }))} /></label>
                  <label>GSTIN<input value={newSupplier.gstNumber} onChange={(event) => setNewSupplier((current) => ({ ...current, gstNumber: event.target.value.toUpperCase() }))} maxLength={15} /></label>
                  <label>Address<input value={newSupplier.address} onChange={(event) => setNewSupplier((current) => ({ ...current, address: event.target.value }))} /></label>
                  <label>City<input value={newSupplier.city} onChange={(event) => setNewSupplier((current) => ({ ...current, city: event.target.value }))} /></label>
                  <label>State<input value={newSupplier.state} onChange={(event) => setNewSupplier((current) => ({ ...current, state: event.target.value }))} /></label>
                  <label>PIN code<input value={newSupplier.pincode} onChange={(event) => setNewSupplier((current) => ({ ...current, pincode: event.target.value }))} /></label>
                </div>
              </div>
            )}
            <div className="purchase-items-head"><div><strong>Products</strong><small>Stock increases after saving.</small></div><button type="button" onClick={() => setItems((current) => [...current, emptyItem()])}><Plus size={14} /> Add row</button></div>
            <div className="purchase-item-rows">
              {items.map((item, index) => (
                <div className="purchase-item-row" key={index}>
                  <label className="purchase-product-search">Product
                    <input
                      value={item.productQuery}
                      onChange={(event) => {
                        const query = event.target.value;
                        const exact = products.find((product) =>
                          [product.name, product.sku, product.barcode]
                            .filter(Boolean)
                            .some((field) => String(field).toLowerCase() === query.trim().toLowerCase()),
                        );
                        if (exact) chooseProduct(index, exact._id);
                        else updateItem(index, { productQuery: query, productId: "" });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !item.productId) {
                          const match = matchingProducts(item.productQuery)[0];
                          if (match) {
                            event.preventDefault();
                            chooseProduct(index, match._id);
                          }
                        }
                      }}
                      placeholder="Type product name, SKU or barcode"
                      autoComplete="off"
                      required
                    />
                    {!item.productId && item.productQuery.trim() && (
                      <span className="purchase-product-suggestions">
                        {matchingProducts(item.productQuery).length ? matchingProducts(item.productQuery).map((product) => (
                          <button type="button" key={product._id} onClick={() => chooseProduct(index, product._id)}>
                            <span className="purchase-suggestion-image">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : product.name.slice(0, 1).toUpperCase()}</span>
                            <span>
                            <strong>{product.name}</strong>
                            <small>{product.sku}{product.barcode ? ` · ${product.barcode}` : ""}</small>
                            </span>
                          </button>
                        )) : <em>No matching product</em>}
                      </span>
                    )}
                  </label>
                  <label>Qty<input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Math.max(1, Number(event.target.value)) })} /></label>
                  <label>Unit cost<input type="number" min="0.01" step="0.01" value={item.unitCost} onChange={(event) => updateItem(index, { unitCost: Number(event.target.value) })} /></label>
                  <label>Tax %<input type="number" min="0" max="100" step="0.01" value={item.taxPercent} onChange={(event) => updateItem(index, { taxPercent: Number(event.target.value) })} /></label>
                  <strong>₹{(item.quantity * item.unitCost * (1 + item.taxPercent / 100)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                  <button type="button" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div className="purchase-payment-grid">
              <label>Paid now<input type="number" min="0" max={total} step="0.01" value={paid} onChange={(event) => setPaid(Number(event.target.value))} /></label>
              <label>Payment method<select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank</option><option value="credit">Credit</option></select></label>
              <label className="purchase-notes">Notes<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes" /></label>
            </div>
            <div className="purchase-totals"><span>Subtotal <strong>₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></span><span>Tax <strong>₹{tax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></span><span>Total <strong>₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></span><span className={pending > 0 ? "pending" : ""}>Pending <strong>₹{pending.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></span></div>
            {error && <div className="login-error">{error}</div>}
            <button className="login-submit" disabled={saving || total <= 0}>{saving ? "Saving purchase..." : "Save purchase & update stock"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
