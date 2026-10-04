"use client";

import { useEffect, useMemo, useState } from "react";

type Product = { name: string; description: string; price: string; category: string; image: string };
type GalleryItem = { name: string; image: string };
type Testimonial = { name: string; source: string; text: string };
type TextItem = { title: string; text: string };
type Step = { number: string; title: string; text: string };
type Referral = { repId: string; name: string; arriveAt: number };
type SiteSettings = Record<string, string>;

const defaultSettings: SiteSettings = {
  whatsapp_number: "2348127252004",
  brand_name: "Gifts by V",
  brand_accent: "F",
  hero_subtitle: "Handcrafted jewelry & acrylic art — made just for you",
  hero_button_text: "Browse Catalogue",
  products_label: "What We Make",
  products_title: "Catalogue",
  products_desc: "Browse the full Gifts by VF collection and find the right piece for your idea.",
  portfolio_title: "Things We've Made",
  portfolio_desc: "Real pieces. Real customers. Real love in every stitch and edge.",
  testimonials_title: "Don't Take Our Word for It",
  testimonials_desc: "Here's what our customers have said about us.",
  why_title: "Why People Come Back",
  why_desc: "We've been doing this for 5+ years. Here's why people keep ordering.",
  order_title: "5 Simple Steps",
  order_desc: "No stress. Send us a message and we handle the rest.",
  cta_title: "Let's Make Something for You",
  cta_desc: "Tell us your idea. We'll bring it to life.",
  cta_button_text: "Message Us on WhatsApp",
  footer_text: "Gifts by VF. Handcrafted with love.",
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [reasons, setReasons] = useState<TextItem[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [referral, setReferral] = useState<Referral | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))],
    [products]
  );

  useEffect(() => {
    const loadContent = async () => {
      const response = await fetch("/api/content", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();

      setProducts(data.products ?? []);
      setGalleryItems(data.galleryItems ?? []);
      setTestimonials(data.testimonials ?? []);
      setReasons(data.reasons ?? []);
      setSteps(data.steps ?? []);
      setSettings({ ...defaultSettings, ...(data.settings ?? {}) });
    };

    loadContent();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryReferral = params.get("ref")?.replace(/[^a-z0-9_-]/gi, "").slice(0, 30).toLowerCase();
    let repId = queryReferral;
    let arriveAt = Date.now();

    if (repId) {
      window.localStorage.setItem("vf_referral", JSON.stringify({ repId, arriveAt }));
    } else {
      try {
        const saved = JSON.parse(window.localStorage.getItem("vf_referral") || "null") as Referral | null;
        const legacySaved = saved as (Referral & { rep_id?: string; arrive_at?: number }) | null;
        const savedRepId = legacySaved?.repId || legacySaved?.rep_id;
        const savedArriveAt = legacySaved?.arriveAt || legacySaved?.arrive_at || 0;
        if (!savedRepId || Date.now() - savedArriveAt > 30 * 24 * 60 * 60 * 1000) {
          window.localStorage.removeItem("vf_referral");
          return;
        }
        repId = savedRepId;
        arriveAt = savedArriveAt;
      } catch {
        window.localStorage.removeItem("vf_referral");
        return;
      }
    }

    if (!repId) return;
    fetch(`/api/referrals?ref=${encodeURIComponent(repId)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data?.name) setReferral({ repId: data.repId, name: data.name, arriveAt });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(".fade-in:not(.visible)").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [products, galleryItems, testimonials, reasons, steps]);

  useEffect(() => {
    const productId = new URLSearchParams(window.location.search).get("p");
    if (!productId || products.length === 0) return;
    const target = document.getElementById(`product-${productId}`);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("highlighted");
    const timer = window.setTimeout(() => target.classList.remove("highlighted"), 2500);
    return () => window.clearTimeout(timer);
  }, [products]);

  useEffect(() => {
    document.title = settings.site_title || "Gifts by VF";
    const description = document.querySelector('meta[name="description"]');
    if (description && settings.site_description) description.setAttribute("content", settings.site_description);
  }, [settings.site_title, settings.site_description]);

  useEffect(() => {
    if (!lightboxImage) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxImage(null);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [lightboxImage]);

  useEffect(() => {
    const onScroll = () => document.getElementById("navbar")?.classList.toggle("scrolled", window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const whatsappLink = (product?: Product) => {
    const number = (settings.whatsapp_number || defaultSettings.whatsapp_number).replace(/[^0-9]/g, "");
    const productText = product ? `I'd like to order ${product.name}${product.price ? ` (${product.price})` : ""}.` : "I would love to place an order with Gifts by VF.";
    const referralText = referral ? ` I was referred by ${referral.name}.` : "";
    return `https://wa.me/${number}?text=${encodeURIComponent(`Hello! ${productText}${referralText}`)}`;
  };

  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        normalized.length === 0 ||
        product.name.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized) ||
        product.category.toLowerCase().includes(normalized);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <main>
      {referral ? <div id="referral-banner" className="referral-banner visible" role="status">You were referred by {referral.name}</div> : null}

      <nav id="navbar">
        <div className="nav-inner">
          <a href="#home" className="nav-logo">
            <span className="brand-text">{settings.brand_name || "Gifts by V"}</span>
            <span className="brand-accent">{settings.brand_accent || "F"}</span>
          </a>
          <ul className={`nav-links${menuOpen ? " active" : ""}`} id="navLinks">
            <li><a href="#products" onClick={() => setMenuOpen(false)}>Products</a></li>
            <li><a href="#gallery" onClick={() => setMenuOpen(false)}>Our Work</a></li>
            <li><a href="#testimonials" onClick={() => setMenuOpen(false)}>Reviews</a></li>
            <li><a href="#why" onClick={() => setMenuOpen(false)}>Why Us</a></li>
            <li><a href="#order" onClick={() => setMenuOpen(false)}>How to Order</a></li>
          </ul>
          <button className={`hamburger${menuOpen ? " active" : ""}`} id="hamburger" aria-label="Menu" aria-expanded={menuOpen} type="button" onClick={() => setMenuOpen(!menuOpen)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <h1>
            <span className="brand-text">{settings.brand_name || "Gifts by V"}</span>
            <span className="brand-accent">{settings.brand_accent || "F"}</span>
          </h1>
          <p id="hero-subtitle">{settings.hero_subtitle}</p>
          <a href="#products" className="hero-btn" id="hero-button">
            {settings.hero_button_text}
          </a>
        </div>
      </section>

      <section id="products">
        <div className="section-inner">
          <div className="fade-in">
            <p className="section-label" id="products-label">{settings.products_label}</p>
            <h2 className="section-title" id="products-title">{settings.products_title}</h2>
            <p className="section-desc" id="products-desc">{settings.products_desc}</p>
          </div>

          <div className="catalogue-controls fade-in">
            <div className="catalogue-search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1113.5 9.5 4.5 4.5 0 019 14z" />
              </svg>
              <input
                type="search"
                id="catalogue-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
              />
            </div>
            <div className="catalogue-filters" id="catalogue-filters" role="group" aria-label="Filter by category">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`pill ${selectedCategory === category ? "active" : ""}`}
                  aria-pressed={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <p className="catalogue-count" id="catalogue-count" aria-live="polite">
              Showing {filteredProducts.length} of {products.length} pieces
            </p>
          </div>

          <div className="products-grid" id="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <article key={`${product.name}-${product.category}`} id={`product-${slugify(product.name)}`} className="product-card fade-in">
                  <div className="product-img">
                    <img src={product.image} alt={product.name} loading="lazy" data-full={product.image} onClick={() => setLightboxImage({ name: product.name, image: product.image })} />
                    <span className="product-badge">{product.category}</span>
                    <span className="product-pricetag">{product.price}</span>
                  </div>
                  <div className="product-body">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <a href={whatsappLink(product)} className="product-order-btn" target="_blank" rel="noopener noreferrer">
                      Order on WhatsApp
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <div className="catalogue-empty">
                <h3>No products match this search.</h3>
                <p>Try another keyword or switch back to a different category.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="gallery">
        <div className="section-inner">
          <div className="fade-in">
            <p className="section-label">
              <span id="portfolio-label">{settings.portfolio_label}</span>
            </p>
            <h2 className="section-title" id="portfolio-title">{settings.portfolio_title}</h2>
            <p className="section-desc" id="portfolio-desc">{settings.portfolio_desc}</p>
          </div>

          <div className="gallery-grid" id="gallery-grid">
            {galleryItems.map((item) => (
              <div key={item.name} className="gallery-item fade-in">
                <img src={item.image} alt={item.name} loading="lazy" data-full={item.image} onClick={() => setLightboxImage(item)} />
                <div className="gallery-label">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials">
        <div className="section-inner">
          <div className="fade-in">
            <p className="section-label">
              <span id="testimonials-label">{settings.testimonials_label}</span>
            </p>
            <h2 className="section-title" id="testimonials-title">{settings.testimonials_title}</h2>
            <p className="section-desc" id="testimonials-desc">{settings.testimonials_desc}</p>
          </div>

          <div className="testimonials-grid" id="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="testimonial-card fade-in">
                <div className="star-rating" aria-label="5 star review">
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>

                <p className="testimonial-text">“{testimonial.text}”</p>

                <div className="testimonial-author">
                  <div className="testimonial-avatar">{testimonial.name.charAt(0)}</div>
                  <div>
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-source">{testimonial.source}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why">
        <div className="section-inner">
          <div className="fade-in">
            <p className="section-label" id="why-label">{settings.why_label}</p>
            <h2 className="section-title" id="why-title">{settings.why_title}</h2>
            <p className="section-desc" id="why-desc">{settings.why_desc}</p>
          </div>

          <div className="why-grid" id="why-grid">
            {reasons.map((item) => (
              <div key={item.title} className="why-item fade-in">
                <div className="why-icon">
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="order">
        <div className="section-inner">
          <div className="fade-in">
            <p className="section-label" id="order-label">{settings.order_label}</p>
            <h2 className="section-title" id="order-title">{settings.order_title}</h2>
            <p className="section-desc" id="order-desc">{settings.order_desc}</p>
          </div>

          <div className="steps" id="steps">
            {steps.map((step) => (
              <div key={step.number} className="step fade-in">
                <div className="step-number">{step.number}</div>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta" id="cta">
        <div className="fade-in">
          <h2 id="cta-title">{settings.cta_title}</h2>
          <p id="cta-desc">{settings.cta_desc}</p>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="cta-btn" id="whatsapp-link">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span id="cta-button">{settings.cta_button_text}</span>
          </a>
        </div>
      </section>

      <footer>
        <p id="footer-text">&copy; {new Date().getFullYear()} {settings.footer_text}</p>
      </footer>

      {lightboxImage ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={lightboxImage.name} onClick={() => setLightboxImage(null)}>
          <button type="button" className="lightbox-close" aria-label="Close image" onClick={() => setLightboxImage(null)}>×</button>
          <img src={lightboxImage.image} alt={lightboxImage.name} onClick={(event) => event.stopPropagation()} />
          <p>{lightboxImage.name}</p>
        </div>
      ) : null}
    </main>
  );
}
