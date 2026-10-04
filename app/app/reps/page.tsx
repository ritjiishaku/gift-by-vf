"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Product = { name: string; description: string; price: string; category: string; image: string };
type Payout = { product: string; orderAmount: number; commission: number; status: string; date: string; notes: string };
type RepData = {
  rep: { repId: string; name: string; commissionRate: string };
  products: Product[];
  payouts: Payout[];
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const naira = (amount: number) => `₦${Math.round(amount).toLocaleString("en-NG")}`;

export default function RepsPage() {
  const [data, setData] = useState<RepData | null>(null);
  const [repId, setRepId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copiedLink, setCopiedLink] = useState("");

  const loadRep = async () => {
    const response = await fetch("/api/reps/me", { cache: "no-store" });
    if (response.ok) setData(await response.json());
    else setData(null);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/reps/me", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    const response = await fetch("/api/reps/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repId, accessCode }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "Unable to sign in.");
      setBusy(false);
      return;
    }

    await loadRep();
    setBusy(false);
  };

  const logout = async () => {
    await fetch("/api/reps/logout", { method: "POST" });
    setData(null);
    setAccessCode("");
  };

  const shareLink = (product: Product) => {
    const url = new URL("/", window.location.origin);
    url.searchParams.set("ref", data?.rep.repId || "");
    url.searchParams.set("p", slugify(product.name));
    return url.toString();
  };

  const copyLink = async (product: Product) => {
    const link = shareLink(product);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
    } else {
      const input = document.createElement("textarea");
      input.value = link;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopiedLink(link);
    window.setTimeout(() => setCopiedLink(""), 1500);
  };

  const pendingTotal = data?.payouts.reduce((sum, payout) => payout.status.toLowerCase() === "paid" ? sum : sum + payout.commission, 0) ?? 0;
  const paidTotal = data?.payouts.reduce((sum, payout) => payout.status.toLowerCase() === "paid" ? sum + payout.commission : sum, 0) ?? 0;

  if (loading) return <main className="page-shell rep-shell"><section className="access-card"><h1>Loading rep tools…</h1></section></main>;

  if (!data) {
    return (
      <main className="page-shell rep-shell">
        <section className="rep-login-panel">
          <Link href="/" className="nav-logo"><span className="brand-text">Gifts by V</span><span className="brand-accent">F</span></Link>
          <p className="section-label">Sales representative</p>
          <h1>Rep sign in</h1>
          <p>Sign in with the rep ID and access code provided by the business owner.</p>
          <form className="access-form" onSubmit={handleLogin}>
            <label>Rep ID<input value={repId} onChange={(event) => setRepId(event.target.value)} autoComplete="username" required /></label>
            <label>Access code<input type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} autoComplete="current-password" required /></label>
            <button className="rep-btn" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          {error ? <p className="rep-error" role="alert">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell rep-shell">
      <header className="page-header">
        <Link href="/" className="nav-logo"><span className="brand-text">Gifts by V</span><span className="brand-accent">F</span></Link>
        <nav className="page-nav"><Link href="/">Storefront</Link><button type="button" className="logout-btn" onClick={logout}>Log out</button></nav>
      </header>
      <section className="page-hero compact">
        <p className="section-label">Rep tools</p>
        <h1>Welcome, {data.rep.name}</h1>
        <p>Your commission rate: {data.rep.commissionRate}%</p>
      </section>
      <section className="stats-grid rep-payout-summary">
        <div className="stat-card"><span>Pending commission</span><strong>{naira(pendingTotal)}</strong></div>
        <div className="stat-card"><span>Paid commission</span><strong>{naira(paidTotal)}</strong></div>
      </section>
      <section className="rep-content-section">
        <h2>Share products</h2>
        <div className="rep-product-list">
          {data.products.map((product) => {
            const link = shareLink(product);
            const whatsappShare = `https://wa.me/?text=${encodeURIComponent(link)}`;
            return (
              <article className="rep-product-row" key={product.name}>
                <img src={product.image} alt="" loading="lazy" />
                <div className="rep-product-detail"><h3>{product.name}</h3><p>{product.description}</p><strong>{product.price}</strong></div>
                <div className="rep-product-share">
                  <input aria-label={`Share link for ${product.name}`} readOnly value={link} />
                  <button className="rep-btn" type="button" onClick={() => void copyLink(product)}>{copiedLink === link ? "Copied!" : "Copy link"}</button>
                  <a className="rep-btn rep-btn-secondary" href={whatsappShare} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  <button className="rep-btn rep-btn-secondary" type="button" onClick={() => navigator.share ? void navigator.share({ title: "Gifts by VF", url: link }) : void copyLink(product)}>Share</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="rep-content-section">
        <h2>Commission history</h2>
        {data.payouts.length ? (
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>Product</th><th>Order amount</th><th>Commission</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{data.payouts.map((payout, index) => <tr key={`${payout.date}-${payout.product}-${index}`}>
              <td>{payout.product}</td><td>{naira(payout.orderAmount)}</td><td>{naira(payout.commission)}</td>
              <td><span className={`rep-status ${payout.status.toLowerCase()}`}>{payout.status}</span></td><td>{payout.date}</td>
            </tr>)}</tbody>
          </table></div>
        ) : <p>No commissions recorded yet. Referred sales will appear here once recorded.</p>}
      </section>
    </main>
  );
}
