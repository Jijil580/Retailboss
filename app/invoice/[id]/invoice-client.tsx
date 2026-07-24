"use client";

import { ArrowLeft, Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_SHOP_SETTINGS } from "@/lib/shop-settings";

type InvoiceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxPercent: number;
  tax: number;
  total: number;
};

type InvoiceSale = {
  _id: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  pending: number;
  paymentMode: string;
  status: string;
  createdAt: string;
  seller?: typeof DEFAULT_SHOP_SETTINGS;
};

const money = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function InvoiceClient({ invoiceId }: { invoiceId: string }) {
  const [sale, setSale] = useState<InvoiceSale | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/sales?id=${encodeURIComponent(invoiceId)}`).then(async (response) => {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Unable to load invoice");
      else setSale(result.sale);
    });
  }, [invoiceId]);

  if (error) {
    return <main className="invoice-state"><strong>{error}</strong><a href="/sales">Back to sales</a></main>;
  }
  if (!sale) {
    return <main className="invoice-state">Loading invoice...</main>;
  }

  const seller = { ...DEFAULT_SHOP_SETTINGS, ...(sale.seller ?? {}) };
  const gstBill = Boolean(seller.gstEnabled);
  const address = [
    seller.address,
    [seller.city, seller.state].filter(Boolean).join(", "),
    seller.pincode,
  ].filter(Boolean).join(" · ");

  return (
    <main className="invoice-page">
      <div className="invoice-actions">
        <a href="/sales"><ArrowLeft size={17} /> Sales</a>
        <div>
          <button onClick={() => window.print()}><Printer size={16} /> Print invoice</button>
          <button onClick={() => window.print()}><Download size={16} /> Save PDF</button>
        </div>
      </div>

      <article className="invoice-sheet">
        <header className="invoice-header">
          <div className="invoice-company">
            <span className="invoice-logo">S</span>
            <div>
              <h1>{seller.brandName}</h1>
              {seller.legalName && seller.legalName !== seller.brandName && <strong>{seller.legalName}</strong>}
              {address && <p>{address}</p>}
              {(seller.phone || seller.email) && <p>{[seller.phone, seller.email].filter(Boolean).join(" · ")}</p>}
              {gstBill && <p><b>GSTIN:</b> {seller.gstNumber}</p>}
            </div>
          </div>
          <div className="invoice-title">
            <span>{gstBill ? "TAX INVOICE" : "RETAIL INVOICE"}</span>
            <h2>{sale.invoiceNumber}</h2>
            <p>{new Date(sale.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
        </header>

        <section className="invoice-meta">
          <div><span>Payment</span><strong>{sale.paymentMode}</strong></div>
          <div><span>Status</span><strong>{sale.status}</strong></div>
          <div><span>Amount paid</span><strong>{money(sale.paid)}</strong></div>
          {sale.pending > 0 && <div><span>Balance due</span><strong>{money(sale.pending)}</strong></div>}
        </section>

        <div className="invoice-table-wrap">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                {gstBill && <th>GST</th>}
                {gstBill && <th>Tax</th>}
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={`${item.name}-${index}`}>
                  <td>{index + 1}</td>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.quantity}</td>
                  <td>{money(item.unitPrice)}</td>
                  {gstBill && <td>{item.taxPercent || 0}%</td>}
                  {gstBill && <td>{money(item.tax)}</td>}
                  <td>{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="invoice-summary">
          <div className="invoice-note">
            <strong>Thank you</strong>
            <p>{seller.invoiceFooter}</p>
          </div>
          <div className="invoice-totals">
            <p><span>Subtotal</span><strong>{money(sale.subtotal)}</strong></p>
            {sale.discount > 0 && <p><span>Discount</span><strong>-{money(sale.discount)}</strong></p>}
            {gstBill && <p><span>CGST</span><strong>{money(sale.tax / 2)}</strong></p>}
            {gstBill && <p><span>SGST</span><strong>{money(sale.tax / 2)}</strong></p>}
            <p className="invoice-grand-total"><span>Total</span><strong>{money(sale.total)}</strong></p>
          </div>
        </section>

        <footer className="invoice-footer">
          <span>Computer-generated invoice</span>
          <strong>For {seller.legalName || seller.brandName}</strong>
        </footer>
      </article>
    </main>
  );
}
