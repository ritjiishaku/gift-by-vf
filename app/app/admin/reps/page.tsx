"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AccessGate } from "../../components/auth-gate";

type Rep = { repId: string; name: string; whatsapp: string; commissionRate: string; hasAccessCode: boolean; isActive: boolean; accessCode?: string };
type Payout = { repId: string; product: string; orderAmount: number; commission: number; status: "PAID" | "PENDING"; date: string; notes: string };
type Product = { name: string };

export default function AdminRepsPage() {
  const [reps, setReps] = useState<Rep[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [credentialsToShare, setCredentialsToShare] = useState<{ repName: string; message: string; whatsapp: string } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/content", { cache: "no-store" })
      .then((response) => response.json())
      .then((content) => {
        if (!active) return;
        setReps(content.reps ?? []);
        setPayouts(content.payouts ?? []);
        setProducts(content.products ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const saveContent = async (nextReps: Rep[], nextPayouts: Payout[]) => {
    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reps: nextReps, payouts: nextPayouts }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Could not save changes.");
    setReps(result.content.reps);
    setPayouts(result.content.payouts);
    return result.content;
  };

  const addRep = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const generatedCode = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const rep: Rep = {
      repId: String(values.get("repId") || "").trim().toLowerCase(),
      name: String(values.get("name") || "").trim(),
      whatsapp: String(values.get("whatsapp") || "").trim(),
      commissionRate: String(values.get("commissionRate") || "").trim(),
      accessCode: generatedCode,
      hasAccessCode: true,
      isActive: true,
    };

    if (reps.some((item) => item.repId.toLowerCase() === rep.repId)) {
      setMessage("That rep ID already exists.");
      return;
    }

    try {
      await saveContent([rep, ...reps], payouts);
      form.reset();
      const loginUrl = `${window.location.origin}/reps`;
      const onboardingMessage = `Hi ${rep.name}, your Gifts by VF rep portal is ready.\n\nLogin: ${loginUrl}\nRep ID: ${rep.repId}\nAccess code: ${generatedCode}\n\nPlease keep your access code private.`;
      setCredentialsToShare({ repName: rep.name, message: onboardingMessage, whatsapp: rep.whatsapp });
      setCopiedCredentials(false);
      setMessage("Rep added. Copy or send their sign-in details now; the code won’t be shown again.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save rep.");
    }
  };

  const copyCredentials = async () => {
    if (!credentialsToShare) return;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(credentialsToShare.message);
    } else {
      const input = document.createElement("textarea");
      input.value = credentialsToShare.message;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopiedCredentials(true);
  };

  const whatsappCredentialsUrl = () => {
    if (!credentialsToShare) return "#";
    const number = credentialsToShare.whatsapp.replace(/\D/g, "");
    return `https://wa.me/${number}?text=${encodeURIComponent(credentialsToShare.message)}`;
  };

  const updateRep = async (repId: string, updates: Partial<Rep>) => {
    if (updates.accessCode !== undefined && updates.accessCode.length < 8) {
      setMessage("Access codes must be at least 8 characters.");
      return;
    }
    const nextReps = reps.map((rep) => rep.repId === repId ? { ...rep, ...updates } : rep);
    try {
      await saveContent(nextReps, payouts);
      setMessage("Rep details saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save rep.");
    }
  };

  const removeRep = async (rep: Rep) => {
    if (!window.confirm(`Delete ${rep.name} and their payout history?`)) return;
    try {
      await saveContent(reps.filter((item) => item.repId !== rep.repId), payouts.filter((item) => item.repId !== rep.repId));
      setMessage("Rep and associated payout records deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete rep.");
    }
  };

  const addPayout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const payout: Payout = {
      repId: String(values.get("repId") || ""),
      product: String(values.get("product") || "").trim(),
      orderAmount: Number(values.get("orderAmount")) || 0,
      commission: Number(values.get("commission")) || 0,
      status: String(values.get("status") || "PENDING") as Payout["status"],
      date: String(values.get("date") || new Date().toISOString().slice(0, 10)),
      notes: String(values.get("notes") || "").trim(),
    };
    try {
      await saveContent(reps, [payout, ...payouts]);
      form.reset();
      setMessage("Payout record added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save payout.");
    }
  };

  const updatePayout = async (index: number, status: Payout["status"] | null) => {
    const nextPayouts = payouts.filter((_, payoutIndex) => status !== null || payoutIndex !== index)
      .map((payout, payoutIndex) => status !== null && payoutIndex === index ? { ...payout, status } : payout);
    try {
      await saveContent(reps, nextPayouts);
      setMessage(status ? "Payout status updated." : "Payout record deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update payout.");
    }
  };

  return (
    <AccessGate title="Rep and payout management">
      <main className="page-shell admin-shell">
        <header className="page-header"><Link href="/admin" className="nav-logo">Gifts by VF</Link><nav className="page-nav"><Link href="/admin">Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/settings">Settings</Link></nav></header>
        <section className="page-hero compact"><p className="section-label">Admin</p><h1>Reps & payouts</h1><p>Rep access codes are private. Share each code directly with its rep.</p></section>
        {message ? <p className="admin-message" role="status">{message}</p> : null}
        {credentialsToShare ? <section className="credential-share" aria-labelledby="credential-share-title">
          <div><p className="section-label">Rep onboarding</p><h2 id="credential-share-title">Send {credentialsToShare.repName} their sign-in</h2><p>The access code is shown only now. Save or send the message before leaving this page.</p></div>
          <textarea aria-label="Rep sign-in message" readOnly rows={6} value={credentialsToShare.message} />
          <div className="credential-share-actions">
            <button className="rep-btn" type="button" onClick={() => void copyCredentials()}>{copiedCredentials ? "Copied" : "Copy message"}</button>
            {credentialsToShare.whatsapp.replace(/\D/g, "").length >= 8 ? <a className="rep-btn rep-btn-secondary" href={whatsappCredentialsUrl()} target="_blank" rel="noopener noreferrer">Open WhatsApp</a> : <span>Add a WhatsApp number to enable direct chat.</span>}
            <button className="table-action" type="button" onClick={() => setCredentialsToShare(null)}>Dismiss</button>
          </div>
          {credentialsToShare.whatsapp.replace(/\D/g, "").length >= 8 ? <p className="credential-share-note">WhatsApp opens a prefilled message; you must press Send in WhatsApp.</p> : null}
        </section> : null}
        <section className="admin-grid">
          <form onSubmit={addRep} className="admin-form">
            <h2>Add a rep</h2>
            <label>Rep ID<input name="repId" pattern="[A-Za-z0-9_-]+" required /></label>
            <label>Name<input name="name" required /></label>
            <label>WhatsApp number<input name="whatsapp" inputMode="tel" /></label>
            <label>Commission rate (%)<input name="commissionRate" type="number" min="0" max="100" required /></label>
            <p className="rep-code-note">A unique access code will be generated and shown in a send-ready message after the rep is created.</p>
            <button type="submit" className="rep-btn">Add rep & create sign-in</button>
          </form>
          <section className="admin-list">
            <h2>Rep accounts</h2>
            <div className="admin-table-wrap"><table className="admin-table">
              <thead><tr><th>Rep</th><th>Commission</th><th>Access code</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{loading ? <tr><td colSpan={5}>Loading reps…</td></tr> : reps.map((rep) => <tr key={rep.repId}>
                <td><strong>{rep.name}</strong><br /><small>{rep.repId}</small></td><td>{rep.commissionRate}%</td>
                <td><input aria-label={`New access code for ${rep.name}`} type="password" minLength={8} value={codeDrafts[rep.repId] ?? ""} onChange={(event) => setCodeDrafts({ ...codeDrafts, [rep.repId]: event.target.value })} placeholder={rep.hasAccessCode ? "Configured" : "Not configured"} /></td>
                <td><button type="button" className="table-action" onClick={() => void updateRep(rep.repId, { isActive: !rep.isActive })}>{rep.isActive ? "Active" : "Inactive"}</button></td>
                <td><button type="button" className="table-action" disabled={!codeDrafts[rep.repId]} onClick={() => void updateRep(rep.repId, { accessCode: codeDrafts[rep.repId] }).then(() => setCodeDrafts({ ...codeDrafts, [rep.repId]: "" }))}>Set code</button><button type="button" className="table-action danger" onClick={() => void removeRep(rep)}>Delete</button></td>
              </tr>)}</tbody>
            </table></div>
          </section>
        </section>
        <section className="admin-grid payout-admin-grid">
          <form onSubmit={addPayout} className="admin-form">
            <h2>Record a commission</h2>
            <label>Rep<select name="repId" required>{reps.map((rep) => <option key={rep.repId} value={rep.repId}>{rep.name} ({rep.repId})</option>)}</select></label>
            <label>Product<input name="product" list="rep-product-list" required /><datalist id="rep-product-list">{products.map((product, index) => <option key={`${product.name}-${index}`} value={product.name} />)}</datalist></label>
            <label>Order amount (NGN)<input name="orderAmount" type="number" min="0" step="0.01" required /></label>
            <label>Commission (NGN)<input name="commission" type="number" min="0" step="0.01" required /></label>
            <label>Date<input name="date" type="date" required /></label>
            <label>Status<select name="status"><option value="PENDING">Pending</option><option value="PAID">Paid</option></select></label>
            <label>Notes<input name="notes" /></label>
            <button type="submit" className="rep-btn">Save commission</button>
          </form>
          <section className="admin-list">
            <h2>Payout records</h2>
            <div className="admin-table-wrap"><table className="admin-table">
              <thead><tr><th>Rep</th><th>Product</th><th>Order</th><th>Commission</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{payouts.map((payout, index) => <tr key={`${payout.repId}-${payout.date}-${payout.product}-${index}`}>
                <td>{payout.repId}</td><td>{payout.product}</td><td>₦{payout.orderAmount.toLocaleString()}</td><td>₦{payout.commission.toLocaleString()}</td><td>{payout.status}</td>
                <td><button type="button" className="table-action" onClick={() => void updatePayout(index, payout.status === "PAID" ? "PENDING" : "PAID")}>{payout.status === "PAID" ? "Mark pending" : "Mark paid"}</button><button type="button" className="table-action danger" onClick={() => void updatePayout(index, null)}>Delete</button></td>
              </tr>)}</tbody>
            </table></div>
          </section>
        </section>
      </main>
    </AccessGate>
  );
}