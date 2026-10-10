"use client";

import { useEffect, useState } from "react";

export function Navbar({ brandName, brandAccent, waHref }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav id="navbar" className={scrolled ? "scrolled" : ""}>
      <div className="nav-inner">
        <a href="#hero" className="nav-logo" aria-label="Gifts by VF">
          <span className="brand-name">
            <span className="brand-text">{brandName || "Gifts by V"}</span>
            <span className="brand-accent">{brandAccent || "F"}</span>
          </span>
          <span className="nav-tagline">Bespoke Gifts</span>
        </a>
        <div className="nav-actions">
          <a
            href={waHref}
            id="nav-wa-btn"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-wa-btn"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <use href="#icon-whatsapp" />
            </svg>
            <span>WhatsApp Us</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
