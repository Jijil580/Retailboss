"use client";

import { ArrowLeft, CheckCircle2, Minus, Plus, ReceiptText, ScanLine, ShoppingCart, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_SHOP_SETTINGS } from "@/lib/shop-settings";

type ProductRecord = {
  _id: string;
  name: string;
  sku: string;
  category?: string;
  imageUrl?: string;
  sellingPrice: number;
  currentStock: number;
  unit: string;
  taxPercent: number;
};

type CartItem = ProductRecord & { quantity: number };

export default function PosClient() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [settings, setSettings] = useState(DEFAULT_SHOP_SETTINGS);

  const loadProducts = useCallback(async () => {
    const [response, settingsResponse] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/settings"),
    ]);
    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }
    const result = await response.json();
    setProducts(result.products ?? []);
    if (settingsResponse.ok) {
      const settingsResult = await settingsResponse.json();
      setSettings(settingsResult.settings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return products.filter((product) =>
      product.currentStock > 0 &&
      (!query || [product.name, product.sku, product.category].some((value) => String(value ?? "").toLowerCase().includes(query))),
    );
  }, [products, search]);

  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const tax = settings.gstEnabled
    ? cart.reduce(
        (sum, item) =>
          sum +
          (item.sellingPrice *
            item.quantity *
            (item.taxPercent || settings.defaultTaxPercent)) /
            100,
        0,
      )
    : 0;
  const total = subtotal + tax;

  function addProduct(product: ProductRecord) {
    setSuccess("");
    setInvoiceId("");
    setError("");
    setCart((current) => {
      const existing = current.find((item) => item._id === product._id);
      if (existing) {
        if (existing.quantity >= product.currentStock) return current;
        return current.map((item) => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(id: string, amount: number) {
    setCart((current) =>
      current
        .map((item) => item._id === id ? { ...item, quantity: Math.min(item.currentStock, item.quantity + amount) } : item)
        .filter((item) => item.quantity > 0),
    );
  }

  async function completeSale() {
    setSaving(true);
    setError("");
    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMode,
        customerName,
        customerMobile,
        items: cart.map((item) => ({ productId: item._id, quantity: item.quantity })),
      }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to complete sale");
      return;
    }
    setCart([]);
    setCustomerName("");
    setCustomerMobile("");
    setSuccess(`Sale ${result.sale.invoiceNumber} completed successfully`);
    setInvoiceId(result.sale._id);
    await loadProducts();
  }

  return (
    <main className="pos-page">
      <header className="workspace-topbar">
        <a href="/"><ArrowLeft size={18} /> Dashboard</a>
        <div className="workspace-brand"><span>S</span> Shape of You POS</div>
        <a href="/sales" className="topbar-action">Sales history</a>
      </header>
      <div className="pos-layout">
        <section className="pos-products">
          <div className="mobile-pos-summary">
            <div><span>NEW SALE</span><strong><ShoppingCart size={15} /> {cart.reduce((sum, item) => sum + item.quantity, 0)} items</strong></div>
            <b>₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b>
          </div>
          <div className="pos-heading"><div><span>POINT OF SALE</span><h1>Create a sale</h1></div><label className="data-search"><ScanLine size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Scan barcode or search product" autoFocus /></label></div>
          {loading ? <div className="data-empty">Loading products...</div> : filtered.length === 0 ? (
            <div className="data-empty"><ShoppingCart size={32} /><strong>No sellable products</strong><span>Add products with available stock first.</span><a href="/products">Go to products</a></div>
          ) : (
            <div className="pos-product-grid">
              {filtered.map((product) => (
                <button key={product._id} onClick={() => addProduct(product)}>
                  <span className="pos-product-icon">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : product.name.slice(0, 1).toUpperCase()}</span>
                  <span><strong>{product.name}</strong><small>{product.sku} · {product.currentStock} {product.unit} available</small></span>
                  <strong>₹{product.sellingPrice.toLocaleString("en-IN")}</strong>
                  <Plus size={16} />
                </button>
              ))}
            </div>
          )}
        </section>
        <aside className="pos-cart">
          <div className="cart-head"><div><span>CURRENT BILL</span><h2>{cart.length} product{cart.length === 1 ? "" : "s"}</h2></div><ShoppingCart size={22} /></div>
          {cart.length === 0 ? (
            <div className="cart-empty"><ShoppingCart size={28} /><strong>Your cart is empty</strong><span>Select a product to add it.</span></div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <article key={item._id}>
                  <span className="cart-product-image">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : item.name.slice(0, 1).toUpperCase()}</span>
                  <div><strong>{item.name}</strong><small>₹{item.sellingPrice.toLocaleString("en-IN")} each</small></div>
                  <div className="cart-qty"><button onClick={() => changeQuantity(item._id, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item._id, 1)}><Plus size={13} /></button></div>
                  <strong>₹{(item.sellingPrice * item.quantity).toLocaleString("en-IN")}</strong>
                  <button className="cart-remove" onClick={() => setCart(cart.filter((cartItem) => cartItem._id !== item._id))}><Trash2 size={14} /></button>
                </article>
              ))}
            </div>
          )}
          <div className="cart-bottom">
            <div className="pos-customer-fields">
              <label>Customer name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Walk-in customer" /></label>
              <label>Mobile number<input value={customerMobile} onChange={(event) => setCustomerMobile(event.target.value)} placeholder="Optional" inputMode="tel" /></label>
            </div>
            <label>Payment method<select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank transfer</option><option value="credit">Credit</option></select></label>
            <div className="bill-mode-row">
              <span>{settings.gstEnabled ? "GST invoice" : "Non-GST bill"}</span>
              <a href="/settings">Customize</a>
            </div>
            <div className="cart-breakdown">
              <span>Subtotal<strong>₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></span>
              {settings.gstEnabled && <span>GST<strong>₹{tax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></span>}
            </div>
            <div className="cart-total"><span>Total</span><strong>₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
            {error && <div className="login-error">{error}</div>}
            {success && <div className="sale-success"><CheckCircle2 size={16} />{success}</div>}
            {invoiceId && <a className="view-invoice-btn" href={`/invoice/${invoiceId}`}><ReceiptText size={15} /> View & print invoice</a>}
            <button className="complete-sale" disabled={cart.length === 0 || saving} onClick={completeSale}>{saving ? "Completing..." : `Complete sale · ₹${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}</button>
          </div>
        </aside>
      </div>
    </main>
  );
}
