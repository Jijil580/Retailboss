"use client";

import { ArrowLeft, CalendarDays, Eye, Plus, ReceiptIndianRupee, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SaleRecord = {
  _id: string;
  invoiceNumber: string;
  items: Array<{ name: string; quantity: number }>;
  total: number;
  paid: number;
  pending: number;
  paymentMode: string;
  status: string;
  createdAt: string;
  customer?: { name?: string; mobile?: string };
};

export default function SalesClient({ isAdmin }: { isAdmin: boolean }) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [payment, setPayment] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/sales").then(async (response) => {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      const result = await response.json();
      setSales(result.sales ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      const searchable = [
        sale.invoiceNumber,
        sale.customer?.name,
        sale.customer?.mobile,
        ...sale.items.map((item) => item.name),
      ].join(" ").toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (month) {
        const saleMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, "0")}`;
        if (saleMonth !== month) return false;
      }
      if (fromDate && saleDate < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && saleDate > new Date(`${toDate}T23:59:59.999`)) return false;
      if (payment && sale.paymentMode !== payment) return false;
      if (status && sale.status !== status) return false;
      return true;
    });
  }, [sales, search, month, fromDate, toDate, payment, status]);

  const today = new Date().toDateString();
  const todaySales = sales.filter((sale) => new Date(sale.createdAt).toDateString() === today);
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <main className="workspace-page">
      <header className="workspace-topbar"><a href="/"><ArrowLeft size={18} /> Dashboard</a><div className="workspace-brand"><span>S</span> Shape of You</div><a href="/pos" className="topbar-action"><Plus size={16} /> New sale</a></header>
      <section className="workspace-content">
        <div className="workspace-heading"><div><span>SALES HISTORY</span><h1>Sales</h1><p>{isAdmin ? "Review all sales by date, month, customer, product and payment status." : "Your sales created today. Previous dates are available only to administrators."}</p></div><a className="primary-btn" href="/pos"><Plus size={17} /> New sale</a></div>
        <div className="workspace-stats">
          <article><ReceiptIndianRupee size={20} /><div><strong>{sales.length}</strong><span>Total invoices</span></div></article>
          <article><span className="rupee-icon">₹</span><div><strong>₹{sales.reduce((sum, sale) => sum + sale.total, 0).toLocaleString("en-IN")}</strong><span>Total sales</span></div></article>
          <article><ReceiptIndianRupee size={20} /><div><strong>{todaySales.length}</strong><span>Today’s invoices</span></div></article>
          <article><span className="rupee-icon">₹</span><div><strong>₹{todayTotal.toLocaleString("en-IN")}</strong><span>Today’s sales</span></div></article>
        </div>
        <section className="data-card">
          <div className="data-toolbar"><div><h2>Invoices</h2><span>{filtered.length} of {sales.length} records</span></div><label className="data-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Invoice, product, customer or mobile" /></label></div>
          <div className="sales-filters">
            {isAdmin && <label><CalendarDays size={15} /><span>Month</span><input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setFromDate(""); setToDate(""); }} /></label>}
            {isAdmin && <label><span>From</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setMonth(""); }} /></label>}
            {isAdmin && <label><span>To</span><input type="date" value={toDate} min={fromDate} onChange={(event) => { setToDate(event.target.value); setMonth(""); }} /></label>}
            <label><span>Payment</span><select value={payment} onChange={(event) => setPayment(event.target.value)}><option value="">All</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank</option><option value="credit">Credit</option></select></label>
            <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="credit">Credit</option><option value="cancelled">Cancelled</option><option value="returned">Returned</option></select></label>
            {(search || month || fromDate || toDate || payment || status) && <button onClick={() => { setSearch(""); setMonth(""); setFromDate(""); setToDate(""); setPayment(""); setStatus(""); }}><RotateCcw size={14} /> Clear filters</button>}
            <strong>Filtered total: ₹{filtered.reduce((sum, sale) => sum + sale.total, 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
          </div>
          {loading ? <div className="data-empty">Loading sales...</div> : filtered.length === 0 ? <div className="data-empty"><ReceiptIndianRupee size={32} /><strong>No sales yet</strong><span>Complete your first bill in the POS.</span><a href="/pos">Open POS</a></div> : (
            <div className="sales-history-list">
              {filtered.map((sale) => (
                <article key={sale._id}>
                  <span className="invoice-icon"><ReceiptIndianRupee size={18} /></span>
                  <div><strong>{sale.invoiceNumber}</strong><small>{new Date(sale.createdAt).toLocaleString("en-IN")}</small><small>{sale.customer?.name || "Walk-in customer"}{sale.customer?.mobile ? ` · ${sale.customer.mobile}` : ""}</small></div>
                  <span>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} items<small>{sale.items.map((item) => item.name).join(", ")}</small></span>
                  <span className="role-chip staff">{sale.paymentMode}</span>
                  <span className={sale.status === "paid" ? "account-status active" : "account-status"}>{sale.status}</span>
                  <strong>₹{sale.total.toLocaleString("en-IN")}</strong>
                  <a className="invoice-view-link" href={`/invoice/${sale._id}`} aria-label={`View ${sale.invoiceNumber}`}><Eye size={15} /></a>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
