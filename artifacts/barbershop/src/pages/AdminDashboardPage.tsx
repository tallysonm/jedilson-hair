import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, CalendarDays, List, PlusCircle, LogOut,
  Trash2, CheckCircle2, TrendingUp, CalendarCheck, DollarSign,
  Users, Pencil, UserCheck, UserX, RefreshCw, Scissors,
  MoreHorizontal, Check, X as XIcon,
} from "lucide-react";
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetRevenueChart,     getGetRevenueChartQueryKey,
  useGetServicesChart,    getGetServicesChartQueryKey,
  useListAppointments,    getListAppointmentsQueryKey,
  useUpdateAppointment,   useDeleteAppointment,
  useDeleteRecurringGroup, useListServices, useCreateAppointment,
  useGetAvailableSlots,   getGetAvailableSlotsQueryKey,
  useListBarbers,         getListBarbersQueryKey,
  useCreateBarber,        useUpdateBarber,
  useCreateRecurringAppointments,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin   from "@fullcalendar/daygrid";
import timeGridPlugin  from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

/* ── helpers ── */
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/* ══════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) setLocation("/admin");
  }, [setLocation]);

  const handleLogout = () => { localStorage.removeItem("adminToken"); setLocation("/admin"); };

  const NAV = [
    { id: "overview",     icon: LayoutDashboard, label: "Visão Geral" },
    { id: "calendar",     icon: CalendarDays,    label: "Calendário"  },
    { id: "appointments", icon: List,            label: "Agendamentos" },
    { id: "new",          icon: PlusCircle,      label: "Novo Agendamento" },
    { id: "barbers",      icon: Users,           label: "Barbeiros" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 bg-[#080808] border-r border-white/5 flex flex-col md:min-h-screen shrink-0">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="font-display font-semibold text-white text-[15px] leading-tight">Jedilson Hair</p>
              <p className="text-[10px] text-muted-foreground">Painel Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex md:flex-col flex-row gap-1 p-3 flex-1 overflow-x-auto md:overflow-x-visible">
          {NAV.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${
                  active
                    ? "bg-white/6 text-white"
                    : "text-muted-foreground hover:text-white hover:bg-white/4"
                }`}
                data-testid={`nav-${item.id}`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-accent" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-red-500/8 hover:text-red-400 transition-all text-sm font-medium"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-screen bg-[#080808]">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === "overview"     && <OverviewTab />}
            {activeTab === "calendar"     && <CalendarTab />}
            {activeTab === "appointments" && <AppointmentsTab />}
            {activeTab === "new"          && <NewAppointmentTab onComplete={() => setActiveTab("appointments")} />}
            {activeTab === "barbers"      && <BarbeirosTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ══ Animated number ══ */
function AnimatedNumber({ target, prefix = "" }: { target: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 1000;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * ease);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);
  return <>{prefix}{display.toFixed(prefix ? 2 : 0)}</>;
}

/* ══ Section header ══ */
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="font-display text-2xl font-bold text-white tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

/* ══════════════════════════════════════════════
   OVERVIEW TAB
══════════════════════════════════════════════ */
function OverviewTab() {
  const { data: summary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: revenueData } = useGetRevenueChart({ query: { queryKey: getGetRevenueChartQueryKey() } });
  const { data: servicesData } = useGetServicesChart({ query: { queryKey: getGetServicesChartQueryKey() } });

  const cards = [
    {
      title: "Faturamento Hoje",
      value: summary?.todayRevenue || 0,
      prefix: "R$ ",
      icon: DollarSign,
      gradient: "from-emerald-500/12 to-transparent",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      border: "border-emerald-500/12",
    },
    {
      title: "Faturamento do Mês",
      value: summary?.monthRevenue || 0,
      prefix: "R$ ",
      icon: TrendingUp,
      gradient: "from-blue-500/12 to-transparent",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      border: "border-blue-500/12",
    },
    {
      title: "Agendamentos Hoje",
      value: summary?.todayAppointments || 0,
      prefix: "",
      icon: CalendarCheck,
      gradient: "from-rose-500/12 to-transparent",
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      border: "border-rose-500/12",
    },
  ];

  const BAR_COLORS = ["#C1121F","#e35d66","#ea8c92","#f0b0b4","#f5cdd0"];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <SectionHeader title="Visão Geral" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22,1,0.36,1] }}
            className={`relative overflow-hidden rounded-2xl p-6 border bg-gradient-to-br ${card.gradient} ${card.border} glass-card`}
          >
            <div className="flex items-start justify-between mb-5">
              <p className="text-muted-foreground text-sm font-medium">{card.title}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-white tracking-tight">
              <AnimatedNumber target={card.value} prefix={card.prefix} />
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="lg:col-span-2 glass-card rounded-2xl p-6"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Faturamento</p>
          <p className="font-display text-lg font-bold text-white mb-5">Últimos 14 dias</p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData?.slice(-14) || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#C1121F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C1121F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "12px" }}
                  labelStyle={{ color: "#eee" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C1121F" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#C1121F" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
          className="glass-card rounded-2xl p-6"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Serviços</p>
          <p className="font-display text-lg font-bold text-white mb-5">Mais vendidos</p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicesData || []} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="serviceName" type="category" stroke="#555" fontSize={10} tickLine={false} axisLine={false} width={90} tick={{ fill: "#777" }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "12px" }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {(servicesData || []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ══ Calendar gradients ══ */
const SERVICE_GRADIENTS: Record<string, string> = {
  "corte-simples":                    "linear-gradient(135deg,#1D3557,#2a5298)",
  "corte-sobrancelha":                "linear-gradient(135deg,#1a2f50,#2563eb)",
  "corte-barba":                      "linear-gradient(135deg,#7c1d26,#E63946)",
  "corte-penteado-barba-sobrancelha": "linear-gradient(135deg,#6d1e4c,#c2185b)",
  "corte-progressiva":                "linear-gradient(135deg,#4a1d96,#7c3aed)",
  "dois-cortes":                      "linear-gradient(135deg,#1d4556,#0ea5e9)",
  "pezinho":                          "linear-gradient(135deg,#14532d,#16a34a)",
  "penteado":                         "linear-gradient(135deg,#1c3557,#0284c7)",
  "corte-luzes":                      "linear-gradient(135deg,#713f12,#d97706)",
  "corte-luzes-branca":               "linear-gradient(135deg,#7f1d1d,#f59e0b)",
  "sobrancelha":                      "linear-gradient(135deg,#14532d,#22c55e)",
  "barba":                            "linear-gradient(135deg,#7c1d26,#f43f5e)",
  "corte-relaxamento":                "linear-gradient(135deg,#312e81,#6366f1)",
  "corte-penteado":                   "linear-gradient(135deg,#1d3557,#3b82f6)",
  "corte-dimil-colorido":             "linear-gradient(135deg,#701a75,#a855f7)",
};
const COMPLETED_GRADIENT = "linear-gradient(135deg,#14532d,#22c55e)";
const CANCELLED_GRADIENT  = "linear-gradient(135deg,#1c1c1c,#374151)";

/* ══════════════════════════════════════════════
   CALENDAR TAB
══════════════════════════════════════════════ */
function CalendarTab() {
  const [selectedEvent, setSelectedEvent] = useState<Record<string, unknown> | null>(null);
  const [barberId, setBarberId] = useState<string>("all");
  const qc = useQueryClient();
  const { data: barbers = [] } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const params = barberId !== "all" ? { barberId } : {};
  const { data: appointments = [] } = useListAppointments(params, { query: { queryKey: getListAppointmentsQueryKey(params) } });
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();
  const { toast } = useToast();

  const events = appointments.map((apt) => ({
    id: String(apt.id), title: apt.clientName,
    start: `${apt.date}T${apt.time}`,
    extendedProps: apt, backgroundColor: "transparent", borderColor: "transparent",
  }));

  const renderEventContent = (info: { event: { extendedProps: Record<string, unknown>; startStr: string } }) => {
    const apt = info.event.extendedProps;
    const gradient =
      apt.status === "completed" ? COMPLETED_GRADIENT :
      apt.status === "cancelled" ? CANCELLED_GRADIENT :
      (SERVICE_GRADIENTS[apt.serviceId as string] ?? "linear-gradient(135deg,#1D3557,#C1121F)");
    return (
      <div className="cal-event-card" style={{ background: gradient, boxShadow: "0 2px 8px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)" }}>
        <div className="cal-event-name">{apt.clientName as string}</div>
        <div className="cal-event-service">{apt.serviceName as string}</div>
        <div className="cal-event-time">{info.event.startStr.slice(11, 16)}</div>
      </div>
    );
  };

  const handleComplete = () => {
    if (!selectedEvent) return;
    updateMutation.mutate(
      { id: selectedEvent.id as number, data: { status: "completed" } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) }); toast({ title: "Concluído" }); setSelectedEvent(null); } }
    );
  };
  const handleDelete = () => {
    if (!selectedEvent) return;
    deleteMutation.mutate(
      { id: selectedEvent.id as number },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) }); toast({ title: "Excluído" }); setSelectedEvent(null); } }
    );
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto" style={{ height: "calc(100vh - 80px)" }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader title="Calendário" />
        <Select value={barberId} onValueChange={setBarberId}>
          <SelectTrigger className="bg-white/5 border-white/8 h-9 w-48 text-sm rounded-xl">
            <SelectValue placeholder="Todos os barbeiros" />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-white/8">
            <SelectItem value="all">Todos os barbeiros</SelectItem>
            {barbers.filter((b) => b.active).map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="glass-card rounded-2xl p-5 overflow-hidden" style={{ height: "calc(100% - 72px)" }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridWeek,timeGridDay" }}
          locale={ptBrLocale} slotMinTime="07:00:00" slotMaxTime="21:00:00"
          events={events} eventContent={renderEventContent}
          eventClick={(info) => setSelectedEvent(info.event.extendedProps as Record<string, unknown>)}
          height="100%" eventMinHeight={36} nowIndicator allDaySlot={false}
        />
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <Dialog open onOpenChange={(o) => !o && setSelectedEvent(null)}>
            <DialogContent className="bg-[#0f0f0f] border border-white/8 sm:max-w-md rounded-3xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-white text-lg font-bold">Detalhes</DialogTitle>
              </DialogHeader>
              <div className="space-y-1 py-2">
                {[
                  { label: "Cliente",    value: selectedEvent.clientName as string },
                  { label: "Telefone",   value: selectedEvent.clientPhone as string },
                  { label: "Serviço",    value: selectedEvent.serviceName as string },
                  { label: "Data / Hora", value: `${String(selectedEvent.date).split("-").reverse().join("/")} às ${selectedEvent.time as string}` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">{row.label}</span>
                    <span className="text-white font-semibold text-sm text-right max-w-[200px]">{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3">
                  <span className="text-muted-foreground text-sm">Valor</span>
                  <span className="text-gold font-bold text-base">R$ {Number(selectedEvent.servicePrice).toFixed(2)}</span>
                </div>
              </div>
              <DialogFooter className="flex gap-2 sm:justify-end pt-1">
                <Button variant="outline" size="sm" className="border-white/10 text-foreground hover:bg-white/5 rounded-xl" onClick={() => setSelectedEvent(null)}>Fechar</Button>
                {selectedEvent.status === "pending" && (
                  <Button size="sm" className="bg-green-500/12 text-green-400 hover:bg-green-500/20 border border-green-500/20 rounded-xl" onClick={handleComplete}>Concluir</Button>
                )}
                <Button size="sm" className="bg-red-500/12 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl" onClick={handleDelete}>Excluir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════
   APPOINTMENTS TAB
══════════════════════════════════════════════ */
function AppointmentsTab() {
  const [period, setPeriod] = useState<"day"|"week"|"month"|undefined>(undefined);
  const [barberId, setBarberId] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; groupId: string | null; isRecurring: boolean } | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: barbers = [] } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const params = { ...(period ? { period } : {}), ...(barberId !== "all" ? { barberId } : {}) };
  const { data: appointments = [] } = useListAppointments(params, { query: { queryKey: getListAppointmentsQueryKey(params) } });
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();
  const groupDeleteMutation = useDeleteRecurringGroup();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) });

  const handleComplete = (id: number) => updateMutation.mutate({ id, data: { status: "completed" } }, { onSuccess: invalidate });
  const handleDeleteSingle = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate({ id: deleteTarget.id }, { onSuccess: () => { invalidate(); toast({ title: "Excluído" }); setDeleteTarget(null); } });
  };
  const handleDeleteGroup = () => {
    if (!deleteTarget?.groupId) return;
    groupDeleteMutation.mutate({ groupId: deleteTarget.groupId }, { onSuccess: () => { invalidate(); toast({ title: "Grupo excluído" }); setDeleteTarget(null); } });
  };

  const FILTERS: { label: string; value: typeof period }[] = [
    { label: "Todos",  value: undefined },
    { label: "Hoje",   value: "day" },
    { label: "Semana", value: "week" },
    { label: "Mês",    value: "month" },
  ];

  const statusStyle = (s: string) =>
    s === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    s === "cancelled" ? "bg-gray-500/10 text-gray-400 border-gray-500/20" :
    "bg-amber-500/10 text-amber-400 border-amber-500/20";
  const statusLabel = (s: string) =>
    s === "completed" ? "Concluído" : s === "cancelled" ? "Cancelado" : "Pendente";

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <SectionHeader title="Agendamentos" />
        <div className="flex flex-wrap gap-2 items-center">
          {/* Period filter */}
          <div className="flex bg-white/4 rounded-xl p-1 border border-white/7 gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setPeriod(f.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === f.value ? "bg-accent text-white shadow" : "text-muted-foreground hover:text-white"
                }`}
                data-testid={`filter-${f.value || "all"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Barber filter */}
          <Select value={barberId} onValueChange={setBarberId}>
            <SelectTrigger className="bg-white/5 border-white/8 h-8 w-44 text-xs rounded-xl">
              <SelectValue placeholder="Todos os barbeiros" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/8">
              <SelectItem value="all">Todos os barbeiros</SelectItem>
              {barbers.filter((b) => b.active).map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/6">
                {["Cliente","Serviço","Data / Hora","Barbeiro","Valor","Status",""].map((h) => (
                  <th key={h} className="px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              ) : appointments.map((apt) => (
                <tr key={apt.id} className="border-b border-white/4 hover:bg-white/3 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                        {apt.clientName.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white text-sm">{apt.clientName}</span>
                          {apt.isRecurring && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/12 text-blue-400 border border-blue-500/20 tracking-wide">
                              RECORRENTE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{apt.clientPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground max-w-[160px] truncate">{apt.serviceName}</td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-white">{apt.date.split("-").reverse().join("/")}</div>
                    <div className="text-xs text-muted-foreground">{apt.time}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {apt.barberId
                      ? barbers.find((b) => String(b.id) === apt.barberId)?.name ?? `#${apt.barberId}`
                      : <span className="opacity-30">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-gold font-bold">R$ {Number(apt.servicePrice).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusStyle(apt.status)}`}>
                      {statusLabel(apt.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {apt.status === "pending" && (
                        <button
                          className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                          onClick={() => handleComplete(apt.id)}
                          data-testid={`btn-complete-${apt.id}`}
                          title="Concluir"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                        onClick={() => setDeleteTarget({ id: apt.id, groupId: apt.recurrenceGroupId ?? null, isRecurring: !!apt.isRecurring })}
                        data-testid={`btn-delete-${apt.id}`}
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <Dialog open onOpenChange={(o) => !o && setDeleteTarget(null)}>
            <DialogContent className="bg-[#0f0f0f] border border-white/8 sm:max-w-sm rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-display text-white font-bold">Excluir agendamento</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground text-sm py-2">
                {deleteTarget.isRecurring && deleteTarget.groupId
                  ? "Este agendamento faz parte de uma série recorrente. Deseja excluir somente este ou toda a série?"
                  : "Tem certeza que deseja excluir este agendamento?"}
              </p>
              <DialogFooter className="flex gap-2 flex-wrap sm:justify-end pt-1">
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 rounded-xl" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                <Button size="sm" className="bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 rounded-xl" onClick={handleDeleteSingle}>
                  {deleteTarget.isRecurring ? "Só este" : "Excluir"}
                </Button>
                {deleteTarget.isRecurring && deleteTarget.groupId && (
                  <Button size="sm" className="bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-600/25 rounded-xl" onClick={handleDeleteGroup}>
                    Toda a série
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════
   NEW APPOINTMENT TAB — recurring-capable
══════════════════════════════════════════════ */
const ADMIN_WEEKDAYS = [
  { value: "0", label: "Domingo",      short: "Dom" },
  { value: "2", label: "Terça-feira",  short: "Ter" },
  { value: "3", label: "Quarta-feira", short: "Qua" },
  { value: "4", label: "Quinta-feira", short: "Qui" },
  { value: "5", label: "Sexta-feira",  short: "Sex" },
  { value: "6", label: "Sábado",       short: "Sáb" },
];

function generate30minSlots(openHour: number, closeHour: number): string[] {
  const slots: string[] = [];
  let cur = openHour * 60;
  while (cur + 30 <= closeHour * 60) {
    const h = Math.floor(cur / 60).toString().padStart(2, "0");
    const m = (cur % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    cur += 30;
  }
  return slots;
}
const ADMIN_WEEKDAY_SLOTS: Record<string, string[]> = {
  "0": generate30minSlots(7, 14),
  "2": generate30minSlots(7, 20),
  "3": generate30minSlots(7, 20),
  "4": generate30minSlots(7, 20),
  "5": generate30minSlots(7, 20),
  "6": generate30minSlots(7, 20),
};
const ADMIN_PERIOD_OPTIONS = [
  { value: "this_month",    label: "Este mês" },
  { value: "next_2_months", label: "Próximos 2 meses" },
];
function getMaxDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()).toISOString().split("T")[0];
}

type AdminRecurringResult = { groupId: string; created: string[]; skipped: number; time: string };

function NewAppointmentTab({ onComplete }: { onComplete: () => void }) {
  const { data: services = [] } = useListServices();
  const { data: barbers  = [] } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const createMutation          = useCreateAppointment();
  const createRecurringMutation = useCreateRecurringAppointments();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [serviceId, setServiceId] = useState("");
  const [barberId,  setBarberId]  = useState("all");
  const [date,      setDate]      = useState("");
  const [time,      setTime]      = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [weekday,   setWeekday]   = useState("4");
  const [period,    setPeriod]    = useState<"this_month"|"next_2_months">("this_month");
  const [result,    setResult]    = useState<AdminRecurringResult | null>(null);

  const resolvedBarberId = barberId !== "all" ? barberId : null;
  const slotParams = { date, serviceId, ...(resolvedBarberId ? { barberId: resolvedBarberId } : {}) };
  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlots(slotParams, {
    query: { enabled: !isRecurring && !!date && !!serviceId, queryKey: getGetAvailableSlotsQueryKey(slotParams) },
  });

  const handleDateChange = (v: string) => {
    if (v) { const dow = new Date(v).getUTCDay(); if (dow === 1) { toast({ title: "Aviso", description: "Segunda-feira fechado" }); setDate(""); return; } }
    setDate(v); setTime("");
  };

  const handleSingle = () => {
    if (!name || !phone || !serviceId || !date || !time) return;
    createMutation.mutate(
      { data: { serviceId, date, time, clientName: name, clientPhone: phone, barberId: resolvedBarberId } },
      {
        onSuccess: () => { toast({ title: "Sucesso", description: "Agendamento criado." }); qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) }); onComplete(); },
        onError: () => toast({ title: "Erro", description: "Horário indisponível ou conflito.", variant: "destructive" }),
      }
    );
  };

  const handleRecurring = () => {
    if (!name || !phone || !serviceId || !time) return;
    createRecurringMutation.mutate(
      { data: { clientName: name, clientPhone: phone, serviceId, time, weekday: parseInt(weekday, 10), period, startDate: new Date().toISOString().split("T")[0], barberId: resolvedBarberId } },
      {
        onSuccess: (res) => {
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
          if (res.created.length === 0) { toast({ title: "Sem disponibilidade", description: "Todas as datas já estão ocupadas.", variant: "destructive" }); return; }
          setResult({ groupId: res.groupId, created: res.created.map((a) => a.date), skipped: res.skipped.length, time });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao criar recorrências.", variant: "destructive" }),
      }
    );
  };

  const resetForm = () => {
    setName(""); setPhone(""); setServiceId(""); setBarberId("all");
    setDate(""); setTime(""); setIsRecurring(false); setWeekday("4"); setPeriod("this_month"); setResult(null);
  };

  const isPending   = createMutation.isPending || createRecurringMutation.isPending;
  const canSingle   = !isRecurring && !!name && !!phone && !!serviceId && !!date && !!time;
  const canRecurring = isRecurring && !!name && !!phone && !!serviceId && !!time;

  /* Success screen */
  if (result) {
    return (
      <div className="max-w-md mx-auto">
        <div className="glass-card rounded-3xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-sm mb-1">Recorrência criada</p>
            <h2 className="font-display text-2xl font-bold text-white">{result.created.length} agendamentos!</h2>
            {result.skipped > 0 && <p className="text-muted-foreground text-xs mt-1">{result.skipped} ignorado{result.skipped !== 1 ? "s" : ""} por conflito</p>}
          </div>
          <div className="rounded-2xl bg-white/3 border border-white/6 divide-y divide-white/5 max-h-52 overflow-y-auto text-left">
            {result.created.map((d) => (
              <div key={d} className="flex justify-between items-center px-5 py-3">
                <span className="text-white text-sm font-semibold">{d.split("-").reverse().join("/")}</span>
                <span className="text-gold text-sm">{result.time}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button className="flex-1 bg-accent hover:bg-accent/90 text-white h-11 rounded-xl font-semibold" onClick={onComplete}>Ver Agendamentos</Button>
            <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5 h-11 rounded-xl" onClick={resetForm}>
              <RefreshCw className="w-4 h-4 mr-2" /> Novo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <SectionHeader title="Novo Agendamento" />

      <div className="glass-card rounded-3xl p-7 space-y-5">
        {/* Client info */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cliente">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo"
              className="bg-white/5 border-white/8 h-11 rounded-xl text-white" data-testid="input-new-client-name" />
          </Field>
          <Field label="Telefone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999"
              className="bg-white/5 border-white/8 h-11 rounded-xl text-white" data-testid="input-new-client-phone" />
          </Field>
        </div>

        {/* Service */}
        <Field label="Serviço">
          <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setTime(""); }}>
            <SelectTrigger className="bg-white/5 border-white/8 h-11 rounded-xl" data-testid="select-new-service">
              <SelectValue placeholder="Selecione o serviço" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/8">
              {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.priceLabel}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        {/* Barber */}
        <Field label="Barbeiro">
          <Select value={barberId} onValueChange={setBarberId}>
            <SelectTrigger className="bg-white/5 border-white/8 h-11 rounded-xl" data-testid="select-new-barber">
              <SelectValue placeholder="Qualquer barbeiro" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/8">
              <SelectItem value="all">Qualquer barbeiro</SelectItem>
              {barbers.filter((b) => b.active).map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        {/* Recurring toggle */}
        <Field label="Agendamento recorrente?">
          <div className="flex gap-2">
            {[{ value: false, label: "Não" }, { value: true, label: "Sim — semanal fixo" }].map((opt) => (
              <button key={String(opt.value)} type="button"
                onClick={() => { setIsRecurring(opt.value); setDate(""); setTime(""); }}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-all ${
                  isRecurring === opt.value
                    ? "bg-accent/15 border-accent text-white"
                    : "bg-white/4 border-white/8 text-muted-foreground hover:bg-white/7"
                }`}
                data-testid={`admin-toggle-recurring-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        <AnimatePresence mode="wait">
          {!isRecurring ? (
            <motion.div key="single" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data">
                  <Input type="date" value={date} min={new Date().toISOString().split("T")[0]} max={getMaxDate()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="bg-white/5 border-white/8 h-11 rounded-xl text-white" data-testid="input-new-date" />
                </Field>
                <Field label="Horário">
                  <Select value={time} onValueChange={setTime} disabled={!date || !serviceId || slotsLoading}>
                    <SelectTrigger className="bg-white/5 border-white/8 h-11 rounded-xl" data-testid="input-new-time">
                      <SelectValue placeholder={!date || !serviceId ? "Escolha data e serviço" : slotsLoading ? "Carregando..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/8 max-h-56 overflow-y-auto">
                      {(slotsData?.slots ?? []).map((slot: string) => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                      {!slotsLoading && date && serviceId && (slotsData?.slots ?? []).length === 0 && (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">Sem horários</div>
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </motion.div>
          ) : (
            <motion.div key="recurring" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/8 border border-blue-500/15">
                <CalendarDays className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-300/90 leading-relaxed">
                  Agendamentos para todos os dias selecionados no período. Datas com conflito são ignoradas.
                </p>
              </div>

              <Field label="Dia da semana">
                <div className="flex gap-2 flex-wrap">
                  {ADMIN_WEEKDAYS.map((d) => (
                    <button key={d.value} type="button" onClick={() => { setWeekday(d.value); setTime(""); }}
                      className={`h-9 px-3 rounded-xl text-sm font-semibold border transition-all ${
                        weekday === d.value ? "bg-accent border-accent text-white" : "bg-white/5 border-white/8 text-muted-foreground hover:text-white"
                      }`}
                      data-testid="admin-select-weekday"
                    >{d.short}</button>
                  ))}
                </div>
              </Field>

              <Field label="Horário fixo">
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="bg-white/5 border-white/8 h-11 rounded-xl" data-testid="admin-select-recurring-time">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/8 max-h-56 overflow-y-auto">
                    {(ADMIN_WEEKDAY_SLOTS[weekday] ?? ADMIN_WEEKDAY_SLOTS["2"]).map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Período">
                <div className="flex gap-2">
                  {ADMIN_PERIOD_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setPeriod(opt.value as typeof period)}
                      className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-all ${
                        period === opt.value ? "bg-gold/15 border-gold text-gold" : "bg-white/4 border-white/8 text-muted-foreground hover:bg-white/7"
                      }`}
                      data-testid={`admin-period-${opt.value}`}
                    >{opt.label}</button>
                  ))}
                </div>
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="button" onClick={isRecurring ? handleRecurring : handleSingle}
          disabled={isPending || (!canSingle && !canRecurring)}
          className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm glow-accent"
          data-testid="button-new-submit"
        >
          {isPending ? "Salvando..." : isRecurring ? "Criar Agendamentos Recorrentes" : "Criar Agendamento"}
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   BARBEIROS TAB
══════════════════════════════════════════════ */
function BarbeirosTab() {
  const qc = useQueryClient();
  const { data: barbers = [], isLoading } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const createMutation = useCreateBarber();
  const updateMutation = useUpdateBarber();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [newName,  setNewName]  = useState("");
  const [editId,   setEditId]   = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListBarbersQueryKey() });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(
      { data: { name: newName.trim() } },
      { onSuccess: () => { toast({ title: "Barbeiro adicionado." }); invalidate(); setNewName(""); setShowForm(false); },
        onError: () => toast({ title: "Erro", variant: "destructive" }) }
    );
  };

  const handleRename = (id: number) => {
    if (!editName.trim()) return;
    updateMutation.mutate(
      { id, data: { name: editName.trim() } },
      { onSuccess: () => { toast({ title: "Nome atualizado." }); invalidate(); setEditId(null); } }
    );
  };

  const handleToggle = (b: { id: number; active: boolean }) => {
    updateMutation.mutate(
      { id: b.id, data: { active: !b.active } },
      { onSuccess: () => { toast({ title: b.active ? "Barbeiro desativado" : "Barbeiro ativado" }); invalidate(); } }
    );
  };

  const AVATAR_COLORS = ["bg-blue-500/15 text-blue-400","bg-purple-500/15 text-purple-400","bg-amber-500/15 text-amber-400","bg-emerald-500/15 text-emerald-400","bg-pink-500/15 text-pink-400"];

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-white tracking-tight">Barbeiros</h2>
        <Button size="sm" className="bg-accent hover:bg-accent/90 text-white rounded-xl gap-2 h-9 font-semibold"
          onClick={() => setShowForm((v) => !v)}>
          <Users className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            onSubmit={handleCreate} className="glass-card rounded-2xl p-5 flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome do barbeiro</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: João"
                className="bg-white/5 border-white/8 h-11 rounded-xl text-white" autoFocus />
            </div>
            <Button type="submit" size="sm" className="bg-accent hover:bg-accent/90 text-white h-11 px-5 rounded-xl font-semibold"
              disabled={createMutation.isPending || !newName.trim()}>
              {createMutation.isPending ? "..." : "Salvar"}
            </Button>
            <Button type="button" size="sm" variant="outline"
              className="border-white/10 hover:bg-white/5 h-11 rounded-xl"
              onClick={() => { setShowForm(false); setNewName(""); }}>
              Cancelar
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center text-muted-foreground text-sm">Carregando...</div>
      ) : barbers.length === 0 ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center text-muted-foreground text-sm">Nenhum barbeiro cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {barbers.map((b, i) => (
            <motion.div key={b.id} layout className={`glass-card rounded-2xl p-5 border transition-all ${b.active ? "border-white/7" : "border-white/3 opacity-60"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-lg shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                  {initials(b.name)}
                </div>
                <div className="flex-1 min-w-0">
                  {editId === b.id ? (
                    <div className="flex gap-2 items-center">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                        className="bg-white/5 border-white/8 h-8 text-sm rounded-xl flex-1"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleRename(b.id); if (e.key === "Escape") setEditId(null); }} />
                      <button className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center" onClick={() => handleRename(b.id)}>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-white/5 text-muted-foreground hover:bg-white/10 flex items-center justify-center" onClick={() => setEditId(null)}>
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={`font-semibold text-sm ${b.active ? "text-white" : "text-muted-foreground line-through"}`}>{b.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${b.active ? "bg-emerald-400" : "bg-gray-500"}`} />
                        <span className="text-xs text-muted-foreground">{b.active ? "Disponível" : "Inativo"}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {editId !== b.id && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-white/5 hover:bg-white/9 text-muted-foreground hover:text-white text-xs font-medium transition-colors border border-white/6"
                    onClick={() => { setEditId(b.id); setEditName(b.name); }}
                    data-testid={`btn-rename-${b.id}`}
                  >
                    <Pencil className="w-3 h-3" /> Renomear
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-xs font-medium transition-colors border ${
                      b.active
                        ? "bg-red-500/8 hover:bg-red-500/15 text-red-400 border-red-500/15"
                        : "bg-emerald-500/8 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/15"
                    }`}
                    onClick={() => handleToggle(b)}
                    data-testid={`btn-toggle-${b.id}`}
                  >
                    {b.active ? <><UserX className="w-3 h-3" /> Desativar</> : <><UserCheck className="w-3 h-3" /> Ativar</>}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
