import Link from "next/link";

export default function RegisterCTA() {
  return (
    <section id="register" style={{ padding: "80px 24px", position: "relative", overflow: "hidden" }}>
      <div className="bg-orb" style={{ width: 700, height: 700, background: "#6366f122", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      <div style={{
        maxWidth: 720, margin: "0 auto", textAlign: "center",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: 28, position: "relative",
        boxShadow: "0 0 80px rgba(99,102,241,0.1)",
      }} className="register-box">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "6px 18px", borderRadius: 50, marginBottom: 28 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600, letterSpacing: 1 }}>REGISTRATIONS OPEN</span>
        </div>
        <h2 className="register-heading" style={{ fontWeight: 800, lineHeight: 1.15, marginBottom: 18, letterSpacing: "-1px" }}>
          Ready to Build Something{" "}
          <span style={{ background: "linear-gradient(135deg,#6366f1,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Legendary?
          </span>
        </h2>
        <p style={{ fontSize: 16, color: "rgba(232,234,240,0.55)", marginBottom: 36, lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
          Join 1,200+ builders at Dnyanothon 2026. Registration is free. Meals and accommodation provided. Just bring your best ideas.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/login?next=/register" className="no-underline">
            <button className="btn-primary" style={{ fontSize: 17, padding: "16px 44px" }}>
              Register Your Team →
            </button>
          </Link>
          <Link href="/Dnyanothon_Brochure.png" className="no-underline" download>
            <button className="btn-outline">
              Download Brochure
            </button>
          </Link>
          <Link href="/admin-login" className="no-underline">
            <button className="btn-outline">
              Admin Login
            </button>
          </Link>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: "rgba(232,234,240,0.3)", fontFamily: "'Inter', sans-serif" }}>
          Deadline: May 31, 2026 · Free for all students · Teams of 2–4
        </p>
      </div>
    </section>
  );
}
