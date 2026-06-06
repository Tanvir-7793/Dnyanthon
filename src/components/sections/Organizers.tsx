import React from "react";

const ORGANIZERS = {
  faculty: [
    { name: "Prof. P.M. Pondkule", role: "Faculty Coordinator", initial: "PP", color: "#6366f1" }
  ],
  students: [
    { name: "Tanvir Mujawar", role: "Student Lead", initial: "TM", color: "#10b981" },
    { name: "Nikhil Chavan", role: "Public Relations (PR)", initial: "NC", color: "#f59e0b" },
    { name: "Shruti Shelar", role: "Operational Head", initial: "SS", color: "#ec4899" },
    { name: "Nandini Shirke", role: "Operational Head", initial: "NS", color: "#06b6d4" },
  ]
};

export default function Organizers() {
  return (
    <section id="organizers" style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div className="section-tag">Team Behind the Event</div>
        <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1px" }}>Our Organizers</h2>
        <p style={{ fontSize: 16, color: "rgba(232,234,240,0.5)", marginTop: 12, fontFamily: "'Inter', sans-serif" }}>
          The dedicated team making Dnyanothon 2026 possible.
        </p>
      </div>

      {/* Faculty Coordinator */}
      <div style={{ marginBottom: 64 }}>
        <div style={{ fontSize: 14, color: "rgba(232,234,240,0.5)", marginBottom: 32, letterSpacing: 2, textAlign: "center", fontWeight: 600 }}>FACULTY COORDINATOR</div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {ORGANIZERS.faculty.map(s => (
            <div key={s.name} className="speaker-card" style={{ maxWidth: 300, width: "100%" }}>
              <div style={{
                width: 100, height: 100, borderRadius: "50%",
                background: `${s.color}25`, border: `2px solid ${s.color}50`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, fontWeight: 800, color: s.color,
                margin: "0 auto 20px",
              }}>{s.initial}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{s.name}</div>
              <div style={{ fontSize: 14, color: "rgba(232,234,240,0.45)", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>{s.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Coordinators */}
      <div>
        <div style={{ fontSize: 14, color: "rgba(232,234,240,0.5)", marginBottom: 32, letterSpacing: 2, textAlign: "center", fontWeight: 600 }}>STUDENT COORDINATORS</div>
        <div className="speakers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {ORGANIZERS.students.map(s => (
            <div key={s.name} className="speaker-card">
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: `${s.color}25`, border: `2px solid ${s.color}50`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, fontWeight: 800, color: s.color,
                margin: "0 auto 16px",
              }}>{s.initial}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: "rgba(232,234,240,0.45)", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>{s.role}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .speakers-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .speakers-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
