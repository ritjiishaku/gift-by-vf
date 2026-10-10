import { Icon } from "./icons";

export function WhyUs({ label, title, desc, rows }) {
  if (!rows || rows.length === 0) return null;

  return (
    <section id="why-us" className="side-section">
      <div className="section-inner">
        <div className="catalogue-header fade-in">
          <p className="section-label" id="why-label">{label}</p>
          <h2 className="section-title" id="why-title">{title}</h2>
          <p className="section-desc" id="why-desc">{desc}</p>
        </div>
        <div className="why-grid fade-in" id="why-grid">
          {rows.map((row, i) => (
            <div key={row.id || i} className="why-card">
              <span className="why-icon">
                <Icon name={String(row.icon || "").trim().toLowerCase()} />
              </span>
              <h3>{row.title || row.heading}</h3>
              <p>{row.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
