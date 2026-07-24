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
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type NavigationGroup = {
  label: string;
  items: Array<{
    label: string;
    icon: LucideIcon;
    hot?: boolean;
    count?: string;
  }>;
};

const navGroups: NavigationGroup[] = [
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
      { label: "Products", icon: Box, count: "0" },
      { label: "Inventory", icon: Grid2X2, count: "0" },
      { label: "Customers", icon: UsersRound },
      { label: "Suppliers", icon: Truck },
      { label: "Expenses", icon: ReceiptIndianRupee },
      { label: "Users & access", icon: UserRound },
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

type DashboardSale = {
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

const stock: Array<{
  name: string;
  sku: string;
  stock: number;
  min: number;
  tone: string;
}> = [];

const quickActions = [
  { label: "New sale", hint: "Open POS", icon: ScanLine, color: "violet" },
  { label: "Add product", hint: "Create item", icon: PackagePlus, color: "blue" },
  { label: "New purchase", hint: "Stock inward", icon: ShoppingCart, color: "amber" },
  { label: "Add expense", hint: "Record spend", icon: HandCoins, color: "rose" },
];

function formatCompact(value: number) {
  return `₹${Math.round(value / 1000)}k`;
}

export default function DashboardClient({
  currentUser,
}: {
  currentUser: { name: string; email: string; role: string };
}) {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("Overview");
  const [range, setRange] = useState("30 days");
  const [posOpen, setPosOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [sales, setSales] = useState<DashboardSale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sales?limit=1000").then(async (response) => {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      const result = await response.json();
      setSales(result.sales ?? []);
      setSalesLoading(false);
    }).catch(() => setSalesLoading(false));
  }, []);

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

  const rangeDays = range === "Today" ? 1 : range === "7 days" ? 7 : 30;
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - (rangeDays - 1));
  const rangeSales = sales.filter((sale) => new Date(sale.createdAt) >= rangeStart);
  const today = new Date().toDateString();
  const todaySales = sales.filter((sale) => new Date(sale.createdAt).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayItems = todaySales.reduce(
    (sum, sale) => sum + sale.items.reduce((count, item) => count + item.quantity, 0),
    0,
  );
  const totalRangeSales = rangeSales.reduce((sum, sale) => sum + sale.total, 0);
  const rangePending = rangeSales.reduce((sum, sale) => sum + sale.pending, 0);
  const rangePaid = rangeSales.reduce((sum, sale) => sum + sale.paid, 0);
  const recentSales = sales.slice(0, 5);
  const chartData = Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(rangeStart.getDate() + index);
    const key = date.toDateString();
    return {
      day: rangeDays === 1 ? "Today" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      sales: sales
        .filter((sale) => new Date(sale.createdAt).toDateString() === key)
        .reduce((sum, sale) => sum + sale.total, 0),
    };
  });

  const metricCards = useMemo(
    () => [
      { label: "Today’s sales", value: `₹${todayRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, change: `${todaySales.length}`, trend: "neutral", detail: `${todaySales.length} invoice${todaySales.length === 1 ? "" : "s"} today`, icon: CircleDollarSign, tone: "violet" },
      { label: "Items sold today", value: String(todayItems), change: `${todaySales.length}`, trend: "neutral", detail: "Across today’s completed bills", icon: ShoppingBag, tone: "green" },
      { label: `${range} revenue`, value: `₹${totalRangeSales.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, change: `${rangeSales.length}`, trend: "neutral", detail: `${rangeSales.length} invoice${rangeSales.length === 1 ? "" : "s"} in this period`, icon: BarChart3, tone: "blue" },
      { label: "Customer dues", value: `₹${rangePending.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, change: "", trend: "neutral", detail: "Outstanding in selected period", icon: ReceiptIndianRupee, tone: "orange" },
    ],
    [todayRevenue, todaySales.length, todayItems, range, totalRangeSales, rangeSales.length, rangePending],
  );

  const navigate = (label: string) => {
    if (label === "Products" || label === "Inventory") {
      window.location.href = "/products";
      return;
    }
    if (label === "Sales") {
      window.location.href = "/sales";
      return;
    }
    if (label === "Users & access") {
      window.location.href = "/users";
      return;
    }
    if (label === "Point of Sale") {
      window.location.href = "/pos";
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
          <span>Shape of <span>You</span></span>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <div className="shop-switcher">
          <div className="shop-avatar"><Store size={18} /></div>
          <div><strong>Shape of You</strong><small>Women’s Fashion · Bengaluru</small></div>
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
          <button className="nav-item" onClick={() => { window.location.href = "/settings"; }}><Settings size={18} /><span>Company & billing</span></button>
          <div className="profile">
            <div className="avatar">{currentUser.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
            <div><strong>{currentUser.name}</strong><small>{currentUser.role === "admin" ? "Administrator" : "Staff user"}</small></div>
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
            <button className="primary-btn compact" onClick={() => { window.location.href = "/pos"; }}><Plus size={17} /> New sale</button>
          </div>
        </header>

        <div className="content">
          <section className="welcome">
            <div>
              <div className="eyebrow"><Zap size={13} fill="currentColor" /> {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" }).toUpperCase()}</div>
              <h1>{active === "Overview" ? `Welcome, ${currentUser.name.split(" ")[0]}` : active}</h1>
              <p>{active === "Overview" ? "Here’s what’s happening at Shape of You today." : `Manage your ${active.toLowerCase()} from one focused workspace.`}</p>
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
                      <div className="metric-value-row"><strong>{card.value}</strong><span className={card.trend}>{card.trend === "up" ? <ArrowUpRight size={14} /> : card.trend === "down" ? <ArrowDownLeft size={14} /> : "— "}{card.change}</span></div>
                      <small>{card.detail}</small>
                    </article>
                  );
                })}
              </section>

              <section className="workspace-grid">
                <article className="panel performance">
                  <div className="panel-head">
                    <div><h2>Sales performance</h2><p>Live revenue for the selected period</p></div>
                    <button className="more-btn">{range} <ChevronDown size={15} /></button>
                  </div>
                  <div className="chart-summary">
                    <div><span className="legend sales-legend" />Sales <strong>₹{totalRangeSales.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
                    <div><span className="legend profit-legend" />Paid <strong>₹{rangePaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
                    <span className="growth">{rangeSales.length ? `${rangeSales.length} invoices` : "No activity yet"}</span>
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
                    <div><span>Cash sales</span><strong>₹{rangeSales.filter((sale) => sale.paymentMode === "cash").reduce((sum, sale) => sum + sale.paid, 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
                    <span className="balance-trend">{range}</span>
                  </div>
                  <div className="balance">
                    <div className="balance-icon bank"><CreditCard size={20} /></div>
                    <div><span>Digital sales</span><strong>₹{rangeSales.filter((sale) => ["upi", "card", "bank"].includes(sale.paymentMode)).reduce((sum, sale) => sum + sale.paid, 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
                  </div>
                  <div className="dues-grid">
                    <div><span>Customer dues</span><strong>₹{rangePending.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong><small>{rangeSales.filter((sale) => sale.pending > 0).length} invoices</small></div>
                    <div><span>Total collected</span><strong>₹{rangePaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong><small>{rangeSales.length} invoices</small></div>
                  </div>
                </article>
              </section>

              <section className="quick-section">
                <div className="section-label"><h2>Quick actions</h2><span>Shortcuts to keep you moving</span></div>
                <div className="quick-grid">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button key={action.label} onClick={() => action.label === "New sale" ? window.location.href = "/pos" : action.label === "Add product" ? window.location.href = "/products" : setToast(`${action.label} form opened`)}>
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
                    <button className="text-btn" onClick={() => { window.location.href = "/sales"; }}>View all <ChevronRight size={15} /></button>
                  </div>
                  <div className="sales-table">
                    {salesLoading ? (
                      <div className="empty-list"><strong>Loading sales...</strong></div>
                    ) : recentSales.length === 0 ? (
                      <div className="empty-list"><ReceiptIndianRupee size={22} /><strong>No sales yet</strong><span>Completed bills will appear here.</span></div>
                    ) : recentSales.map((sale) => {
                      const customerName = sale.customer?.name || "Walk-in customer";
                      const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                      return (
                      <div className="sale-row" key={sale._id}>
                        <div className="customer-avatar violet">{customerName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
                        <div className="customer-cell"><strong>{customerName}</strong><small>{sale.invoiceNumber} · {new Date(sale.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small></div>
                        <span className="item-count">{itemCount} item{itemCount === 1 ? "" : "s"}</span>
                        <strong className="sale-amount">₹{sale.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                        <span className={sale.status === "paid" ? "status paid" : "status credit"}>{sale.status}</span>
                      </div>
                    );})}
                  </div>
                </article>

                <article className="panel stock-panel">
                  <div className="panel-head">
                    <div><h2>Stock alerts</h2><p>No items need attention</p></div>
                    <span className="alert-count">0 low</span>
                  </div>
                  <div className="stock-list">
                    {stock.length === 0 ? (
                      <div className="empty-list compact-empty"><Box size={22} /><strong>No stock alerts</strong><span>Add products to begin tracking inventory.</span></div>
                    ) : stock.map((item) => (
                      <div className="stock-row" key={item.sku}>
                        <span className="product-dot" style={{ background: item.tone }}><Box size={17} /></span>
                        <div><strong>{item.name}</strong><small>{item.sku} · Min. {item.min}</small></div>
                        <span className={item.stock === 0 ? "stock-number out" : "stock-number"}>{item.stock === 0 ? "Out" : `${item.stock} left`}</span>
                      </div>
                    ))}
                  </div>
                  <button className="stock-cta" onClick={() => { window.location.href = "/products"; }}>Review inventory <ChevronRight size={16} /></button>
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
            <button onClick={() => { window.location.href = "/pos"; }}><ScanLine size={18} /><span><strong>Open Point of Sale</strong><small>Create a new bill</small></span><span>F2</span></button>
            <button onClick={() => { window.location.href = "/products"; }}><Box size={18} /><span><strong>Browse products</strong><small>Manage catalog and inventory</small></span><ChevronRight size={16} /></button>
            <button onClick={() => { setSearchOpen(false); setActive("Customers"); }}><UsersRound size={18} /><span><strong>Find a customer</strong><small>Search by name or mobile</small></span><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {posOpen && <PosDrawer onClose={() => setPosOpen(false)} />}
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

function PosDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="pos-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div><span>POINT OF SALE</span><h2>New bill</h2></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close point of sale"><X size={20} /></button>
        </div>
        <button className="scan-box"><ScanLine size={23} /><span><strong>Scan barcode or QR code</strong><small>Or search by product name / SKU</small></span><kbd>F4</kbd></button>
        <div className="bill-customer"><div className="customer-avatar violet">WC</div><div><strong>Walk-in customer</strong><small>Add customer for credit sales</small></div><button><Plus size={16} /> Add</button></div>
        <div className="bill-label"><span>CURRENT BILL</span><small>0 items</small></div>
        <div className="empty-bill"><ShoppingBag size={25} /><strong>Your bill is empty</strong><span>Scan a barcode or add a product to get started.</span></div>
        <button className="add-line"><Plus size={17} /> Add another product</button>
        <div className="bill-summary">
          <div><span>Subtotal</span><strong>₹0</strong></div>
          <div><span>Discount</span><button>Add discount</button></div>
          <div><span>Tax (included)</span><strong>₹0</strong></div>
          <div className="bill-total"><span>Total</span><strong>₹0</strong></div>
        </div>
        <div className="payment-types">
          <button className="active"><CircleDollarSign size={17} /> Cash</button>
          <button><CreditCard size={17} /> UPI / Card</button>
          <button><UserRound size={17} /> Credit</button>
        </div>
        <button className="complete-sale" disabled><ReceiptIndianRupee size={19} /> Add products to continue</button>
        <div className="drawer-note">Invoice will be printed automatically</div>
      </aside>
    </div>
  );
}
