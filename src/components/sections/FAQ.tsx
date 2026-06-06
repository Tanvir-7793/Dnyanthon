import React from "react";

export default function FAQ({ activeFaq, setActiveFaq, FAQS }: { activeFaq: number | null, setActiveFaq: React.Dispatch<React.SetStateAction<number | null>>, FAQS: { q: string, a: string }[] }) {
  return (
    <section id="faq" style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div className="section-tag">FAQ</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1px" }}>Got Questions?</h2>
        </div>
        {FAQS.map((f, i) => (
          <div key={i} className="faq-item" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{f.q}</span>
              <span style={{ fontSize: 22, color: "#6366f1", transition: "transform 0.3s", transform: activeFaq === i ? "rotate(45deg)" : "none", flexShrink: 0, marginLeft: 16 }}>+</span>
            </div>
            {activeFaq === i && (
              <p style={{ marginTop: 14, fontSize: 15, color: "rgba(232,234,240,0.55)", lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                {f.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}