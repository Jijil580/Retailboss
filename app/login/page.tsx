"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@retailboss.app");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to sign in");
      window.location.href = "/";
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <span><Sparkles size={22} /></span>
          Shape of <span>You</span>
        </div>
        <div className="login-message">
          <div className="login-badge"><ShieldCheck size={15} /> SECURE WORKSPACE</div>
          <h1>Style,<br />beautifully managed.</h1>
          <p>One protected workspace for your women’s fashion brand, team, and billing.</p>
        </div>
        <small>Encrypted sessions · Role-based access · MongoDB Atlas</small>
      </section>

      <section className="login-form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-icon"><LockKeyhole size={23} /></div>
          <h2>Welcome back</h2>
          <p>Sign in to continue to Shape of You.</p>

          <label>
            Email address
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {error && <div className="login-error">{error}</div>}
          <button className="login-submit" disabled={loading}>
            {loading ? "Signing in..." : <>Sign in <ArrowRight size={17} /></>}
          </button>
          <small>Only authorized users can access this workspace.</small>
        </form>
      </section>
    </main>
  );
}
