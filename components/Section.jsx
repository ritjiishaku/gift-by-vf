export function Section({ id, className = "", children }) {
  return (
    <section id={id} className={className}>
      <div className="section-inner">{children}</div>
    </section>
  );
}

export function SectionHeader({ label, title, desc, className = "" }) {
  return (
    <div className={className ? `catalogue-header ${className}` : "catalogue-header fade-in"}>
      {label ? <p className="section-label">{label}</p> : null}
      {title ? <h2 className="section-title">{title}</h2> : null}
      {desc ? <p className="section-desc">{desc}</p> : null}
    </div>
  );
}

export function SectionShell({ children, className = "" }) {
  return <div className={className ? `section-inner ${className}` : "section-inner"}>{children}</div>;
}
