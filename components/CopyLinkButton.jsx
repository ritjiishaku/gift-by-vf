"use client";

import { useState } from "react";
import { Icon } from "./icons";

export function CopyLinkButton({ slug, name, label }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}/product/${encodeURIComponent(slug || "")}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e2) {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      className={`product-share-btn js-share${copied ? " copied" : ""}`}
      onClick={copy}
      aria-label={copied ? "Link copied" : `Copy link to ${name || label || "product"}`}
      title="Copy product link"
    >
      <Icon name="link" />
    </button>
  );
}
