"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Box,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Command,
  CreditCard,
  FileText,
  Grid2X2,
  HandCoins,
  LayoutDashboard,
  Menu,
  Moon,
  PackagePlus,
  Plus,
  ReceiptIndianRupee,
  ScanLine,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Sun,
  Truck,
  UserRound,
  UsersRound,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const chartData = [
  { day: "01", sales: 52000, profit: 18000 },
  { day: "05", sales: 68000, profit: 24000 },
  { day: "09", sales: 61000, profit: 21000 },
  { day: "13", sales: 86000, profit: 31000 },
  { day: "17", sales: 78000, profit: 27000 },
  { day: "21", sales: 112000, profit: 42000 },
  { day: "25", sales: 98000, profit: 35000 },
  { day: "29", sales: 128000, profit: 48000 },
];

const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Point of Sale", icon: ScanLine, hot: true },
      { label: "Sales", icon: ShoppingBag },
      { label: "Purchases", icon: ShoppingCart },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { label: "Products", icon: Box, count: "1,284" },
      { label: "Inventory", icon: Grid2X2, count: "18" },
      { label: "Customers", icon: UsersRound },
      { label: "Suppliers", icon: Truck },
      { label: "Expenses", icon: ReceiptIndianRupee },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { label: "Reports", icon: BarChart3 },
      { label: "Cash book", icon: WalletCards },
    ],
  },
];

const sales = [
  { id: "#INV-2481", customer: "Ananya Rao", initials: "AR", time: "2 min ago", items: 3, amount: "₹4,820", status: "Paid", tone: "violet" },
  { id: "#INV-2480", customer: "Walk-in customer", initials: "WC", time: "18 min ago", items: 1, amount: "₹1,299", status: "Paid", tone: "blue" },
  { id: "#INV-2479", customer: "Rohan Mehta", initials: "RM", time: "42 min ago", items: 5, amount: "₹7,540", status: "Credit", tone: "orange" },
  { id: "#INV-2478", customer: "Priya Sharma", initials: "PS", time: "1 hr ago", items: 2, amount: "₹2,680", status: "Paid", tone: "green" },
];

const stock = [
  { name: "Classic Oxford Shirt", sku: "SH-0184", stock: 3, min: 12, tone: "#6366f1" },
  { name: "Everyday Canvas Sneaker", sku: "FW-0037", stock: 4, min: 10, tone: "#f59e0b" },
  { name: "Gold Plated Hoop Set", sku: "JW-0112", stock: 0, min: 8, tone: "#ec4899" },
  { name: "Hydra Glow Serum", sku: "CS-0079", stock: 6, min: 15, tone: "#14b8a6" },
];

const quickActions = [
  { label: "New sale", hint: "Open POS", icon: ScanLine, color: "violet" },
  { label: "Add product", hint: "Create item", icon: PackagePlus, color: "blue" },
  { label: "New purchase", hint: "Stock inward", icon: ShoppingCart, color: "amber" },
  { label: "Add expense", hint: "Record spend", icon: HandCoins, color: "rose" },
];

function formatCompact(value: number) {
  return `₹${Math.round(value / 1000)}k`;
}

export default function Home() {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("Overview");
  const [range, setRange] = useState("30 days");
  const [posOpen, setPosOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setPosOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const metricCards = useMemo(
    () => [
      { label: "Today’s sales", value: "₹48,290", change: "12.4%", trend: "up", detail: "vs ₹42,960 yesterday", icon: CircleDollarSign, tone: "violet" },
      { label: "Today’s profit", value: "₹16,840", change: "8.7%", trend: "up", detail: "34.9% net margin", icon: BarChart3, tone: "green" },
      { label: "Today’s purchases", value: "₹21,620", change: "3.2%", trend: "down", detail: "8 purchase entries", icon: ShoppingCart, tone: "blue" },
      { label: "Today’s expenses", value: "₹4,280", change: "5.1%", trend: "down", detail: "5 expense entries", icon: ReceiptIndianRupee, tone: "orange" },
    ],
    [],
  );

  const navigate = (label: string) => {
    if (label === "Point of Sale") {
      setPosOpen(true);
      setMenuOpen(false);
      return;
    }
    setActive(label);
    setMenuOpen(false);
    if (label !== "Overview") setToast(`${label} module is ready for your data`);
  };

  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark"><Sparkles size={20} strokeWidth={2.5} /></span>
          <span>Retail<span>Boss</span></span>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <div className="shop-switcher">
          <div className="shop-avatar"><Store size={18} /></div>
          <div><strong>Urban Thread</strong><small>Clothing · Bengaluru</small></div>
          <ChevronDown size={16} />
        </div>

        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    className={active === item.label ? "nav-item active" : "nav-item"}
                    key={item.label}
                    onClick={() => navigate(item.label)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.hot && <i>F2</i>}
                    {item.count && <em>{item.count}</em>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item"><Settings size={18} /><span>Shop settings</span></button>
          <div className="profile">
            <div className="avatar">AK</div>
            <div><strong>Arjun Kumar</strong><small>Administrator</small></div>
            <ChevronRight size={16} />
          </div>
        </div>
      </aside>

      {menuOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <main>
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <button className="search-box" onClick={() => setSearchOpen(true)}>
              <Search size={18} />
              <span>Search anything...</span>
              <kbd><Command size={12} /> K</kbd>
            </button>
          </div>
          <div className="top-actions">
            <div className="sync"><span /> All changes saved</div>
            <button className="icon-btn" onClick={() => setDark(!dark)} aria-label="Toggle color theme">{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
            <button className="icon-btn has-alert" onClick={() => setToast("You have 3 inventory alerts")} aria-label="Notifications"><Bell size={19} /><span /></button>
            <button className="primary-btn compact" onClick={() => setPosOpen(true)}><Plus size={17} /> New sale</button>
          </div>
        </header>

        <div className="content">
          <section className="welcome">
            <div>
              <div className="eyebrow"><Zap size={13} fill="currentColor" /> THURSDAY, 23 JULY</div>
              <h1>{active === "Overview" ? "Good afternoon, Arjun" : active}</h1>
              <p>{active === "Overview" ? "Here’s what’s happening at Urban Thread today." : `Manage your ${active.toLowerCase()} from one focused workspace.`}</p>
            </div>
            <div className="period-control">
              {["Today", "7 days", "30 days"].map((item) => (
                <button className={range === item ? "selected" : ""} onClick={() => setRange(item)} key={item}>{item}</button>
              ))}
            </div>
          </section>

          {active !== "Overview" ? (
            <ModulePlaceholder name={active} onBack={() => setActive("Overview")} onAction={() => setToast(`New ${active.toLowerCase()} flow opened`)} />
          ) : (
            <>
              <section className="metrics-grid">
                {metricCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <article className="metric-card" key={card.label}>
                      <div className={`metric-icon ${card.tone}`}><Icon size={20} /></div>
                      <p>{card.label}</p>
                      <div className="metric-value-row"><strong>{card.value}</strong><span className={card.trend}>{card.trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}{card.change}</span></div>
                      <small>{card.detail}</small>
                    </article>
                  );
                })}
              </section>

              <section className="workspace-grid">
                <article className="panel performance">
                  <div className="panel-head">
                    <div><h2>Sales performance</h2><p>Revenue and profit for July 2026</p></div>
                    <button className="more-btn">This month <ChevronDown size={15} /></button>
                  </div>
                  <div className="chart-summary">
                    <div><span className="legend sales-legend" />Sales <strong>₹6,84,290</strong></div>
                    <div><span className="legend profit-legend" />Profit <strong>₹2,41,680</strong></div>
                    <span className="growth"><ArrowUpRight size={14} /> 14.2% growth</span>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7467f0" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#7467f0" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line)" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                        <YAxis tickFormatter={formatCompact} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--text)" }} formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`]} />
                        <Area type="monotone" dataKey="sales" stroke="#7467f0" strokeWidth={3} fill="url(#salesFill)" />
                        <Area type="monotone" dataKey="profit" stroke="#36b37e" strokeWidth={2.5} fill="transparent" strokeDasharray="5 4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="panel cash-card">
                  <div className="panel-head">
                    <div><h2>Money overview</h2><p>Live balances</p></div>
                    <button className="icon-btn small"><ChevronRight size={17} /></button>
                  </div>
                  <div className="balance primary-balance">
                    <div className="balance-icon"><WalletCards size={20} /></div>
                    <div><span>Cash in hand</span><strong>₹82,640</strong></div>
                    <span className="balance-trend">+₹12,420</span>
                  </div>
                  <div className="balance">
                    <div className="balance-icon bank"><CreditCard size={20} /></div>
                    <div><span>Bank balance</span><strong>₹3,42,780</strong></div>
                  </div>
                  <div className="dues-grid">
                    <div><span>Customer dues</span><strong>₹48,320</strong><small>12 accounts</small></div>
                    <div><span>Supplier dues</span><strong>₹76,850</strong><small>8 accounts</small></div>
                  </div>
                </article>
              </section>

              <section className="quick-section">
                <div className="section-label"><h2>Quick actions</h2><span>Shortcuts to keep you moving</span></div>
                <div className="quick-grid">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button key={action.label} onClick={() => action.label === "New sale" ? setPosOpen(true) : setToast(`${action.label} form opened`)}>
                        <span className={`quick-icon ${action.color}`}><Icon size={19} /></span>
                        <span><strong>{action.label}</strong><small>{action.hint}</small></span>
                        <ChevronRight size={16} />
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="bottom-grid">
                <article className="panel recent-sales">
                  <div className="panel-head">
                    <div><h2>Recent sales</h2><p>Latest invoices from today</p></div>
                    <button className="text-btn" onClick={() => setActive("Sales")}>View all <ChevronRight size={15} /></button>
                  </div>
                  <div className="sales-table">
                    {sales.map((sale) => (
                      <div className="sale-row" key={sale.id}>
                        <div className={`customer-avatar ${sale.tone}`}>{sale.initials}</div>
                        <div className="customer-cell"><strong>{sale.customer}</strong><small>{sale.id} · {sale.time}</small></div>
                        <span className="item-count">{sale.items} item{sale.items > 1 ? "s" : ""}</span>
                        <strong className="sale-amount">{sale.amount}</strong>
                        <span className={sale.status === "Paid" ? "status paid" : "status credit"}>{sale.status}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel stock-panel">
                  <div className="panel-head">
                    <div><h2>Stock alerts</h2><p>4 items need attention</p></div>
                    <span className="alert-count">18 low</span>
                  </div>
                  <div className="stock-list">
                    {stock.map((item) => (
                      <div className="stock-row" key={item.sku}>
                        <span className="product-dot" style={{ background: item.tone }}><Box size={17} /></span>
                        <div><strong>{item.name}</strong><small>{item.sku} · Min. {item.min}</small></div>
                        <span className={item.stock === 0 ? "stock-number out" : "stock-number"}>{item.stock === 0 ? "Out" : `${item.stock} left`}</span>
                      </div>
                    ))}
                  </div>
                  <button className="stock-cta" onClick={() => setActive("Inventory")}>Review inventory <ChevronRight size={16} /></button>
                </article>
              </section>
            </>
          )}
        </div>
      </main>

      {searchOpen && (
        <div className="modal-backdrop" onMouseDown={() => setSearchOpen(false)}>
          <div className="search-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="command-input"><Search size={20} /><input autoFocus placeholder="Search products, customers, invoices..." /><kbd>ESC</kbd></div>
            <p>QUICK LINKS</p>
            <button onClick={() => { setSearchOpen(false); setPosOpen(true); }}><ScanLine size={18} /><span><strong>Open Point of Sale</strong><small>Create a new bill</small></span><span>F2</span></button>
            <button onClick={() => { setSearchOpen(false); setActive("Products"); }}><Box size={18} /><span><strong>Browse products</strong><small>1,284 active products</small></span><ChevronRight size={16} /></button>
            <button onClick={() => { setSearchOpen(false); setActive("Customers"); }}><UsersRound size={18} /><span><strong>Find a customer</strong><small>Search by name or mobile</small></span><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {posOpen && <PosDrawer onClose={() => setPosOpen(false)} onComplete={() => { setPosOpen(false); setToast("Sale #INV-2482 completed successfully"); }} />}
      {toast && <div className="toast"><span><Sparkles size={16} /></span>{toast}</div>}
    </div>
  );
}

function ModulePlaceholder({ name, onBack, onAction }: { name: string; onBack: () => void; onAction: () => void }) {
  return (
    <section className="module-placeholder">
      <div className="module-art"><FileText size={42} /></div>
      <span>{name.toUpperCase()} WORKSPACE</span>
      <h2>Your {name.toLowerCase()} module is ready</h2>
      <p>This production foundation includes tenant-aware navigation, role-ready actions, responsive tables, and connected dashboard states.</p>
      <div>
        <button className="primary-btn" onClick={onAction}><Plus size={17} /> Create new</button>
        <button className="secondary-btn" onClick={onBack}>Back to overview</button>
      </div>
    </section>
  );
}

function PosDrawer({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="pos-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div><span>POINT OF SALE</span><h2>New bill</h2></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close point of sale"><X size={20} /></button>
        </div>
        <button className="scan-box"><ScanLine size={23} /><span><strong>Scan barcode or QR code</strong><small>Or search by product name / SKU</small></span><kbd>F4</kbd></button>
        <div className="bill-customer"><div className="customer-avatar violet">WC</div><div><strong>Walk-in customer</strong><small>Add customer for credit sales</small></div><button><Plus size={16} /> Add</button></div>
        <div className="bill-label"><span>CURRENT BILL</span><small>1 item</small></div>
        <div className="bill-item">
          <span className="bill-product"><ShoppingBag size={23} /></span>
          <div><strong>Classic Oxford Shirt</strong><small>Blue · M · ₹1,899</small></div>
          <div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>+</button></div>
          <strong>₹{(1899 * qty).toLocaleString("en-IN")}</strong>
        </div>
        <button className="add-line"><Plus size={17} /> Add another product</button>
        <div className="bill-summary">
          <div><span>Subtotal</span><strong>₹{(1899 * qty).toLocaleString("en-IN")}</strong></div>
          <div><span>Discount</span><button>Add discount</button></div>
          <div><span>Tax (included)</span><strong>₹{Math.round(290 * qty).toLocaleString("en-IN")}</strong></div>
          <div className="bill-total"><span>Total</span><strong>₹{(1899 * qty).toLocaleString("en-IN")}</strong></div>
        </div>
        <div className="payment-types">
          <button className="active"><CircleDollarSign size={17} /> Cash</button>
          <button><CreditCard size={17} /> UPI / Card</button>
          <button><UserRound size={17} /> Credit</button>
        </div>
        <button className="complete-sale" onClick={onComplete}><ReceiptIndianRupee size={19} /> Complete sale · ₹{(1899 * qty).toLocaleString("en-IN")}</button>
        <div className="drawer-note">Invoice will be printed automatically</div>
      </aside>
    </div>
  );
}
