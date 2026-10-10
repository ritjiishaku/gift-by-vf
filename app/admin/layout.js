import Link from "next/link";

export const metadata = {
  title: "Admin",
  robots: { index: false },
};

export default function AdminLayout({ children }) {
  return (
    <>
      <header className="rep-header">
        <Link href="/" className="nav-logo" aria-label="Gifts by VF">
          <span className="brand-name">
            <span className="brand-text">Gifts by V</span>
            <span className="brand-accent">F</span>
          </span>
          <span className="nav-tagline">Bespoke Gifts</span>
        </Link>
        <span className="rep-tag">Owner Admin</span>
      </header>
      <main className="admin-page">
        <section className="page-hero admin-hero">
          <div className="page-hero-copy">
            <p className="section-label">Owner area</p>
            <h1>Manage your gift catalogue</h1>
            <p>Update products, reps and site content from one polished admin area.</p>
          </div>
          <div className="gift-chips" aria-label="Admin focus areas">
            <span>Settings</span>
            <span>Products</span>
            <span>Reps</span>
          </div>
        </section>
        {children}
      </main>
    </>
  );
}
