"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Login failed.");
      }

      router.push("/admin");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell admin-shell">
      <section className="access-gate">
        <div className="access-card">
          <p className="section-label">Private access</p>
          <h1>Admin login</h1>
          <p>Use the staff password to open the Gift by VF admin dashboard.</p>

          <form onSubmit={handleSubmit} className="access-form">
            <label>
              Staff password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter access code"
                autoComplete="off"
              />
            </label>

            <button type="submit" className="rep-btn" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Continue"}
            </button>
          </form>

          {error ? <p className="rep-error">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
