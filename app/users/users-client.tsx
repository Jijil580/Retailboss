"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  LogOut,
  Plus,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

type UserRecord = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  permissions: string[];
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
};

const permissionOptions = [
  ["create_sales", "Create sales"],
  ["manage_products", "Manage products"],
  ["view_inventory", "View inventory"],
  ["manage_customers", "Manage customers"],
  ["manage_suppliers", "Manage suppliers"],
  ["add_expenses", "Add expenses"],
  ["view_reports", "View reports"],
];

export default function UsersClient({
  currentUser,
}: {
  currentUser: { name: string; email: string };
}) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [permissions, setPermissions] = useState<string[]>(["create_sales"]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/users");
    if (response.status === 401 || response.status === 403) {
      window.location.href = "/login";
      return;
    }
    const result = await response.json();
    setUsers(result.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role,
        permissions,
      }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to create user");
      return;
    }
    setFormOpen(false);
    setRole("staff");
    setPermissions(["create_sales"]);
    await loadUsers();
  }

  async function toggleUser(user: UserRecord) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user._id, active: !user.active }),
    });
    await loadUsers();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="users-page">
      <header className="users-topbar">
        <a href="/"><ArrowLeft size={18} /> Dashboard</a>
        <div className="users-brand"><span>S</span> Shape of You</div>
        <div className="users-profile">
          <span><strong>{currentUser.name}</strong><small>{currentUser.email}</small></span>
          <button onClick={logout} aria-label="Log out"><LogOut size={17} /></button>
        </div>
      </header>

      <section className="users-content">
        <div className="users-heading">
          <div>
            <span className="users-eyebrow"><ShieldCheck size={14} /> ADMIN ACCESS</span>
            <h1>Users & access</h1>
            <p>Create accounts and control who can access your Shape of You workspace.</p>
          </div>
          <button className="primary-btn" onClick={() => setFormOpen(true)}><UserPlus size={17} /> Add user</button>
        </div>

        <div className="users-stats">
          <article><Users size={20} /><span><strong>{users.length}</strong><small>Total users</small></span></article>
          <article><Check size={20} /><span><strong>{users.filter((user) => user.active).length}</strong><small>Active accounts</small></span></article>
          <article><ShieldCheck size={20} /><span><strong>{users.filter((user) => user.role === "admin").length}</strong><small>Administrators</small></span></article>
        </div>

        <section className="users-table-card">
          <div className="users-table-head"><h2>Team members</h2><span>{users.length} account{users.length === 1 ? "" : "s"}</span></div>
          {loading ? (
            <div className="users-loading">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="users-empty"><Users size={30} /><strong>No users yet</strong><span>Add your first team member.</span></div>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <article key={user._id}>
                  <div className="user-list-avatar">{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
                  <div className="user-list-name"><strong>{user.name}</strong><small>{user.email}</small></div>
                  <span className={`role-chip ${user.role}`}>{user.role}</span>
                  <span className={user.active ? "account-status active" : "account-status"}>{user.active ? "Active" : "Inactive"}</span>
                  <div className="user-permission-summary">{user.role === "admin" ? "Full access" : `${user.permissions.length} permissions`}</div>
                  <button className="user-toggle" onClick={() => toggleUser(user)} disabled={user.email === currentUser.email}>
                    {user.active ? "Deactivate" : "Activate"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {formOpen && (
        <div className="modal-backdrop" onMouseDown={() => setFormOpen(false)}>
          <form className="user-form" onSubmit={createUser} onMouseDown={(event) => event.stopPropagation()}>
            <div className="user-form-head"><div><span>NEW ACCOUNT</span><h2>Add a user</h2></div><button type="button" onClick={() => setFormOpen(false)}><X size={19} /></button></div>
            <label>Full name<input name="name" required minLength={2} placeholder="e.g. Priya Sharma" /></label>
            <label>Email address<input name="email" required type="email" placeholder="name@example.com" /></label>
            <label>Temporary password<input name="password" required type="password" minLength={8} autoComplete="new-password" placeholder="At least 8 characters" /></label>
            <label>Role
              <span className="select-wrap">
                <select value={role} onChange={(event) => setRole(event.target.value as "admin" | "staff")}>
                  <option value="staff">Staff user</option>
                  <option value="admin">Administrator</option>
                </select>
                <ChevronDown size={16} />
              </span>
            </label>
            {role === "staff" && (
              <fieldset>
                <legend>Permissions</legend>
                <div className="permission-grid">
                  {permissionOptions.map(([value, label]) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={permissions.includes(value)}
                        onChange={(event) => setPermissions(event.target.checked ? [...permissions, value] : permissions.filter((permission) => permission !== value))}
                      />
                      <span><Check size={13} />{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {error && <div className="login-error">{error}</div>}
            <button className="login-submit" disabled={saving}>{saving ? "Creating..." : <><Plus size={17} /> Create user</>}</button>
          </form>
        </div>
      )}
    </main>
  );
}
