"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AccessGate } from "../../components/auth-gate";

const fields = [
  ["site_title", "Browser title"], ["site_description", "Site description"],
  ["whatsapp_number", "WhatsApp number"], ["brand_name", "Brand name"], ["brand_accent", "Brand accent"],
  ["hero_subtitle", "Hero subtitle"], ["hero_button_text", "Hero button"],
  ["products_label", "Catalogue label"], ["products_title", "Catalogue heading"], ["products_desc", "Catalogue description"],
  ["portfolio_label", "Portfolio label"], ["portfolio_title", "Portfolio heading"], ["portfolio_desc", "Portfolio description"],
  ["testimonials_label", "Reviews label"], ["testimonials_title", "Reviews heading"], ["testimonials_desc", "Reviews description"],
  ["why_label", "Why us label"], ["why_title", "Why us heading"], ["why_desc", "Why us description"],
  ["order_label", "Order steps label"], ["order_title", "Order steps heading"], ["order_desc", "Order steps description"],
  ["cta_title", "Contact heading"], ["cta_desc", "Contact description"], ["cta_button_text", "Contact button"],
  ["footer_text", "Footer text"],
] as const;

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/content", { cache: "no-store" }).then((response) => response.json()).then((content) => setSettings(content.settings ?? {}));
  }, []);

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const updated = Object.fromEntries(fields.map(([key]) => [key, String(values.get(key) || "").trim()]));
    const response = await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: updated }) });
    if (!response.ok) {
      setMessage("Settings could not be saved. Please sign in again and retry.");
      return;
    }
    setSettings(updated);
    setMessage("Storefront settings saved.");
  };

  return (
    <AccessGate title="Site settings">
      <main className="page-shell admin-shell">
        <header className="page-header"><Link href="/admin" className="nav-logo">Gifts by VF</Link><nav className="page-nav"><Link href="/admin">Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/reps">Reps & payouts</Link></nav></header>
        <section className="page-hero compact"><p className="section-label">Admin</p><h1>Storefront settings</h1></section>
        {message ? <p className="admin-message" role="status">{message}</p> : null}
        <form className="settings-form" onSubmit={saveSettings}>
          {fields.map(([key, label]) => <label key={key}>{label}
            {key.endsWith("desc") || key === "site_description" ? <textarea name={key} value={settings[key] ?? ""} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} rows={3} /> : <input name={key} value={settings[key] ?? ""} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} />}
          </label>)}
          <button type="submit" className="rep-btn">Save settings</button>
        </form>
      </main>
    </AccessGate>
  );
}