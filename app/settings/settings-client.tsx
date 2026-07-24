"use client";

import {
  ArrowLeft,
  BadgeIndianRupee,
  Building2,
  CheckCircle2,
  ReceiptText,
  Save,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { DEFAULT_SHOP_SETTINGS } from "@/lib/shop-settings";

type Settings = typeof DEFAULT_SHOP_SETTINGS;

export default function SettingsClient() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SHOP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(async (response) => {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      const result = await response.json();
      if (response.ok) setSettings(result.settings);
      else setError(result.error ?? "Unable to load settings");
      setLoading(false);
    });
  }, []);

  function update<Key extends keyof Settings>(key: Key, value: Settings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to save settings");
      return;
    }
    setSettings(result.settings);
    setSaved(true);
  }

  return (
    <main className="workspace-page settings-page">
      <header className="workspace-topbar">
        <a href="/"><ArrowLeft size={18} /> Dashboard</a>
        <div className="workspace-brand"><span>S</span> Shape of You</div>
        <a href="/sales" className="topbar-action"><ReceiptText size={16} /> Bills</a>
      </header>
      <section className="workspace-content settings-content">
        <div className="workspace-heading">
          <div>
            <span>ADMIN SETTINGS</span>
            <h1>Company & billing</h1>
            <p>Customize the seller details and choose whether new bills include GST.</p>
          </div>
        </div>

        {loading ? <div className="data-empty">Loading company settings...</div> : (
          <form className="settings-form" onSubmit={submit}>
            <section className="settings-card">
              <div className="settings-card-head">
                <Building2 size={20} />
                <div><h2>Company details</h2><p>These details are printed on every new invoice.</p></div>
              </div>
              <div className="form-grid">
                <label>Brand name<input value={settings.brandName} onChange={(event) => update("brandName", event.target.value)} required /></label>
                <label>Legal company name<input value={settings.legalName} onChange={(event) => update("legalName", event.target.value)} required /></label>
                <label className="wide">Address<input value={settings.address} onChange={(event) => update("address", event.target.value)} placeholder="Shop / building / street" /></label>
                <label>City<input value={settings.city} onChange={(event) => update("city", event.target.value)} /></label>
                <label>State<input value={settings.state} onChange={(event) => update("state", event.target.value)} /></label>
                <label>PIN code<input value={settings.pincode} onChange={(event) => update("pincode", event.target.value)} inputMode="numeric" /></label>
                <label>Phone<input value={settings.phone} onChange={(event) => update("phone", event.target.value)} /></label>
                <label className="wide">Billing email<input type="email" value={settings.email} onChange={(event) => update("email", event.target.value)} /></label>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-head">
                <BadgeIndianRupee size={20} />
                <div><h2>GST billing</h2><p>Switch this on to generate tax invoices for future sales.</p></div>
              </div>
              <label className="gst-switch">
                <input type="checkbox" checked={settings.gstEnabled} onChange={(event) => update("gstEnabled", event.target.checked)} />
                <span />
                <div><strong>{settings.gstEnabled ? "GST invoices enabled" : "Non-GST bills enabled"}</strong><small>{settings.gstEnabled ? "GST is calculated per product." : "Bills show product totals without tax."}</small></div>
              </label>
              <div className="form-grid">
                <label>GSTIN<input value={settings.gstNumber} onChange={(event) => update("gstNumber", event.target.value.toUpperCase())} maxLength={15} disabled={!settings.gstEnabled} placeholder="15-character GSTIN" /></label>
                <label>Default GST rate (%)<input type="number" min="0" max="100" step="0.01" value={settings.defaultTaxPercent} onChange={(event) => update("defaultTaxPercent", Number(event.target.value))} disabled={!settings.gstEnabled} /></label>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-head">
                <ReceiptText size={20} />
                <div><h2>Bill customization</h2><p>Set the invoice number prefix and closing message.</p></div>
              </div>
              <div className="form-grid">
                <label>Bill prefix<input value={settings.billPrefix} onChange={(event) => update("billPrefix", event.target.value.toUpperCase())} maxLength={10} required /></label>
                <label className="wide">Invoice footer<textarea value={settings.invoiceFooter} onChange={(event) => update("invoiceFooter", event.target.value)} /></label>
              </div>
            </section>

            <div className="settings-savebar">
              <div>
                {error && <span className="settings-error">{error}</span>}
                {saved && <span className="settings-saved"><CheckCircle2 size={15} /> Settings saved</span>}
              </div>
              <button className="primary-btn" disabled={saving}><Save size={16} /> {saving ? "Saving..." : "Save bill settings"}</button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
