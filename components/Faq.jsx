export function Faq({ label, title, rows }) {
  const list = (rows || []).filter(
    (r) => String(r.question || "").trim() !== "" && String(r.answer || "").trim() !== ""
  );
  if (list.length === 0) return null;

  return (
    <section id="faq" className="side-section alt fade-in">
      <div className="section-inner">
        <div className="catalogue-header">
          <p className="section-label" id="faq-label">{label}</p>
          <h2 className="section-title" id="faq-title">{title}</h2>
        </div>
        <div className="faq-list fade-in" id="faq-grid">
          {list.map((row, i) => (
            <details key={row.id || i} className="faq-item">
              <summary>{row.question}</summary>
              <p>{row.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
