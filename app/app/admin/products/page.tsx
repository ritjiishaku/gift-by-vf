"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AccessGate } from "../../components/auth-gate";

type ProductRow = {
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      const response = await fetch("/api/admin/content");
      const data = await response.json();
      setProducts(data.products ?? []);
      setLoading(false);
    };

    loadProducts();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });

      const result = await response.json();
      if (!response.ok) {
        setUploadError(result.message || "Failed to upload image.");
        setUploading(false);
        return;
      }

      setImageUrl(result.url);
    } catch {
      setUploadError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const nextProduct = {
      name: String(formData.get("name") || "New Product"),
      description: String(formData.get("description") || "Newly added product from the Gift by VF admin panel."),
      category: String(formData.get("category") || "Jewelry"),
      price: String(formData.get("price") || "₦0"),
      image: imageUrl || String(formData.get("image") || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&h=900&q=80"),
    };

    const nextProducts = [nextProduct, ...products];
    setProducts(nextProducts);

    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: nextProducts }),
    });

    setImageUrl("");
    event.currentTarget.reset();
  };

  return (
    <AccessGate
      title="Product management"
      description="This product editor is restricted to approved Gift by VF staff only."
      storageKey="giftbyvf-admin-auth"
    >
      <main className="page-shell admin-shell">
        <header className="page-header">
          <Link href="/" className="nav-logo">
            <span className="brand-text">Gifts by V</span>
            <span className="brand-accent">F</span>
          </Link>
          <nav className="page-nav">
            <a href="/admin">Dashboard</a>
            <a href="/products">Storefront</a>
            <a href="/reps">Rep Tools</a>
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
            <h1>Product management</h1>
          </div>
        </section>

        <section className="admin-grid">
          <form onSubmit={handleSubmit} className="admin-form">
            <h3>Add new product</h3>
            <label>
              Product name
              <input name="name" type="text" placeholder="Custom Name Plaque" required />
            </label>
            <label>
              Description
              <textarea name="description" placeholder="Premium personalized gift with custom engraving." rows={3} required />
            </label>
            <label>
              Category
              <select name="category">
                <option value="Jewelry">Jewelry</option>
                <option value="Acrylic">Acrylic</option>
                <option value="Gift Sets">Gift Sets</option>
                <option value="Corporate">Corporate</option>
                <option value="Personalized">Personalized</option>
              </select>
            </label>
            <label>
              Price
              <input name="price" type="text" placeholder="₦19,000" required />
            </label>
            <label>
              Upload Photo File
              <input type="file" accept="image/*" onChange={handleFileUpload} />
              {uploading ? <small style={{ color: "#d4af37" }}>Uploading photo...</small> : null}
              {uploadError ? <small style={{ color: "#ff4d4d" }}>{uploadError}</small> : null}
            </label>
            <label>
              Or Image URL
              <input
                name="image"
                type="text"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="Upload file above or paste https://..."
              />
            </label>
            {imageUrl ? (
              <div style={{ marginTop: "10px", marginBottom: "15px" }}>
                <p style={{ fontSize: "12px", color: "var(--text-muted, #a0a0a0)", marginBottom: "5px" }}>Image preview:</p>
                <img src={imageUrl} alt="Preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)" }} />
              </div>
            ) : null}
            <button type="submit" className="rep-btn" disabled={uploading}>
              {uploading ? "Uploading..." : "Save product"}
            </button>
          </form>

          <div className="admin-list">
            <h3>Current products</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Image</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5}>Loading products...</td>
                    </tr>
                  ) : (
                    products.map((product, index) => (
                      <tr key={`${product.name}-${index}`}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>{product.price}</td>
                        <td>{product.image ? "Linked" : "—"}</td>
                        <td>
                          <button
                            type="button"
                            className="table-action danger"
                            onClick={async () => {
                              if (!window.confirm(`Delete "${product.name}"?`)) return;
                              const nextProducts = products.filter((_, i) => i !== index);
                              setProducts(nextProducts);
                              await fetch("/api/admin/content", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ products: nextProducts }),
                              });
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </AccessGate>
  );
}
