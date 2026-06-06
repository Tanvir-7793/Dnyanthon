"use client"
import { useState, useEffect, useRef } from "react";
import RegisterCTA from "@/components/sections/RegisterCTA";
import Organizers from "@/components/sections/Organizers";
import FAQ from "@/components/sections/FAQ";

// ── Utility ──────────────────────────────────────────────────────────────────
const cx = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");

// ── Data ─────────────────────────────────────────────────────────────────────
const NAV_LINKS = ["About", "Tracks", "Timeline", "Prizes", "Speakers", "Organizers", "FAQ"];

const STATS = [
  { value: 1248, label: "Registrations", suffix: "+" },
  { value: 245, label: "Teams", suffix: "+" },
  { value: 50000, label: "Prize Pool", suffix: "₹", prefix: "₹" },
  { value: 24, label: "Hours of Hacking", suffix: "h" },
];

const TRACKS = [
  {
    icon: "🤖",
    name: "AI & Machine Learning",
    desc: "Build intelligent systems that learn, adapt, and transform how we interact with data.",
    color: "#6366f1",
    glow: "#6366f180",
  },
  {
    icon: "🌱",
    name: "AgriTech & Rural Innovation",
    desc: "Solve real-world problems faced by farmers and rural communities using technology.",
    color: "#10b981",
    glow: "#10b98180",
  },
  {
    icon: "🏥",
    name: "HealthTech",
    desc: "Reimagine healthcare delivery, diagnostics, and patient outcomes through innovation.",
    color: "#f59e0b",
    glow: "#f59e0b80",
  },
  {
    icon: "🔗",
    name: "Web3 & Fintech",
    desc: "Decentralized finance, blockchain applications, and the future of digital payments.",
    color: "#06b6d4",
    glow: "#06b6d480",
  },
  {
    icon: "♻️",
    name: "CleanTech & Sustainability",
    desc: "Green solutions to climate, energy, and environmental challenges of our generation.",
    color: "#84cc16",
    glow: "#84cc1680",
  },
  {
    icon: "🎓",
    name: "EdTech",
    desc: "Revolutionize learning experiences for students, teachers, and institutions.",
    color: "#ec4899",
    glow: "#ec489980",
  },
];

const TIMELINE = [
  { date: "Mar 1", event: "Registrations Open", status: "done" },
  { date: "Apr 15", event: "Team Formation Deadline", status: "done" },
  { date: "Apr 30", event: "Idea Submission", status: "active" },
  { date: "May 20", event: "Shortlist Announced", status: "upcoming" },
  { date: "Jun 7", event: "Opening Ceremony", status: "upcoming" },
  { date: "Jun 7–8", event: "24hr Hackathon", status: "upcoming" },
  { date: "Jun 8", event: "Judging & Presentations", status: "upcoming" },
  { date: "Jun 8", event: "Prize Distribution", status: "upcoming" },
];

const PRIZES = [
  {
    place: "1st",
    label: "Grand Champion",
    amount: "₹25,000",
    perks: ["Trophy + Certificate", "Incubation Fast-Track", "Internship Offer"],
    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
    shadow: "#f59e0b40",
  },
  {
    place: "2nd",
    label: "Runner Up",
    amount: "₹15,000",
    perks: ["Trophy + Certificate", "Mentorship Session", "Tech Goodies"],
    gradient: "linear-gradient(135deg,#94a3b8,#cbd5e1)",
    shadow: "#94a3b840",
  },
  {
    place: "3rd",
    label: "Second Runner Up",
    amount: "₹10,000",
    perks: ["Certificate", "Swag Kit", "Community Recognition"],
    gradient: "linear-gradient(135deg,#d97706,#92400e)",
    shadow: "#d9770640",
  },
];

const TRACK_PRIZES = [
  { name: "Best AI Hack", amount: "₹5,000" },
  { name: "Best Social Impact", amount: "₹3,000" },
  { name: "Best First-Time Hackers", amount: "₹2,000" },
];

const SPEAKERS = [
  { name: "Dr. Ananya Kulkarni", role: "AI Research Lead, TIFR", initial: "AK", color: "#6366f1" },
  { name: "Rohan Deshmukh", role: "Co-Founder, AgriConnect", initial: "RD", color: "#10b981" },
  { name: "Priyanka Iyer", role: "Product Head, PhonePe", initial: "PI", color: "#f59e0b" },
  { name: "Siddharth Rane", role: "VC Partner, Blume Ventures", initial: "SR", color: "#ec4899" },
];

const FAQS = [
  { q: "Who can participate?", a: "Any undergraduate or postgraduate student from any college or university in India. Teams of 2–4 members." },
  { q: "Is there a registration fee?", a: "No! Dnyanothon 2026 is completely free to enter. Just bring your ideas and energy." },
  { q: "What should I bring?", a: "Your laptop, chargers, valid college ID, and a hunger to build. Meals and accommodation will be provided." },
  { q: "Can I participate solo?", a: "We encourage teams of 2–4 for collaborative hacking. Solo participation is allowed but teaming up is recommended." },
  { q: "Will mentors be available?", a: "Yes! Industry mentors will be present throughout the event for guidance on technology, business, and design." },
  { q: "How will projects be judged?", a: "Projects are evaluated on Innovation, Technical Complexity, Impact Potential, and Presentation Quality." },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + increment, target);
            setCount(Math.floor(current));
            if (current >= target) clearInterval(timer);
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

function GlowCard({ children, style = {}, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={cx("glow-card", className)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        backdropFilter: "blur(12px)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Dnyanothon2026() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", background: "#050a14", color: "#e8eaf0", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .glow-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(99,102,241,0.15); }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          padding: 14px 32px;
          border-radius: 50px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.3px;
        }
        .btn-primary:hover { transform: scale(1.05); box-shadow: 0 8px 32px rgba(99,102,241,0.5); }

        .btn-outline {
          background: transparent;
          color: #e8eaf0;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 13px 28px;
          border-radius: 50px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-outline:hover { border-color: rgba(99,102,241,0.7); color: #a5b4fc; background: rgba(99,102,241,0.1); }

        .nav-link {
          color: rgba(232,234,240,0.7);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
          cursor: pointer;
          letter-spacing: 0.4px;
        }
        .nav-link:hover { color: #e8eaf0; }

        .track-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 28px;
          transition: all 0.35s ease;
          cursor: default;
        }
        .track-card:hover { background: rgba(255,255,255,0.06); transform: translateY(-6px); }

        .timeline-dot-done { background: #10b981; box-shadow: 0 0 12px #10b98170; }
        .timeline-dot-active { background: #6366f1; box-shadow: 0 0 16px #6366f1aa; animation: pulse 2s infinite; }
        .timeline-dot-upcoming { background: rgba(255,255,255,0.15); }

        @keyframes pulse { 0%,100%{ box-shadow:0 0 10px #6366f180; } 50%{ box-shadow:0 0 22px #6366f1cc; } }

        .prize-card {
          border-radius: 24px;
          padding: 36px 28px;
          text-align: center;
          transition: transform 0.3s ease;
        }
        .prize-card:hover { transform: translateY(-8px); }

        .faq-item {
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 20px 0;
          cursor: pointer;
        }

        .speaker-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 28px 24px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .speaker-card:hover { background: rgba(255,255,255,0.06); transform: translateY(-4px); }

        .section-tag {
          display: inline-block;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 50px;
          margin-bottom: 20px;
        }

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        .grid-bg {
          background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 40px !important; }
          .hide-mobile { display: none !important; }
          .mobile-col { flex-direction: column !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tracks-grid { grid-template-columns: 1fr !important; }
          .timeline-grid { grid-template-columns: 1fr !important; }
          .prizes-grid { grid-template-columns: 1fr !important; }
          .speakers-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 24px",
        background: scrolled ? "rgba(5,10,20,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.4s ease",
        height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, color: "#fff",
          }}>D</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px" }}>
            Dnyanothon<span style={{ color: "#6366f1" }}> &apos;26</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hide-mobile" style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {NAV_LINKS.map(l => (
            <span key={l} className="nav-link" onClick={() => scrollTo(l.toLowerCase())}>{l}</span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/login?next=/register" className="hide-mobile">
            <button className="btn-primary" style={{ padding: "10px 24px", fontSize: 13 }}>
              Login to Register
            </button>
          </a>
          <a href="/admin-login" className="hide-mobile">
            <button className="btn-outline" style={{ padding: "10px 22px", fontSize: 13 }}>
              Admin Login
            </button>
          </a>
          {/* Hamburger */}
          <button onClick={() => setMenuOpen(v => !v)}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 10px", color: "#e8eaf0", cursor: "pointer", display: "none" }}
            className="show-mobile"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {menuOpen
                ? <><line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="2" /><line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="2" /></>
                : <><line x1="2" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="2" /><line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="2" /><line x1="2" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="2" /></>}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: 68, left: 0, right: 0, zIndex: 99,
          background: "rgba(5,10,20,0.97)", backdropFilter: "blur(20px)",
          padding: "20px 24px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          {NAV_LINKS.map(l => (
            <div key={l} onClick={() => scrollTo(l.toLowerCase())}
              style={{ padding: "14px 0", fontSize: 16, fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
              {l}
            </div>
          ))}
          <a href="/login?next=/register">
            <button className="btn-primary" style={{ width: "100%", marginTop: 20 }}>
              Login to Register
            </button>
          </a>
          <a href="/admin-login">
            <button className="btn-outline" style={{ width: "100%", marginTop: 12 }}>
              Admin Login
            </button>
          </a>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="grid-bg" style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", overflow: "hidden" }}>
        {/* Background orbs */}
        <div className="bg-orb" style={{ width: 600, height: 600, background: "#6366f130", top: -100, left: "50%", transform: "translateX(-50%)" }} />
        <div className="bg-orb" style={{ width: 400, height: 400, background: "#8b5cf620", bottom: 0, right: "10%" }} />
        <div className="bg-orb" style={{ width: 300, height: 300, background: "#06b6d415", bottom: 100, left: "5%" }} />

        {/* Background Text */}
        <div style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "clamp(80px, 9vw, 320px)",
          fontWeight: 900,
          color: "rgba(255,255,255,0.015)",
          pointerEvents: "none",
          zIndex: 0,
          lineHeight: 1,
          letterSpacing: "-10px",
          userSelect: "none",
          textTransform: "uppercase",
          whiteSpace: "nowrap"
        }}>
          Dnyanothon
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
          padding: "8px 20px", borderRadius: 50, marginBottom: 32,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 8px #10b981" }} />
          <span style={{ fontSize: 13, color: "#a5b4fc", fontWeight: 600, letterSpacing: 1 }}>DIET SATARA · JUNE 7–8, 2026</span>
        </div>

        <h1 className="hero-title" style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-2px", marginBottom: 24, maxWidth: 820 }}>
          Where Ideas{" "}
          <span style={{ background: "linear-gradient(135deg,#6366f1,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Collide with
          </span>
          {" "}Ambition
        </h1>

        <p style={{ fontSize: 18, color: "rgba(232,234,240,0.6)", lineHeight: 1.7, maxWidth: 580, marginBottom: 16, fontFamily: "'Inter', sans-serif", fontWeight: 400 }}>
          India&apos;s most electrifying college hackathon. 24 hours. 1,200+ builders. ₹50,000 in prizes. No limits.
        </p>
        <p style={{ fontSize: 13, color: "rgba(232,234,240,0.35)", letterSpacing: 2, marginBottom: 48, fontWeight: 500 }}>
          BECAUSE EVERY SECOND OF INNOVATION MATTERS
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 64 }}>
          <button className="btn-primary" style={{ fontSize: 16, padding: "16px 40px" }} onClick={() => scrollTo("register")}>
            Register Free →
          </button>
          <button className="btn-outline" onClick={() => scrollTo("about")}>
            Explore Event
          </button>
        </div>

        {/* Floating stats preview */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { label: "Teams", val: "245+" },
            { label: "Participants", val: "1200+" },
            { label: "Prize Pool", val: "₹50K" },
            { label: "Mentors", val: "20+" },
          ].map(s => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "14px 24px", textAlign: "center"
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#a5b4fc" }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "rgba(232,234,240,0.45)", marginTop: 2, letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.4 }}>
          <span style={{ fontSize: 11, letterSpacing: 2 }}>SCROLL</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none"><rect x="7" y="2" width="2" height="8" rx="1" fill="currentColor" /><path d="M1 14l7 8 7-8" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section id="about" style={{ padding: "clamp(40px, 8vw, 80px) 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(12px, 3vw, 20px)" }}>
          {STATS.map((s) => (
            <GlowCard key={s.label} style={{ padding: "clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)", textAlign: "center" }}>
              <div style={{ fontSize: "clamp(24px, 6vw, 40px)", fontWeight: 800, color: "#a5b4fc", lineHeight: 1 }}>
                <AnimatedCounter target={s.value} prefix={s.prefix || ""} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: "clamp(10px, 2.5vw, 13px)", color: "rgba(232,234,240,0.5)", marginTop: 8, letterSpacing: 1, fontWeight: 500 }}>
                {s.label.toUpperCase()}
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "40px 24px 100px", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }} className="mobile-col">
          <div>
            <div className="section-tag">About the Event</div>
            <h2 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: "-1px" }}>
              The Biggest Hackathon in{" "}
              <span style={{ color: "#6366f1" }}>Satara District</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(232,234,240,0.6)", lineHeight: 1.8, marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>
              Dnyanothon 2026 is the annual flagship tech innovation festival organized by DIET (District Institute of Education and Training), Satara. A melting pot of the sharpest student minds from Maharashtra and beyond.
            </p>
            <p style={{ fontSize: 16, color: "rgba(232,234,240,0.6)", lineHeight: 1.8, fontFamily: "'Inter', sans-serif" }}>
              Over 24 relentless hours, teams hack on real-world problems, get mentored by industry veterans, and compete for recognition, prizes, and a platform to launch their ideas into the world.
            </p>
            <div style={{ marginTop: 36, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button className="btn-primary" onClick={() => scrollTo("tracks")}>Explore Tracks</button>
              <button className="btn-outline" onClick={() => scrollTo("prizes")}>View Prizes</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { icon: "⚡", title: "24-Hour Sprint", desc: "Non-stop hacking from Day 1 evening to Day 2 afternoon" },
              { icon: "🎯", title: "6 Tracks", desc: "Focused problem domains across tech and social impact" },
              { icon: "🧠", title: "Expert Mentors", desc: "20+ industry professionals guiding your build" },
              { icon: "🚀", title: "Launch Pad", desc: "Best ideas get incubation & investor introductions" },
            ].map(f => (
              <GlowCard key={f.title} style={{ padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "rgba(232,234,240,0.5)", lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>{f.desc}</div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tracks ───────────────────────────────────────────────────────────── */}
      <section id="tracks" style={{ padding: "80px 24px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="section-tag">Hack Tracks</div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1px" }}>Choose Your Battlefield</h2>
            <p style={{ fontSize: 16, color: "rgba(232,234,240,0.5)", marginTop: 12, fontFamily: "'Inter', sans-serif" }}>
              Six impact-driven tracks. One chance to change something.
            </p>
          </div>
          <div className="tracks-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {TRACKS.map(t => (
              <div key={t.name} className="track-card">
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${t.color}20`, border: `1px solid ${t.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginBottom: 18,
                }}>{t.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: "#e8eaf0" }}>{t.name}</h3>
                <p style={{ fontSize: 14, color: "rgba(232,234,240,0.5)", lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>{t.desc}</p>
                <div style={{ marginTop: 18, fontSize: 12, color: t.color, fontWeight: 600, letterSpacing: 0.5 }}>EXPLORE TRACK →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────────────────────── */}
      <section id="timeline" style={{ padding: "100px 24px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div className="section-tag">Event Schedule</div>
          <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1px" }}>Mark Your Calendar</h2>
        </div>
        <div style={{ position: "relative" }}>
          {/* Center line */}
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.08)", transform: "translateX(-50%)" }} className="hide-mobile" />

          {TIMELINE.map((t, i) => (
            <div key={t.event} style={{
              display: "flex",
              justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
              marginBottom: 32,
              position: "relative",
            }} className="hide-mobile">
              <GlowCard style={{
                padding: "18px 24px", width: "42%",
                borderLeft: t.status === "active" ? "2px solid #6366f1" : "none",
              }}>
                <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginBottom: 4, letterSpacing: 1 }}>{t.date.toUpperCase()}</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t.event}</div>
              </GlowCard>
              {/* Dot */}
              <div style={{
                position: "absolute", left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
                width: 12, height: 12, borderRadius: "50%",
              }} className={`timeline-dot-${t.status}`} />
            </div>
          ))}

          {/* Mobile timeline */}
          <div style={{ display: "none" }} className="mobile-timeline">
            {TIMELINE.map(t => (
              <div key={t.event} style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", marginTop: 4 }} className={`timeline-dot-${t.status}`} />
                  <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.08)", marginTop: 4 }} />
                </div>
                <div style={{ paddingBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, marginBottom: 2 }}>{t.date}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile fallback */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="show-mobile-flex">
          {TIMELINE.map(t => (
            <GlowCard key={t.event} style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0 }} className={`timeline-dot-${t.status}`} />
              <div>
                <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, letterSpacing: 1 }}>{t.date.toUpperCase()}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.event}</div>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      {/* ── Prizes ───────────────────────────────────────────────────────────── */}
      <section id="prizes" style={{ padding: "80px 24px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div className="section-tag">Prizes & Rewards</div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1px" }}>
              ₹50,000+ Up For Grabs
            </h2>
            <p style={{ fontSize: 16, color: "rgba(232,234,240,0.5)", marginTop: 12, fontFamily: "'Inter', sans-serif" }}>
              Build something great. Win big. Launch your future.
            </p>
          </div>

          <div className="prizes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 48 }}>
            {PRIZES.map((p, i) => (
              <div key={p.place} className="prize-card" style={{
                background: `linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`,
                border: "1px solid rgba(255,255,255,0.08)",
                order: i === 0 ? -1 : i,
              }}>
                <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 4, background: p.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {p.place}
                </div>
                <div style={{ fontSize: 12, color: "rgba(232,234,240,0.5)", letterSpacing: 1.5, marginBottom: 16 }}>{p.label.toUpperCase()}</div>
                <div style={{ fontSize: 38, fontWeight: 800, marginBottom: 24 }}>{p.amount}</div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                  {p.perks.map(perk => (
                    <div key={perk} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 14, color: "rgba(232,234,240,0.7)", fontFamily: "'Inter', sans-serif" }}>
                      <span style={{ color: "#10b981", fontSize: 16 }}>✓</span> {perk}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: "rgba(232,234,240,0.5)", marginBottom: 20, letterSpacing: 1 }}>SPECIAL TRACK PRIZES</div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              {TRACK_PRIZES.map(tp => (
                <div key={tp.name} style={{
                  background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: 14, padding: "14px 24px", textAlign: "center"
                }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#a5b4fc" }}>{tp.amount}</div>
                  <div style={{ fontSize: 12, color: "rgba(232,234,240,0.5)", marginTop: 4 }}>{tp.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Speakers ─────────────────────────────────────────────────────────── */}
      <section id="speakers" style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="section-tag">Mentors & Judges</div>
          <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1px" }}>Learn from the Best</h2>
          <p style={{ fontSize: 16, color: "rgba(232,234,240,0.5)", marginTop: 12, fontFamily: "'Inter', sans-serif" }}>
            Industry leaders guiding your 24-hour journey.
          </p>
        </div>
        <div className="speakers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {SPEAKERS.map(s => (
            <div key={s.name} className="speaker-card">
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: `${s.color}25`, border: `2px solid ${s.color}50`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 800, color: s.color,
                margin: "0 auto 16px",
              }}>{s.initial}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: "rgba(232,234,240,0.45)", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>{s.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Register CTA ─────────────────────────────────────────────────────── */}
      <RegisterCTA />

      {/* ── Organizers ───────────────────────────────────────────────────────── */}
      <Organizers />

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <FAQ activeFaq={activeFaq} setActiveFaq={setActiveFaq} FAQS={FAQS} />

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ position: "relative", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px 32px" }}>
        {/* Background Text */}
        <div style={{
          position: "absolute",
          bottom: 52,
          right: -8,
          fontSize: "clamp(30px, 8.5vw, 150px)",
          fontWeight: 850,
          color: "rgba(255,255,255,0.02)",
          pointerEvents: "none",
          zIndex: 0,
          lineHeight: 1,
          letterSpacing: "-5px",
          userSelect: "none",
          textTransform: "uppercase"
        }}>
          Dnyanothon
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>D</div>
                <span style={{ fontWeight: 800, fontSize: 16 }}>Dnyanothon <span style={{ color: "#6366f1" }}>&apos;26</span></span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(232,234,240,0.4)", maxWidth: 260, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                Organized by DIET Satara · Maharashtra, India<br />
                June 7–8, 2026
              </p>
            </div>
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              {[
                { title: "Event", links: ["About", "Tracks", "Timeline", "Prizes", "Speakers", "Organizers", "FAQ"] },
                { title: "Connect", links: ["Contact Us", "Instagram", "LinkedIn", "WhatsApp Group"] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1.5, marginBottom: 16, color: "rgba(232,234,240,0.5)" }}>{col.title.toUpperCase()}</div>
                  {col.links.map(l => (
                    <div key={l} style={{ fontSize: 14, color: "rgba(232,234,240,0.5)", marginBottom: 10, cursor: "pointer", transition: "color 0.2s", fontFamily: "'Inter', sans-serif" }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.color = "#e8eaf0"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.color = "rgba(232,234,240,0.5)"}
                      onClick={() => col.title === "Event" && scrollTo(l.toLowerCase())}
                    >{l}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 12, color: "rgba(232,234,240,0.25)", fontFamily: "'Inter', sans-serif" }}>
              © 2026 Dnyanothon · DIET Satara. All rights reserved.
            </p>
            <p style={{ fontSize: 12, color: "rgba(232,234,240,0.25)", letterSpacing: 1.5 }}>
              BECAUSE EVERY SECOND OF INNOVATION MATTERS
            </p>
          </div>
        </div>
      </footer>

      {/* show/hide helpers */}
      <style>{`
        .register-box { padding: 64px 48px; }
        .register-heading { font-size: 44px; }
        .show-mobile { display: none !important; }
        .show-mobile-flex { display: none !important; }
        @media (max-width: 768px) {
          .register-box { padding: 40px 24px; }
          .register-heading { font-size: 32px; }
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .show-mobile-flex { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
