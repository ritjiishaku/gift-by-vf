"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessGate } from "../components/auth-gate";

const quickActions = [
  { title: "Manage Products", description: "Add, edit, hide, and publish new products.", href: "/admin/products" },
  { title: "Manage Reps & Payouts", description: "Add or remove reps, set access codes, and update commission records.", href: "/admin/reps" },
  { title: "Site Settings", description: "Update storefront text, branding, and WhatsApp contact details.", href: "/admin/settings" },
  { title: "Rep Dashboard", description: "Review rep performance and payout activity.", href: "/reps" },
  { title: "Storefront", description: "Preview the public-facing Gift by VF storefront.", href: "/" },
];

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState([
    { label: "Products", value: "—" },
    { label: "Portfolio Items", value: "—" },
    { label: "Active Reps", value: "—" },
    { label: "Pending Payouts", value: "—" },
  ]);

  useEffect(() => {
    fetch("/api/admin/content", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((content) => {
        if (!content) return;
        const pending = (content.payouts ?? []).filter((item: { status: string }) => item.status.toLowerCase() !== "paid")
          .reduce((total: number, item: { commission: number }) => total + item.commission, 0);
        setStats([
          { label: "Products", value: String(content.products?.length ?? 0) },
          { label: "Portfolio Items", value: String(content.galleryItems?.length ?? 0) },
          { label: "Active Reps", value: String(content.reps?.filter((rep: { isActive: boolean }) => rep.isActive).length ?? 0) },
          { label: "Pending Payouts", value: `₦${Math.round(pending).toLocaleString("en-NG")}` },
        ]);
      });
  }, []);

  return (
    <AccessGate
      title="Admin access required"
      description="This dashboard is restricted to authorized Gift by VF staff and business admins."
    >
      <main className="page-shell admin-shell">
        <header className="page-header">
          <Link href="/" className="nav-logo">
            <span className="brand-text">Gifts by V</span>
            <span className="brand-accent">F</span>
          </Link>
          <nav className="page-nav">
            <Link href="/">Storefront</Link>
            <Link href="/products">Products</Link>
            <Link href="/reps">Rep Tools</Link>
            <button
              type="button"
              className="logout-btn"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                router.push("/admin/login");
              }}
            >
              Logout
            </button>
          </nav>
        </header>

        <section className="page-hero compact">
          <div>
            <p className="section-label">Admin</p>
            <h1>Business overview</h1>
          </div>
        </section>

        <section className="stats-grid">
          {stats.map((item) => (
            <div key={item.label} className="stat-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </section>

        <section className="admin-actions">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href} className="action-card">
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              <span>Open</span>
            </Link>
          ))}
        </section>
      </main>
    </AccessGate>
  );
}
