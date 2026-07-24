"use client";

import {
  ArrowLeft,
  Barcode,
  Box,
  Camera,
  Edit3,
  PackagePlus,
  Plus,
  Printer,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import JsBarcode from "jsbarcode";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type ProductRecord = {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category?: string;
  brand?: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  taxPercent: number;
  unit: string;
  description?: string;
};

type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

const emptyProduct: Partial<ProductRecord> = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  brand: "",
  purchasePrice: 0,
  sellingPrice: 0,
  currentStock: 0,
  minimumStock: 0,
  taxPercent: 0,
  unit: "pcs",
  description: "",
};

export default function ProductsClient({ canManage }: { canManage: boolean }) {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ProductRecord>>(emptyProduct);
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [printProduct, setPrintProduct] = useState<ProductRecord | null>(null);
  const [labelCount, setLabelCount] = useState(1);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const scannerVideoRef = useRef<HTMLVideoElement>(null);
  const barcodePrintSheetRef = useRef<HTMLDivElement>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/products");
    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }
    const result = await response.json();
    setProducts(result.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!scannerOpen) return;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let cancelled = false;
    let detecting = false;

    async function startScanner() {
      setScannerError("");
      const Detector = (
        window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
      ).BarcodeDetector;
      if (!Detector) {
        setScannerError(
          "Camera barcode detection is unavailable in this browser. Connect a USB/Bluetooth scanner and use the barcode field.",
        );
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerError("Camera access is unavailable. Use a USB/Bluetooth barcode scanner.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled || !scannerVideoRef.current) return;
        scannerVideoRef.current.srcObject = stream;
        await scannerVideoRef.current.play();
        const detector = new Detector({
          formats: [
            "code_128",
            "code_39",
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "itf",
            "codabar",
            "qr_code",
          ],
        });
        timer = window.setInterval(async () => {
          if (detecting || !scannerVideoRef.current) return;
          detecting = true;
          try {
            const results = await detector.detect(scannerVideoRef.current);
            const value = results[0]?.rawValue?.trim();
            if (value && barcodeInputRef.current) {
              barcodeInputRef.current.value = value;
              setEditing((current) => ({ ...current, barcode: value }));
              setScannerOpen(false);
              window.setTimeout(() => barcodeInputRef.current?.focus(), 50);
            }
          } catch {
            // Keep scanning; individual frames can fail while the camera focuses.
          } finally {
            detecting = false;
          }
        }, 350);
      } catch {
        setScannerError(
          "Camera permission was denied or no camera was found. Use a USB/Bluetooth scanner instead.",
        );
      }
    }

    startScanner();
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
      if (scannerVideoRef.current) scannerVideoRef.current.srcObject = null;
    };
  }, [scannerOpen]);

  useEffect(() => {
    if (!printProduct || !barcodePrintSheetRef.current) return;
    barcodePrintSheetRef.current
      .querySelectorAll<SVGSVGElement>("svg[data-barcode]")
      .forEach((element) => {
        JsBarcode(element, printProduct.barcode || printProduct.sku, {
          format: "CODE128",
          width: 1.7,
          height: 52,
          displayValue: true,
          fontSize: 12,
          margin: 4,
        });
      });
  }, [printProduct, labelCount]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.sku, product.barcode, product.category, product.brand]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [products, search]);

  const totalStock = products.reduce((sum, product) => sum + product.currentStock, 0);
  const lowStock = products.filter((product) => product.currentStock <= product.minimumStock).length;
  const inventoryValue = products.reduce(
    (sum, product) => sum + product.purchasePrice * product.currentStock,
    0,
  );

  function openCreate() {
    setEditing({ ...emptyProduct });
    setError("");
    setFormOpen(true);
  }

  function openEdit(product: ProductRecord) {
    setEditing({ ...product });
    setError("");
    setFormOpen(true);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/products", {
      method: editing._id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, id: editing._id }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to save product");
      return;
    }
    setFormOpen(false);
    await loadProducts();
  }

  async function removeProduct(product: ProductRecord) {
    if (!window.confirm(`Remove ${product.name}? Existing sales history will be preserved.`)) return;
    const response = await fetch(`/api/products?id=${encodeURIComponent(product._id)}`, {
      method: "DELETE",
    });
    if (response.ok) await loadProducts();
  }

  function openBarcodePrint(product: ProductRecord) {
    if (!product.barcode) {
      window.alert("Add or scan a barcode for this product before printing labels.");
      return;
    }
    setLabelCount(1);
    setPrintProduct(product);
  }

  function printBarcodes() {
    document.body.classList.add("barcode-printing");
    const cleanup = () => document.body.classList.remove("barcode-printing");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1500);
  }

  return (
    <main className="workspace-page">
      <header className="workspace-topbar">
        <a href="/"><ArrowLeft size={18} /> Dashboard</a>
        <div className="workspace-brand"><span>S</span> Shape of You</div>
        <a href="/pos" className="topbar-action"><Plus size={16} /> New sale</a>
      </header>
      <section className="workspace-content">
        <div className="workspace-heading">
          <div><span>CATALOG & INVENTORY</span><h1>Products</h1><p>Add products, set prices, and maintain stock in real time.</p></div>
          {canManage && <button className="primary-btn" onClick={openCreate}><PackagePlus size={17} /> Add product</button>}
        </div>
        <div className="workspace-stats">
          <article><Box size={20} /><div><strong>{products.length}</strong><span>Active products</span></div></article>
          <article><PackagePlus size={20} /><div><strong>{totalStock}</strong><span>Units in stock</span></div></article>
          <article className={lowStock ? "warning" : ""}><TriangleAlert size={20} /><div><strong>{lowStock}</strong><span>Low-stock items</span></div></article>
          <article><span className="rupee-icon">₹</span><div><strong>₹{inventoryValue.toLocaleString("en-IN")}</strong><span>Inventory value</span></div></article>
        </div>
        <section className="data-card">
          <div className="data-toolbar">
            <div><h2>Product catalog</h2><span>{filtered.length} products</span></div>
            <label className="data-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, SKU or barcode" /></label>
          </div>
          {loading ? <div className="data-empty">Loading products...</div> : filtered.length === 0 ? (
            <div className="data-empty"><Box size={32} /><strong>No products found</strong><span>Add your first product to begin billing.</span>{canManage && <button onClick={openCreate}><Plus size={16} /> Add product</button>}</div>
          ) : (
            <div className="product-table">
              <div className="product-table-header"><span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Status</span><span /></div>
              {filtered.map((product) => {
                const isLow = product.currentStock <= product.minimumStock;
                return (
                  <article key={product._id}>
                    <div className="product-name-cell"><span><Box size={18} /></span><div><strong>{product.name}</strong><small>{product.sku}{product.barcode ? ` · ${product.barcode}` : ""}</small></div></div>
                    <span>{product.category || "Uncategorized"}<small>{product.brand || "No brand"}</small></span>
                    <strong>₹{product.sellingPrice.toLocaleString("en-IN")}<small>Cost ₹{product.purchasePrice.toLocaleString("en-IN")}</small></strong>
                    <strong>{product.currentStock} {product.unit}<small>Minimum {product.minimumStock}</small></strong>
                    <span className={isLow ? "stock-chip low" : "stock-chip"}>{isLow ? "Low stock" : "In stock"}</span>
                    {canManage && <div className="row-actions">{product.barcode && <button onClick={() => openBarcodePrint(product)} aria-label="Print barcode"><Printer size={15} /></button>}<button onClick={() => openEdit(product)} aria-label="Edit product"><Edit3 size={15} /></button><button onClick={() => removeProduct(product)} aria-label="Delete product"><Trash2 size={15} /></button></div>}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
      {formOpen && (
        <div className="modal-backdrop" onMouseDown={() => setFormOpen(false)}>
          <form className="product-form" onSubmit={saveProduct} onMouseDown={(event) => event.stopPropagation()}>
            <div className="user-form-head"><div><span>{editing._id ? "EDIT PRODUCT" : "NEW PRODUCT"}</span><h2>{editing._id ? "Update product" : "Add a product"}</h2></div><button type="button" onClick={() => setFormOpen(false)}><X size={19} /></button></div>
            <div className="form-grid">
              <label className="wide">Product name<input name="name" defaultValue={editing.name} required placeholder="e.g. Cotton Shirt" /></label>
              <label>SKU<input name="sku" defaultValue={editing.sku} required placeholder="SH-001" /></label>
              <label className="barcode-field">Barcode
                <span className="barcode-input-row">
                  <input ref={barcodeInputRef} name="barcode" defaultValue={editing.barcode} placeholder="Scan or enter barcode" onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} />
                  <button type="button" onClick={() => setScannerOpen(true)} title="Scan with camera"><Camera size={16} /> Scan</button>
                </span>
                <small>USB/Bluetooth scanners can scan directly into this field.</small>
              </label>
              <label>Category<input name="category" defaultValue={editing.category} placeholder="Women’s wear" /></label>
              <label>Brand<input name="brand" defaultValue={editing.brand} placeholder="Brand name" /></label>
              <label>Purchase price<input name="purchasePrice" type="number" min="0" step="0.01" defaultValue={editing.purchasePrice} required /></label>
              <label>Selling price<input name="sellingPrice" type="number" min="0.01" step="0.01" defaultValue={editing.sellingPrice} required /></label>
              <label>Opening stock<input name="currentStock" type="number" min="0" step="1" defaultValue={editing.currentStock} required /></label>
              <label>Minimum stock<input name="minimumStock" type="number" min="0" step="1" defaultValue={editing.minimumStock} required /></label>
              <label>Tax %<input name="taxPercent" type="number" min="0" step="0.01" defaultValue={editing.taxPercent} /></label>
              <label>Unit<input name="unit" defaultValue={editing.unit} placeholder="pcs" /></label>
              <label className="wide">Description<textarea name="description" defaultValue={editing.description} placeholder="Optional product notes" /></label>
            </div>
            {error && <div className="login-error">{error}</div>}
            <button className="login-submit" disabled={saving}>{saving ? "Saving..." : editing._id ? "Update product" : "Add product"}</button>
          </form>
        </div>
      )}

      {scannerOpen && (
        <div className="modal-backdrop barcode-scanner-backdrop" onMouseDown={() => setScannerOpen(false)}>
          <section className="barcode-scanner-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="user-form-head"><div><span>CAMERA SCANNER</span><h2>Scan product barcode</h2></div><button type="button" onClick={() => setScannerOpen(false)}><X size={19} /></button></div>
            <div className="scanner-view">
              <video ref={scannerVideoRef} muted playsInline />
              <div className="scanner-target"><span /></div>
              <Barcode size={30} />
            </div>
            <p>Hold the barcode inside the frame. It will be captured automatically.</p>
            {scannerError && <div className="login-error">{scannerError}</div>}
            <button className="secondary-scanner-btn" type="button" onClick={() => { setScannerOpen(false); window.setTimeout(() => barcodeInputRef.current?.focus(), 50); }}><Barcode size={16} /> Use external scanner</button>
          </section>
        </div>
      )}

      {printProduct && (
        <div className="modal-backdrop" onMouseDown={() => setPrintProduct(null)}>
          <section className="barcode-print-dialog" onMouseDown={(event) => event.stopPropagation()}>
            <div className="user-form-head"><div><span>BARCODE LABELS</span><h2>Print {printProduct.name}</h2></div><button type="button" onClick={() => setPrintProduct(null)}><X size={19} /></button></div>
            <div className="barcode-print-controls">
              <label>Number of labels<input type="number" min="1" max="100" value={labelCount} onChange={(event) => setLabelCount(Math.min(100, Math.max(1, Number(event.target.value) || 1)))} /></label>
              <button onClick={printBarcodes}><Printer size={16} /> Print labels</button>
            </div>
            <div className="barcode-print-sheet" ref={barcodePrintSheetRef}>
              {Array.from({ length: labelCount }, (_, index) => (
                <article className="barcode-label" key={index}>
                  <strong>Shape of You</strong>
                  <span>{printProduct.name}</span>
                  <svg data-barcode />
                  <small>MRP ₹{printProduct.sellingPrice.toLocaleString("en-IN")}</small>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
