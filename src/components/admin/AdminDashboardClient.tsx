"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Coffee,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Mail,
  Building,
  MapPin,
  Clock,
  LogOut,
  ChevronDown,
  ChevronUp,
  Award,
  ListTodo,
  ShieldCheck,
  CheckCircle,
  Loader2,
  FileSpreadsheet
} from "lucide-react";

// Recharts components dynamically imported to bypass SSR hydration issues
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });

type EventOption = {
  id: string;
  title: string;
  slug: string;
  venue: string | null;
  start_date: string | null;
  status: string;
};

type AdminDashboardClientProps = {
  eventId: string;
  events: EventOption[];
  user: {
    name: string;
    email: string;
    role: string;
  };
};

type DashboardStats = {
  totalRegistrations: number;
  approvedParticipants: number;
  pendingParticipants: number;
  teamsRegistered: number;
  lunchServedCount: number;
  dinnerServedCount: number;
  snacksServedCount: number;
  invalidScanAttempts: number;
  recentScans: unknown[];
};

type ParticipantRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  college_name: string | null;
  year: string | null;
  registration_status: string;
  qr_generated_at?: string | null;
  created_at: string;
  latest_qr_email?: {
    status: string;
    sent_at: string | null;
    created_at: string;
    error_message: string | null;
  } | null;
  team?: {
    team_name?: string;
    problem_track?: string | null;
  } | null;
};

type TeamRow = {
  id: string;
  team_name: string;
  member_count: number;
  college_name: string | null;
  problem_track: string | null;
  created_at: string;
  leader?: {
    full_name?: string;
    email?: string;
  } | null;
  participants?: Array<{
    id: string;
    full_name: string;
    email: string;
    registration_status: string;
  }>;
};

type ScanRow = {
  id: string;
  status: string;
  scanned_at: string;
  device_id?: string | null;
  participant?: {
    full_name?: string;
    email?: string;
  } | null;
  service_type?: {
    name?: string;
    type?: string;
  } | null;
  volunteer?: {
    full_name?: string;
    email?: string;
  } | null;
};

type ServiceRow = {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  servedCount: number;
  start_time: string | null;
  end_time: string | null;
};

type VolunteerRow = {
  id: string;
  user_id: string;
  duty_name: string | null;
  is_active: boolean;
  scanCount: number;
  lastScanAt: string | null;
  profile?: {
    full_name?: string;
    email?: string;
  } | null;
  service_type?: {
    name?: string;
    type?: string;
  } | null;
};

type DashboardData = {
  stats: DashboardStats | null;
  participants: ParticipantRow[];
  teams: TeamRow[];
  recentScans: ScanRow[];
  services: ServiceRow[];
  volunteers: VolunteerRow[];
};

const sectionCard =
  "rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-slate-950/30 overflow-hidden";

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-3 shadow-xl backdrop-blur-md text-xs">
        <p className="font-semibold text-slate-400 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-bold text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.stroke || '#a855f7' }} />
            {entry.name}: <span className="text-purple-300">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminDashboardClient({ eventId, events, user }: AdminDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData>({
    stats: null,
    participants: [],
    teams: [],
    recentScans: [],
    services: [],
    volunteers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyParticipantId, setBusyParticipantId] = useState<string | null>(null);
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);

  // Layout Tab selection: overview, teams, participants, operations
  const [activeTab, setActiveTab] = useState<"overview" | "teams" | "participants" | "operations">("overview");

  // Filter and search states
  const [teamSearch, setTeamSearch] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantStatus, setParticipantStatus] = useState<string>("all");
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId) ?? events[0],
    [eventId, events],
  );

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = `eventId=${encodeURIComponent(eventId)}`;
      const [
        statsResponse,
        participantsResponse,
        teamsResponse,
        scansResponse,
        servicesResponse,
        volunteersResponse,
      ] = await Promise.all([
        fetch(`/api/admin/dashboard-stats?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/participants?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/teams?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/recent-scans?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/meal-service-status?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/volunteer-activity?${query}`, { cache: "no-store" }),
      ]);

      const responses = [
        statsResponse,
        participantsResponse,
        teamsResponse,
        scansResponse,
        servicesResponse,
        volunteersResponse,
      ];

      const failedResponse = responses.find((response) => !response.ok);
      if (failedResponse) {
        const payload = await failedResponse.json().catch(() => ({ error: "Unable to load dashboard." }));
        throw new Error(payload.error ?? "Unable to load dashboard.");
      }

      const [stats, participants, teams, recentScans, services, volunteers] = await Promise.all(
        responses.map((response) => response.json()),
      );

      setData({
        stats,
        participants: participants.participants ?? [],
        teams: teams.teams ?? [],
        recentScans: recentScans.recentScans ?? [],
        services: services.services ?? [],
        volunteers: volunteers.volunteers ?? [],
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  // Analytics Computations
  const registrationTrend = useMemo(() => {
    if (!data.participants || data.participants.length === 0) return [];

    const dateCounts: Record<string, number> = {};
    data.participants.forEach((p) => {
      if (!p.created_at) return;
      const dateStr = new Date(p.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        timeZone: "Asia/Kolkata",
      });
      dateCounts[dateStr] = (dateCounts[dateStr] ?? 0) + 1;
    });

    const sortedDates = Object.keys(dateCounts).sort((a, b) => {
      const currentYear = new Date().getFullYear();
      return new Date(`${a} ${currentYear}`).getTime() - new Date(`${b} ${currentYear}`).getTime();
    });

    let cumulative = 0;
    return sortedDates.map((date) => {
      const daily = dateCounts[date] ?? 0;
      cumulative += daily;
      return {
        date,
        Daily: daily,
        Cumulative: cumulative,
      };
    });
  }, [data.participants]);

  const trackDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    data.participants.forEach((p) => {
      const track = p.team?.problem_track || "General/Solo";
      counts[track] = (counts[track] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [data.participants]);

  const statusDistribution = useMemo(() => {
    const counts = { approved: 0, pending: 0, rejected: 0 };
    data.participants.forEach((p) => {
      const status = p.registration_status as keyof typeof counts;
      if (status in counts) {
        counts[status]++;
      }
    });
    return [
      { name: "Approved", value: counts.approved, color: "#10b981" },
      { name: "Pending", value: counts.pending, color: "#f59e0b" },
      { name: "Rejected", value: counts.rejected, color: "#ef4444" },
    ].filter((item) => item.value > 0);
  }, [data.participants]);

  const collegeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    data.participants.forEach((p) => {
      const college = p.college_name || "Unknown College";
      counts[college] = (counts[college] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [data.participants]);

  const mealProgress = useMemo(() => {
    return data.services.map((s) => ({
      name: s.name,
      Served: s.servedCount,
    }));
  }, [data.services]);

  // Client Actions
  async function handleApprove(participantId: string) {
    setBusyParticipantId(participantId);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch("/api/admin/approve-participant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participantId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to approve participant.");
      }

      setActionMessage(payload.message ?? "Participant approved successfully.");
      await loadDashboardData();
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to approve participant.",
      );
    } finally {
      setBusyParticipantId(null);
    }
  }

  async function handleReject(participantId: string) {
    const reason = window.prompt("Enter a short rejection reason:");

    if (!reason) {
      return;
    }

    setBusyParticipantId(participantId);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch("/api/admin/reject-participant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participantId, reason }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to reject participant.");
      }

      setActionMessage(payload.message ?? "Participant rejected successfully.");
      await loadDashboardData();
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to reject participant.",
      );
    } finally {
      setBusyParticipantId(null);
    }
  }

  async function handleResendQr(participantId: string) {
    setBusyParticipantId(participantId);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch("/api/admin/resend-qr-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participantId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to resend QR email.");
      }

      setActionMessage(payload.message ?? "QR email resent successfully.");
      await loadDashboardData();
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to resend QR email.",
      );
    } finally {
      setBusyParticipantId(null);
    }
  }

  async function handleApproveTeam(teamId: string) {
    setBusyTeamId(teamId);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch("/api/admin/approve-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to approve team.");
      }

      setActionMessage(payload.message ?? "Team approved and QR passes sent to team leader successfully.");
      await loadDashboardData();
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to approve team.",
      );
    } finally {
      setBusyTeamId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // Search & Filter Computations
  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return data.teams;
    const search = teamSearch.toLowerCase();
    return data.teams.filter(
      (team) =>
        team.team_name.toLowerCase().includes(search) ||
        (team.leader?.full_name ?? "").toLowerCase().includes(search) ||
        (team.leader?.email ?? "").toLowerCase().includes(search) ||
        (team.college_name ?? "").toLowerCase().includes(search) ||
        (team.problem_track ?? "").toLowerCase().includes(search)
    );
  }, [data.teams, teamSearch]);

  const filteredParticipants = useMemo(() => {
    return data.participants.filter((p) => {
      const search = participantSearch.toLowerCase();
      const matchesSearch =
        p.full_name.toLowerCase().includes(search) ||
        p.email.toLowerCase().includes(search) ||
        (p.college_name ?? "").toLowerCase().includes(search) ||
        (p.team?.team_name ?? "").toLowerCase().includes(search);

      const matchesStatus =
        participantStatus === "all" || p.registration_status === participantStatus;

      return matchesSearch && matchesStatus;
    });
  }, [data.participants, participantSearch, participantStatus]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_35%),linear-gradient(180deg,#050a14_0%,#0b1120_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        
        {/* Modern Glass Header Panel */}
        <div className="mb-8 flex flex-col gap-6 rounded-[30px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between shadow-2xl">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
              Admin Control Room
            </div>
            <h1
              className="text-3xl font-black leading-none text-white sm:text-4xl"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Dnyanothsav 2026
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                {" "}Operations
              </span>
            </h1>
            <p className="mt-2 text-xs text-slate-400 sm:text-sm">
              Review registrations, approve entire teams in one-click, monitor service scans, and view event analytics in real-time.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedEvent?.id ?? eventId}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("eventId", e.target.value);
                router.push(`/admin?${params.toString()}`);
              }}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400 hover:bg-slate-950/60"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Global Action Message Alerts */}
        {(actionMessage || actionError || error) && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm shadow-xl backdrop-blur-md animate-fade-in ${
              actionError || error
                ? "border-red-500/20 bg-red-500/10 text-red-200"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {actionError || error ? (
              <XCircle className="h-5 w-5 shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            )}
            <div className="flex-1 font-medium">{actionError || error || actionMessage}</div>
            <button 
              onClick={() => { setActionError(null); setActionMessage(null); }}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modern Tab Bar Selector */}
        <div className="mb-8 flex border-b border-white/10 bg-white/[0.01] rounded-2xl p-1.5 backdrop-blur-sm">
          {[
            { id: "overview", label: "Analytics Overview", icon: LayoutDashboard },
            { id: "teams", label: "Team Verifications", icon: Users },
            { id: "participants", label: "Individual Queue", icon: UserCheck },
            { id: "operations", label: "Ops & Services", icon: Coffee },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl py-3 text-xs font-semibold tracking-wide transition-all duration-300 md:text-sm ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/30 text-white shadow-lg"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-purple-400" : "text-slate-400"}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Rendering */}

        {/* TAB 1: ANALYTICS OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Metrics Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[
                {
                  label: "Total Registrations",
                  value: data.stats?.totalRegistrations ?? 0,
                  accent: "from-purple-500/10 to-indigo-500/5 border-purple-500/10 hover:border-purple-500/30",
                  icon: Users,
                  color: "text-purple-400",
                },
                {
                  label: "Approved Users",
                  value: data.stats?.approvedParticipants ?? 0,
                  accent: "from-emerald-500/10 to-teal-500/5 border-emerald-500/10 hover:border-emerald-500/30",
                  icon: ShieldCheck,
                  color: "text-emerald-400",
                },
                {
                  label: "Pending Approvals",
                  value: data.stats?.pendingParticipants ?? 0,
                  accent: "from-amber-500/10 to-orange-500/5 border-amber-500/10 hover:border-amber-500/30",
                  icon: Clock,
                  color: "text-amber-400",
                },
                {
                  label: "Registered Teams",
                  value: data.stats?.teamsRegistered ?? 0,
                  accent: "from-cyan-500/10 to-sky-500/5 border-cyan-500/10 hover:border-cyan-500/30",
                  icon: Award,
                  color: "text-cyan-400",
                },
              ].map((item) => (
                <div key={item.label} className={`${sectionCard} border ${item.accent} bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02]`}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">{item.label}</p>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <p className="mt-4 text-3xl font-black sm:text-4xl" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {loading ? "..." : item.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Visual Graphs & Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Registration Trend (Area Chart) */}
              <div className={`${sectionCard} p-6 border border-white/5`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-purple-400">Registration Trend</h4>
                    <p className="text-xs text-slate-400">Registration trajectory over time</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <div className="h-[280px] w-full">
                  {loading ? (
                    <div className="flex h-full items-center justify-center text-slate-500 text-xs">Loading Trend Chart...</div>
                  ) : registrationTrend.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-500 text-xs">No registrations yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={registrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="Cumulative" name="Total Signups" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorCum)" />
                        <Area type="monotone" dataKey="Daily" name="Daily Signups" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Status Breakdown (Donut Pie Chart) */}
              <div className={`${sectionCard} p-6 border border-white/5`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Status Breakdown</h4>
                    <p className="text-xs text-slate-400">Approval queue balance status</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex h-[280px] items-center justify-center">
                  {loading ? (
                    <div className="text-slate-500 text-xs">Loading Status Chart...</div>
                  ) : statusDistribution.length === 0 ? (
                    <div className="text-slate-500 text-xs">No registrations yet</div>
                  ) : (
                    <div className="relative h-full w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="45%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            layout="horizontal" 
                            verticalAlign="bottom" 
                            align="center"
                            formatter={(value) => <span className="text-xs text-slate-300 font-medium px-2">{value}</span>} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-[37%] left-[50%] -translate-x-[50%] text-center">
                        <p className="text-2xl font-black">{data.stats?.totalRegistrations ?? 0}</p>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Registrations</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Track Popularity (Bar Chart) */}
              <div className={`${sectionCard} p-6 border border-white/5`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Hackathon Track Popularity</h4>
                    <p className="text-xs text-slate-400">Registrants per project track</p>
                  </div>
                  <Award className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="h-[280px] w-full">
                  {loading ? (
                    <div className="flex h-full items-center justify-center text-slate-500 text-xs">Loading Track Chart...</div>
                  ) : trackDistribution.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-500 text-xs">No track entries</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trackDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Participants" radius={[8, 8, 0, 0]}>
                          {trackDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#barGrad-${index % 3})`} />
                          ))}
                        </Bar>
                        <defs>
                          <linearGradient id="barGrad-0" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#0891b2" />
                          </linearGradient>
                          <linearGradient id="barGrad-1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7c3aed" />
                          </linearGradient>
                          <linearGradient id="barGrad-2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#db2777" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* College Distribution (Horizontal Bar Chart) */}
              <div className={`${sectionCard} p-6 border border-white/5`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400">Top Participating Colleges</h4>
                    <p className="text-xs text-slate-400">Colleges with the highest representation</p>
                  </div>
                  <Building className="h-5 w-5 text-amber-400" />
                </div>
                <div className="h-[280px] w-full">
                  {loading ? (
                    <div className="flex h-full items-center justify-center text-slate-500 text-xs">Loading College Chart...</div>
                  ) : collegeDistribution.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-500 text-xs">No college data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={collegeDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} width={100} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Signups" fill="#eab308" radius={[0, 8, 8, 0]} maxBarSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: TEAMS QUEUE */}
        {activeTab === "teams" && (
          <div className="space-y-6 animate-fade-in">
            {/* Search Filters Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-[35%] h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search teams by name, track, leader or college..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/40 py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500 focus:bg-slate-950/80 transition"
                />
              </div>
              <div className="text-xs font-semibold tracking-wider text-slate-400">
                Found: <span className="text-white font-bold">{filteredTeams.length}</span> teams
              </div>
            </div>

            {/* Teams Accordion List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <p className="text-sm text-slate-400">Loading registrations...</p>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-16 text-center">
                <Users className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-300 font-semibold text-sm">No teams found matching search criteria</p>
                <p className="text-xs text-slate-500 mt-1">Try refining your query or verify the Event selected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTeams.map((team) => {
                  const isExpanded = expandedTeamId === team.id;
                  
                  // Check if any team members are pending
                  const pendingCount = team.participants?.filter(p => p.registration_status === "pending").length ?? 0;
                  const approvedCount = team.participants?.filter(p => p.registration_status === "approved").length ?? 0;
                  const totalCount = team.participants?.length ?? team.member_count;

                  const isApproved = pendingCount === 0 && approvedCount > 0;
                  const isWorking = busyTeamId === team.id;

                  return (
                    <div 
                      key={team.id}
                      className={`rounded-2xl border transition-all duration-300 ${
                        isExpanded 
                          ? "border-purple-500/30 bg-purple-950/[0.08]" 
                          : "border-white/5 bg-white/[0.02] hover:border-white/15"
                      }`}
                    >
                      {/* Accordion Header */}
                      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              {team.team_name}
                            </h3>
                            <span className="rounded-full border border-purple-500/20 bg-purple-500/5 px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider text-purple-300">
                              {team.problem_track ?? "Track Pending"}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                              {totalCount} members
                            </span>
                          </div>
                          
                          <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Building className="h-3.5 w-3.5 text-slate-500" />
                              {team.college_name || "Unknown College"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-500" />
                              Leader: {team.leader?.full_name || "N/A"} ({team.leader?.email || "N/A"})
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {/* Approve Team Button */}
                          {pendingCount > 0 ? (
                            <button
                              onClick={() => handleApproveTeam(team.id)}
                              disabled={isWorking}
                              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:from-purple-500 hover:to-indigo-500 shadow-md transition disabled:opacity-60"
                            >
                              {isWorking ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Approve Team
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Approved
                              </span>
                              <button
                                onClick={() => {
                                  // Find the leader participant ID
                                  const leaderPart = team.participants?.find(p => p.email.toLowerCase() === team.leader?.email?.toLowerCase());
                                  if (leaderPart) {
                                    void handleResendQr(leaderPart.id);
                                  } else if (team.participants && team.participants.length > 0) {
                                    void handleResendQr(team.participants[0].id);
                                  }
                                }}
                                className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition"
                              >
                                Resend passes to Leader
                              </button>
                            </div>
                          )}

                          {/* Expand Trigger */}
                          <button
                            onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                            className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-slate-400 hover:text-white hover:bg-white/10 transition"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Member Details */}
                      {isExpanded && (
                        <div className="border-t border-white/5 bg-slate-950/20 px-5 py-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Team Members Queue</h4>
                          <div className="divide-y divide-white/5 space-y-3">
                            {team.participants && team.participants.length > 0 ? (
                              team.participants.map((member) => (
                                <div key={member.id} className="flex flex-col gap-2 pt-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-white">{member.full_name}</span>
                                    <span className="text-xs text-slate-400">{member.email}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold capitalize ${
                                      member.registration_status === "approved"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : member.registration_status === "rejected"
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        member.registration_status === "approved"
                                          ? "bg-emerald-400"
                                          : member.registration_status === "rejected"
                                          ? "bg-red-400"
                                          : "bg-amber-400"
                                      }`} />
                                      {member.registration_status}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500">No members loaded. Refresh or check data.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INDIVIDUAL PARTICIPANTS QUEUE */}
        {activeTab === "participants" && (
          <div className="space-y-6 animate-fade-in">
            {/* Filters Bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-[35%] h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search participants by name, email, college..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/40 py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500 focus:bg-slate-950/80 transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={participantStatus}
                  onChange={(e) => setParticipantStatus(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400 hover:bg-slate-950/60"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <Link
                  href={`/api/admin/export-participants?eventId=${encodeURIComponent(eventId)}`}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  Export CSV
                </Link>
              </div>
            </div>

            {/* Participants Grid / Cards */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <p className="text-sm text-slate-400">Loading participants queue...</p>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-16 text-center">
                <UserCheck className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-300 font-semibold text-sm">No participants found</p>
                <p className="text-xs text-slate-500 mt-1">Try selecting a different filter or search term</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredParticipants.map((participant) => {
                  const isBusy = busyParticipantId === participant.id;
                  return (
                    <div 
                      key={participant.id} 
                      className={`${sectionCard} border border-white/5 bg-white/[0.02] p-5 hover:border-white/10 transition`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-base font-bold text-white">{participant.full_name}</h4>
                            
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              participant.registration_status === "approved"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : participant.registration_status === "rejected"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {participant.registration_status}
                            </span>
                            
                            {participant.team?.team_name ? (
                              <span className="rounded-full border border-purple-500/20 bg-purple-500/5 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                                Team: {participant.team.team_name}
                              </span>
                            ) : (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                Solo
                              </span>
                            )}
                          </div>
                          
                          <p className="mt-1.5 text-xs text-slate-400 font-medium">{participant.email} • {participant.phone || "No Phone"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {participant.college_name || "College pending"} • Year: {participant.year || "N/A"} • Track: {participant.team?.problem_track || "General"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 text-[10px] text-slate-300 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              Email status: <span className="font-bold text-white">{participant.latest_qr_email?.status ?? "Not Sent"}</span>
                            </span>
                            {participant.latest_qr_email?.sent_at && (
                              <span className="rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 text-[10px] text-slate-400">
                                Last: {formatDateTime(participant.latest_qr_email.sent_at)}
                              </span>
                            )}
                          </div>
                          {participant.latest_qr_email?.status === "failed" && participant.latest_qr_email.error_message && (
                            <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              {participant.latest_qr_email.error_message}
                            </p>
                          )}
                        </div>

                        {/* Actions block */}
                        <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-start">
                          {participant.registration_status !== "approved" && (
                            <button
                              onClick={() => handleApprove(participant.id)}
                              disabled={isBusy}
                              className="rounded-xl bg-emerald-600 px-4.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition disabled:opacity-60"
                            >
                              {isBusy ? "Working..." : "Approve"}
                            </button>
                          )}
                          
                          {participant.registration_status !== "rejected" && (
                            <button
                              onClick={() => handleReject(participant.id)}
                              disabled={isBusy}
                              className="rounded-xl border border-red-500/20 bg-red-500/5 px-4.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/15 transition disabled:opacity-60"
                            >
                              Reject
                            </button>
                          )}

                          {participant.registration_status === "approved" && (
                            <button
                              onClick={() => handleResendQr(participant.id)}
                              disabled={isBusy}
                              className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/15 transition disabled:opacity-60"
                            >
                              {isBusy ? "Sending..." : "Resend Pass"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: OPERATIONS & SERVICES */}
        {activeTab === "operations" && (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] animate-fade-in">
            
            {/* Meal Service & Volunteers Left Side */}
            <div className="space-y-8">
              
              {/* Meal Services */}
              <div className={`${sectionCard} p-6 border border-white/5`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Meal Services</h3>
                    <p className="text-xs text-slate-400">Meal validation stats</p>
                  </div>
                  <Coffee className="h-5 w-5 text-purple-400" />
                </div>
                
                {/* Meal Graph */}
                <div className="h-[200px] w-full mb-6">
                  {loading ? (
                    <div className="flex h-full items-center justify-center text-slate-500 text-xs">Loading Meal Progress...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mealProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="Served" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={35} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {data.services.map((service) => (
                    <div key={service.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-center">
                      <p className="text-xs font-bold text-slate-400 capitalize">{service.name}</p>
                      <p className="text-2xl font-black text-white mt-1.5">{service.servedCount}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider mt-2 ${
                        service.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"
                      }`}>
                        {service.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volunteers Activity */}
              <div className={`${sectionCard} p-6 border border-white/5`}>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">Volunteer Ground Ops</h3>
                  <p className="text-xs text-slate-400">Scans recorded by active volunteers</p>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {data.volunteers.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-10">No volunteer stats available</p>
                  ) : (
                    data.volunteers.map((volunteer) => (
                      <div key={volunteer.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/20 p-3.5">
                        <div>
                          <p className="text-sm font-bold text-white">{volunteer.profile?.full_name ?? "General Duty"}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            Duty: {volunteer.duty_name ?? volunteer.service_type?.name ?? "General"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-purple-300">{volunteer.scanCount} scans</p>
                          {volunteer.lastScanAt && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(volunteer.lastScanAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Live Verification Scan Feed Right Side */}
            <div className={`${sectionCard} p-6 border border-white/5 flex flex-col h-[670px]`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Live Feed
                  </h3>
                  <p className="text-xs text-slate-400">Live QR validation entries</p>
                </div>
                <button
                  onClick={loadDashboardData}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition"
                >
                  <RefreshCw className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {data.recentScans.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-500 text-xs py-20">No verification scans recorded yet</div>
                ) : (
                  data.recentScans.slice(0, 15).map((scan) => (
                    <div 
                      key={scan.id} 
                      className={`rounded-xl border p-3.5 transition ${
                        scan.status === "valid" 
                          ? "border-emerald-500/10 bg-emerald-500/[0.02]" 
                          : "border-red-500/10 bg-red-500/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white">{scan.participant?.full_name ?? "Unknown Guest"}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {scan.service_type?.name ?? "Scan service"} • By: {scan.volunteer?.full_name ?? "Volunteer"}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase font-bold tracking-wider ${
                          scan.status === "valid" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {scan.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(scan.scanned_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
