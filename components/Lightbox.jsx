"use client";

import { useEffect } from "react";
import { directImageUrl, srcVariant } from "@/lib/format";

export function openLightbox(payload) {
  window.dispatchEvent(new CustomEvent("vf:lightbox", { detail: payload }));
}

export function Lightbox() {
  useEffect(() => {
    const root = document.getElementById("lightbox");
    if (!root) return;

    const render = (detail) => {
      const { url, name, video } = detail || {};
      const caption = escapeHtml(String(name || "").trim());
      let media = "";
      if (video && video.src && video.type === "iframe") {
        media = `<iframe src="${escapeHtml(video.src)}" title="${caption}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      } else if (video && video.src) {
        const img = directImageUrl(url);
        const poster = img ? escapeHtml(srcVariant(img, 1200, 1200)) : "";
        media = `<video src="${escapeHtml(video.src)}"${poster ? ` poster="${poster}"` : ""} controls autoplay playsinline></video>`;
      } else {
        const img = directImageUrl(url);
        if (!img) return;
        media = `<img src="${escapeHtml(srcVariant(img, 1200, 1200))}" alt="${caption}" decoding="async">`;
      }
      root.innerHTML = `<button type="button" class="lightbox-close" aria-label="Close">&times;</button>
        ${media}
        ${caption ? `<p class="lightbox-caption">${caption}</p>` : ""}`;
      root.hidden = false;
      document.body.classList.add("lightbox-open");
    };

    const close = () => {
      root.hidden = true;
      root.innerHTML = "";
      document.body.classList.remove("lightbox-open");
    };

    const onEvent = (e) => render(e.detail);
    const onKey = (e) => {
      if (e.key === "Escape" && !root.hidden) close();
    };
    const onRootClick = (e) => {
      if (e.target.closest(".lightbox-close") || e.target === root) close();
    };

    window.addEventListener("vf:lightbox", onEvent);
    root.addEventListener("click", onRootClick);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("vf:lightbox", onEvent);
      root.removeEventListener("click", onRootClick);
      document.removeEventListener("keydown", onKey);
      close();
    };
  }, []);

  return <div id="lightbox" className="lightbox" hidden></div>;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
