"use client";

import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Plus,
  ReceiptIndianRupee,
  RotateCcw,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type ExpenseRecord = {
  _id: string;
  expenseNumber: string;
  expenseDate: string;
  category: string;
  amount: number;
  paidTo: string;
  paymentMode: string;
  referenceNumber: string;
  description: string;
  notes: string;
  createdByName: string;
  createdAt: string;
};

const categories = [
  "Rent",
  "Salary & wages",
  "Electricity",
  "Transport",
  "Packaging",
  "Marketing",
  "Repairs & maintenance",
  "Office supplies",
  "Food & refreshments",
  "Bank charges",
  "Taxes & fees",
  "Other",
];

const todayValue = () => new Date().toISOString().slice(0, 10);

export default function ExpensesClient({ isAdmin }: { isAdmin: boolean }) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [category, setCategory] = useState("");
  const [payment, setPayment] = useState("");

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/expenses");
    if (response.status === 401 || response.status === 403) {
      window.location.href = "/";
      return;
    }
    const result = await response.json();
    setExpenses(result.expenses ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return expenses.filter((expense) => {
      const searchable = [
        expense.expenseNumber,
        expense.category,
        expense.paidTo,
        expense.description,
        expense.referenceNumber,
        expense.createdByName,
      ].join(" ").toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (category && expense.category !== category) return false;
      if (payment && expense.paymentMode !== payment) return false;
      const date = new Date(expense.expenseDate);
      if (month) {
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (value !== month) return false;
      }
      if (fromDate && date < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && date > new Date(`${toDate}T23:59:59.999`)) return false;
      return true;
    });
  }, [expenses, search, month, fromDate, toDate, category, payment]);

  async function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to save expense");
      return;
    }
    setFormOpen(false);
    await loadExpenses();
  }

  const today = new Date().toDateString();
  const todayExpenses = expenses.filter(
    (expense) => new Date(expense.expenseDate).toDateString() === today,
  );
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <main className="workspace-page">
      <header className="workspace-topbar">
        <a href="/"><ArrowLeft size={18} /> Dashboard</a>
        <div className="workspace-brand"><span>S</span> Shape of You</div>
        <button className="topbar-action topbar-button" onClick={() => { setError(""); setFormOpen(true); }}><Plus size={16} /> Add expense</button>
      </header>
      <section className="workspace-content">
        <div className="workspace-heading">
          <div><span>BUSINESS SPENDING</span><h1>Expenses</h1><p>{isAdmin ? "Review all expenses by date, month, category, payment method, or staff user." : "Your expenses created today. Previous dates are available only to administrators."}</p></div>
          <button className="primary-btn" onClick={() => { setError(""); setFormOpen(true); }}><Plus size={17} /> Add expense</button>
        </div>
        <div className="workspace-stats">
          <article><ReceiptIndianRupee size={20} /><div><strong>{expenses.length}</strong><span>{isAdmin ? "All expense records" : "Your records today"}</span></div></article>
          <article><span className="rupee-icon">₹</span><div><strong>₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong><span>{isAdmin ? "Total expenses" : "Your total today"}</span></div></article>
          <article><CalendarDays size={20} /><div><strong>{todayExpenses.length}</strong><span>Today’s entries</span></div></article>
          <article><CircleDollarSign size={20} /><div><strong>₹{todayTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong><span>Today’s expenses</span></div></article>
        </div>
        <section className="data-card">
          <div className="data-toolbar"><div><h2>Expense register</h2><span>{filtered.length} of {expenses.length} records</span></div><label className="data-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Expense, paid to, description or staff" /></label></div>
          <div className="sales-filters">
            {isAdmin && <label><CalendarDays size={14} /><span>Month</span><input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setFromDate(""); setToDate(""); }} /></label>}
            {isAdmin && <label><span>From</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setMonth(""); }} /></label>}
            {isAdmin && <label><span>To</span><input type="date" value={toDate} min={fromDate} onChange={(event) => { setToDate(event.target.value); setMonth(""); }} /></label>}
            <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
            <label><span>Payment</span><select value={payment} onChange={(event) => setPayment(event.target.value)}><option value="">All</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank</option></select></label>
            {(search || month || fromDate || toDate || category || payment) && <button onClick={() => { setSearch(""); setMonth(""); setFromDate(""); setToDate(""); setCategory(""); setPayment(""); }}><RotateCcw size={14} /> Clear</button>}
            <strong>Filtered: ₹{filtered.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
          </div>
          {loading ? <div className="data-empty">Loading expenses...</div> : filtered.length === 0 ? (
            <div className="data-empty"><WalletCards size={32} /><strong>No expenses found</strong><span>Add business spending such as rent, transport, salary, or utilities.</span><button onClick={() => setFormOpen(true)}><Plus size={15} /> Add expense</button></div>
          ) : (
            <div className="expense-list">
              {filtered.map((expense) => (
                <article key={expense._id}>
                  <span className="expense-icon"><ReceiptIndianRupee size={17} /></span>
                  <div><strong>{expense.expenseNumber}</strong><small>{new Date(expense.expenseDate).toLocaleDateString("en-IN")} · Added by {expense.createdByName}</small></div>
                  <span><strong>{expense.category}</strong><small>{expense.description}</small></span>
                  <span><strong>{expense.paidTo}</strong><small>{expense.referenceNumber || "No reference"}</small></span>
                  <span className="role-chip staff">{expense.paymentMode}</span>
                  <strong>₹{expense.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {formOpen && (
        <div className="modal-backdrop" onMouseDown={() => setFormOpen(false)}>
          <form className="product-form" onSubmit={saveExpense} onMouseDown={(event) => event.stopPropagation()}>
            <div className="user-form-head"><div><span>NEW EXPENSE</span><h2>Add expense details</h2></div><button type="button" onClick={() => setFormOpen(false)}><X size={19} /></button></div>
            <div className="form-grid">
              <label>Expense date<input name="expenseDate" type="date" defaultValue={todayValue()} disabled={!isAdmin} /></label>
              <label>Category<select name="category" required defaultValue=""><option value="" disabled>Choose category</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
              <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label>
              <label>Paid to<input name="paidTo" required placeholder="Person, company, or vendor" /></label>
              <label>Payment method<select name="paymentMode" defaultValue="cash"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank transfer</option></select></label>
              <label>Reference number<input name="referenceNumber" placeholder="Receipt / transaction number" /></label>
              <label className="wide">Description<input name="description" required placeholder="What was this expense for?" /></label>
              <label className="wide">Notes<textarea name="notes" placeholder="Optional additional details" /></label>
            </div>
            {error && <div className="login-error">{error}</div>}
            <button className="login-submit" disabled={saving}>{saving ? "Saving..." : "Save expense"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
