import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  CalendarDays,
  List,
  PlusCircle,
  LogOut,
  Trash2,
  CheckCircle2,
  TrendingUp,
  CalendarCheck,
  DollarSign,
  Users,
  Pencil,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useGetRevenueChart,
  getGetRevenueChartQueryKey,
  useGetServicesChart,
  getGetServicesChartQueryKey,
  useListAppointments,
  getListAppointmentsQueryKey,
  useUpdateAppointment,
  useDeleteAppointment,
  useDeleteRecurringGroup,
  useListServices,
  useCreateAppointment,
  useGetAvailableSlots,
  getGetAvailableSlotsQueryKey,
  useListBarbers,
  getListBarbersQueryKey,
  useCreateBarber,
  useUpdateBarber,
  useCreateRecurringAppointments,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/admin");
  };

  const navItems = [
    { id: "overview", icon: LayoutDashboard, label: "Visão Geral" },
    { id: "calendar", icon: CalendarDays, label: "Calendário" },
    { id: "appointments", icon: List, label: "Agendamentos" },
    { id: "new", icon: PlusCircle, label: "Novo Agendamento" },
    { id: "barbers", icon: Users, label: "Barbeiros" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-60 bg-[#0D0D0D] border-r border-border p-5 flex flex-col md:min-h-screen shrink-0">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <img src="/barbershop-logo.jpeg" alt="Logo" className="w-8 h-8 rounded-full object-cover" />
          <span className="text-white font-bold tracking-tight">Jedilson Hair</span>
        </div>

        <nav className="flex md:flex-col flex-row gap-2 flex-1 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium whitespace-nowrap ${
                activeTab === item.id
                  ? "bg-accent text-accent-foreground glow-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-4 md:mt-auto flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-sm font-medium"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "appointments" && <AppointmentsTab />}
        {activeTab === "new" && <NewAppointmentTab onComplete={() => setActiveTab("appointments")} />}
        {activeTab === "barbers" && <BarbeirosTab />}
      </main>
    </div>
  );
}

function AnimatedNumber({ target, prefix = "" }: { target: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 900;
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
      color: "from-emerald-500/20 to-emerald-600/5",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      title: "Faturamento do Mês",
      value: summary?.monthRevenue || 0,
      prefix: "R$ ",
      icon: TrendingUp,
      color: "from-blue-500/20 to-blue-600/5",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      title: "Agendamentos Hoje",
      value: summary?.todayAppointments || 0,
      prefix: "",
      icon: CalendarCheck,
      color: "from-rose-500/20 to-rose-600/5",
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-white tracking-tight">Visão Geral</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`relative overflow-hidden glass rounded-2xl p-6 bg-gradient-to-br ${card.color}`}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-muted-foreground text-sm font-medium">{card.title}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">
              <AnimatedNumber target={card.value} prefix={card.prefix} />
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass rounded-2xl p-6"
        >
          <h3 className="text-base font-bold text-white mb-6 tracking-tight">Faturamento — últimos 14 dias</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData?.slice(-14) || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", fontSize: "12px" }}
                  labelStyle={{ color: "#F1FAEE" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#E63946" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-base font-bold text-white mb-6 tracking-tight">Serviços mais vendidos</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicesData || []} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="serviceName" type="category" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} width={86} tick={{ fill: "#6B7280" }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", fontSize: "12px" }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {(servicesData || []).map((_: unknown, index: number) => (
                    <rect key={index} fill={`hsl(${356 - index * 15}, 70%, ${55 - index * 2}%)`} />
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

// Gradient palette per service category
const SERVICE_GRADIENTS: Record<string, string> = {
  "corte-simples":               "linear-gradient(135deg, #1D3557 0%, #2a5298 100%)",
  "corte-sobrancelha":           "linear-gradient(135deg, #1a2f50 0%, #2563eb 100%)",
  "corte-barba":                 "linear-gradient(135deg, #7c1d26 0%, #E63946 100%)",
  "corte-penteado-barba-sobrancelha": "linear-gradient(135deg, #6d1e4c 0%, #c2185b 100%)",
  "corte-progressiva":           "linear-gradient(135deg, #4a1d96 0%, #7c3aed 100%)",
  "dois-cortes":                 "linear-gradient(135deg, #1d4556 0%, #0ea5e9 100%)",
  "pezinho":                     "linear-gradient(135deg, #14532d 0%, #16a34a 100%)",
  "penteado":                    "linear-gradient(135deg, #1c3557 0%, #0284c7 100%)",
  "corte-luzes":                 "linear-gradient(135deg, #713f12 0%, #d97706 100%)",
  "corte-luzes-branca":          "linear-gradient(135deg, #7f1d1d 0%, #f59e0b 100%)",
  "sobrancelha":                 "linear-gradient(135deg, #14532d 0%, #22c55e 100%)",
  "barba":                       "linear-gradient(135deg, #7c1d26 0%, #f43f5e 100%)",
  "corte-relaxamento":           "linear-gradient(135deg, #312e81 0%, #6366f1 100%)",
  "corte-penteado":              "linear-gradient(135deg, #1d3557 0%, #3b82f6 100%)",
  "corte-dimil-colorido":        "linear-gradient(135deg, #701a75 0%, #a855f7 100%)",
};

const COMPLETED_GRADIENT = "linear-gradient(135deg, #14532d 0%, #22c55e 100%)";
const CANCELLED_GRADIENT = "linear-gradient(135deg, #1c1c1c 0%, #4b5563 100%)";

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
    id: String(apt.id),
    title: apt.clientName,
    start: `${apt.date}T${apt.time}`,
    extendedProps: apt,
    // FC uses these for its own layout — we override visually via eventContent
    backgroundColor: "transparent",
    borderColor: "transparent",
  }));

  const renderEventContent = (eventInfo: { event: { extendedProps: Record<string, unknown>; startStr: string } }) => {
    const apt = eventInfo.event.extendedProps;
    const serviceId = apt.serviceId as string;
    const status = apt.status as string;
    const gradient =
      status === "completed" ? COMPLETED_GRADIENT :
      status === "cancelled" ? CANCELLED_GRADIENT :
      (SERVICE_GRADIENTS[serviceId] ?? "linear-gradient(135deg, #1D3557 0%, #E63946 100%)");

    const timeStr = eventInfo.event.startStr.slice(11, 16);

    return (
      <div
        className="cal-event-card"
        style={{
          background: gradient,
          boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div className="cal-event-name">{apt.clientName as string}</div>
        <div className="cal-event-service">{apt.serviceName as string}</div>
        <div className="cal-event-time">{timeStr}</div>
      </div>
    );
  };

  const handleComplete = () => {
    if (!selectedEvent) return;
    updateMutation.mutate(
      { id: selectedEvent.id as number, data: { status: "completed" } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) });
          toast({ title: "Sucesso", description: "Agendamento concluído." });
          setSelectedEvent(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    deleteMutation.mutate(
      { id: selectedEvent.id as number },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) });
          toast({ title: "Sucesso", description: "Agendamento excluído." });
          setSelectedEvent(null);
        },
      }
    );
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto" style={{ height: "calc(100vh - 120px)" }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Calendário</h2>
        <Select value={barberId} onValueChange={setBarberId}>
          <SelectTrigger className="bg-input border-border h-9 w-48 text-sm">
            <SelectValue placeholder="Todos os barbeiros" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todos os barbeiros</SelectItem>
            {barbers.filter((b) => b.active).map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="glass rounded-2xl p-5 overflow-hidden" style={{ height: "calc(100% - 72px)" }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridWeek,timeGridDay" }}
          locale={ptBrLocale}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          events={events}
          eventContent={renderEventContent}
          eventClick={(info) => setSelectedEvent(info.event.extendedProps as Record<string, unknown>)}
          height="100%"
          eventMinHeight={36}
          nowIndicator
          allDaySlot={false}
        />
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <Dialog open onOpenChange={(o) => !o && setSelectedEvent(null)}>
            <DialogContent className="bg-[#111] border border-white/10 sm:max-w-md rounded-2xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-white text-base font-bold">Detalhes do Agendamento</DialogTitle>
              </DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 py-2"
              >
                {[
                  { label: "Cliente", value: selectedEvent.clientName as string },
                  { label: "Telefone", value: selectedEvent.clientPhone as string },
                  { label: "Serviço", value: selectedEvent.serviceName as string },
                  {
                    label: "Data / Hora",
                    value: `${String(selectedEvent.date).split("-").reverse().join("/")} às ${selectedEvent.time as string}`,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">{row.label}</span>
                    <span className="text-white font-medium text-sm text-right max-w-[200px]">{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-muted-foreground text-sm">Valor</span>
                  <span className="text-gold font-bold text-base">
                    R$ {Number(selectedEvent.servicePrice).toFixed(2)}
                  </span>
                </div>
              </motion.div>
              <DialogFooter className="flex gap-2 sm:justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-foreground hover:bg-white/5 rounded-lg"
                  onClick={() => setSelectedEvent(null)}
                >
                  Fechar
                </Button>
                {selectedEvent.status === "pending" && (
                  <Button
                    size="sm"
                    className="bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20 rounded-lg"
                    onClick={handleComplete}
                  >
                    Concluir
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 rounded-lg"
                  onClick={handleDelete}
                >
                  Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

function AppointmentsTab() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | undefined>(undefined);
  const [barberId, setBarberId] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; groupId: string | null; isRecurring: boolean } | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: barbers = [] } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });

  const params = { ...(period ? { period } : {}), ...(barberId !== "all" ? { barberId } : {}) };
  const { data: appointments = [] } = useListAppointments(params, {
    query: { queryKey: getListAppointmentsQueryKey(params) },
  });

  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();
  const groupDeleteMutation = useDeleteRecurringGroup();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) });

  const handleComplete = (id: number) => {
    updateMutation.mutate(
      { id, data: { status: "completed" } },
      { onSuccess: invalidate }
    );
  };

  const handleDeleteSingle = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Excluído", description: "Agendamento removido." });
          setDeleteTarget(null);
        },
      }
    );
  };

  const handleDeleteGroup = () => {
    if (!deleteTarget?.groupId) return;
    groupDeleteMutation.mutate(
      { groupId: deleteTarget.groupId },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Grupo excluído", description: "Todos os agendamentos do grupo foram removidos." });
          setDeleteTarget(null);
        },
      }
    );
  };

  const filters: { label: string; value: typeof period }[] = [
    { label: "Todos", value: undefined },
    { label: "Hoje", value: "day" },
    { label: "Semana", value: "week" },
    { label: "Mês", value: "month" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-white tracking-tight">Agendamentos</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-card rounded-lg p-1 border border-border">
            {filters.map((f) => (
              <button
                key={f.label}
                onClick={() => setPeriod(f.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === f.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-white"
                }`}
                data-testid={`filter-${f.value || "all"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Select value={barberId} onValueChange={setBarberId}>
            <SelectTrigger className="bg-input border-border h-9 w-44 text-sm">
              <SelectValue placeholder="Todos os barbeiros" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Todos os barbeiros</SelectItem>
              {barbers.filter((b) => b.active).map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Serviço</th>
                <th className="px-6 py-4 font-medium">Data/Hora</th>
                <th className="px-6 py-4 font-medium">Barbeiro</th>
                <th className="px-6 py-4 font-medium">Valor</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{apt.clientName}</span>
                        {apt.isRecurring && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20 tracking-wide">
                            RECORRENTE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{apt.clientPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[160px] truncate">{apt.serviceName}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{apt.date.split("-").reverse().join("/")}</div>
                      <div className="text-xs text-muted-foreground">{apt.time}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {apt.barberId
                        ? barbers.find((b) => String(b.id) === apt.barberId)?.name ?? `#${apt.barberId}`
                        : <span className="italic opacity-40">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gold font-medium">R$ {Number(apt.servicePrice).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        apt.status === "completed" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                        apt.status === "cancelled" ? "bg-gray-500/10 text-gray-500 border border-gray-500/20" :
                        "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      }`}>
                        {apt.status === "completed" ? "Concluído" : apt.status === "cancelled" ? "Cancelado" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {apt.status === "pending" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            onClick={() => handleComplete(apt.id)}
                            data-testid={`btn-complete-${apt.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setDeleteTarget({
                              id: apt.id,
                              groupId: apt.recurrenceGroupId ?? null,
                              isRecurring: apt.isRecurring,
                            })
                          }
                          data-testid={`btn-delete-${apt.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="bg-[#111] border border-white/10 rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-base">Excluir agendamento</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm py-2">
            {deleteTarget?.isRecurring
              ? "Este é um agendamento recorrente. Deseja excluir apenas este ou todo o grupo?"
              : "Confirmar exclusão deste agendamento?"}
          </p>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-foreground hover:bg-white/5 rounded-lg"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 rounded-lg"
              onClick={handleDeleteSingle}
              disabled={deleteMutation.isPending}
            >
              {deleteTarget?.isRecurring ? "Só este" : "Excluir"}
            </Button>
            {deleteTarget?.isRecurring && deleteTarget.groupId && (
              <Button
                size="sm"
                className="bg-red-700/20 text-red-300 hover:bg-red-700/30 border border-red-700/30 rounded-lg"
                onClick={handleDeleteGroup}
                disabled={groupDeleteMutation.isPending}
              >
                Todo o grupo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ADMIN_WEEKDAYS = [
  { value: "0", label: "Domingo" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
];

function generate30minSlots(openHour: number, closeHour: number): string[] {
  const slots: string[] = [];
  let current = openHour * 60;
  while (current + 30 <= closeHour * 60) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += 30;
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
  { value: "this_month", label: "Este mês" },
  { value: "next_2_months", label: "Próximos 2 meses" },
];

function getMaxDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()).toISOString().split("T")[0];
}

type AdminRecurringResult = { groupId: string; created: string[]; skipped: number; serviceName: string; time: string; clientName: string };

function NewAppointmentTab({ onComplete }: { onComplete: () => void }) {
  const { data: services = [] } = useListServices();
  const { data: barbers = [] } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const createMutation = useCreateAppointment();
  const createRecurringMutation = useCreateRecurringAppointments();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("all");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [weekday, setWeekday] = useState("4");
  const [period, setPeriod] = useState<"this_month" | "next_2_months">("this_month");
  const [recurringResult, setRecurringResult] = useState<AdminRecurringResult | null>(null);

  const resolvedBarberId = barberId !== "all" ? barberId : null;

  const slotParams = { date, serviceId, ...(resolvedBarberId ? { barberId: resolvedBarberId } : {}) };
  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlots(
    slotParams,
    {
      query: {
        enabled: !isRecurring && !!date && !!serviceId,
        queryKey: getGetAvailableSlotsQueryKey(slotParams),
      },
    }
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const dayOfWeek = new Date(val).getUTCDay();
      if (dayOfWeek === 1) {
        toast({ title: "Aviso", description: "Segunda-feira fechado" });
        setDate(""); return;
      }
    }
    setDate(val);
    setTime("");
  };

  const handleSingle = () => {
    if (!name || !phone || !serviceId || !date || !time) return;
    createMutation.mutate(
      { data: { serviceId, date, time, clientName: name, clientPhone: phone, barberId: resolvedBarberId } },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Agendamento criado." });
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
          onComplete();
        },
        onError: () => toast({ title: "Erro", description: "Horário indisponível ou conflito.", variant: "destructive" }),
      }
    );
  };

  const handleRecurring = () => {
    if (!name || !phone || !serviceId || !time) return;
    const service = services.find((s) => s.id === serviceId);
    const startDate = new Date().toISOString().split("T")[0];
    createRecurringMutation.mutate(
      {
        data: {
          clientName: name,
          clientPhone: phone,
          serviceId,
          time,
          weekday: parseInt(weekday, 10),
          period,
          startDate,
          barberId: resolvedBarberId,
        },
      },
      {
        onSuccess: (result) => {
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
          if (result.created.length === 0) {
            toast({ title: "Nenhum horário disponível", description: "Todas as datas do período já estão ocupadas.", variant: "destructive" });
            return;
          }
          setRecurringResult({
            groupId: result.groupId,
            created: result.created.map((a) => a.date),
            skipped: result.skipped.length,
            serviceName: service?.name ?? "",
            time,
            clientName: name,
          });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao criar agendamentos recorrentes.", variant: "destructive" }),
      }
    );
  };

  const resetForm = () => {
    setName(""); setPhone(""); setServiceId(""); setBarberId("all");
    setDate(""); setTime(""); setIsRecurring(false); setWeekday("4");
    setPeriod("this_month"); setRecurringResult(null);
  };

  const isPending = createMutation.isPending || createRecurringMutation.isPending;
  const canSingle = !isRecurring && !!name && !!phone && !!serviceId && !!date && !!time;
  const canRecurring = isRecurring && !!name && !!phone && !!serviceId && !!time;

  if (recurringResult) {
    return (
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-8 text-center"
        >
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Recorrência criada!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {recurringResult.created.length} agendamento{recurringResult.created.length !== 1 ? "s" : ""} criado{recurringResult.created.length !== 1 ? "s" : ""}
            {recurringResult.skipped > 0 && `, ${recurringResult.skipped} ignorado${recurringResult.skipped !== 1 ? "s" : ""} por conflito`}.
          </p>
          <div className="glass rounded-lg p-4 mb-6 text-left space-y-1.5 max-h-48 overflow-y-auto">
            {recurringResult.created.map((d) => (
              <div key={d} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                <span className="text-muted-foreground text-sm">{d.split("-").reverse().join("/")}</span>
                <span className="text-white text-sm font-medium">{recurringResult.time}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground h-11 font-semibold"
              onClick={() => { onComplete(); }}
            >
              Ver Agendamentos
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-white/10 text-foreground hover:bg-white/5 h-11"
              onClick={resetForm}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Novo Agendamento</h2>

      <div className="glass rounded-xl p-8 space-y-5">
        {/* Cliente */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Cliente</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            className="bg-input border-border h-12"
            data-testid="input-new-client-name"
          />
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Telefone</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="bg-input border-border h-12"
            data-testid="input-new-client-phone"
          />
        </div>

        {/* Serviço */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Serviço</label>
          <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setTime(""); }}>
            <SelectTrigger className="bg-input border-border h-12" data-testid="select-new-service">
              <SelectValue placeholder="Selecione o serviço" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} — {s.priceLabel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Barbeiro */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Barbeiro</label>
          <Select value={barberId} onValueChange={setBarberId}>
            <SelectTrigger className="bg-input border-border h-12" data-testid="select-new-barber">
              <SelectValue placeholder="Qualquer barbeiro" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Qualquer barbeiro</SelectItem>
              {barbers.filter((b) => b.active).map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recorrente toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Agendamento recorrente?</label>
          <div className="flex gap-2">
            {[
              { value: false, label: "Não" },
              { value: true, label: "Sim — semanal fixo" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => { setIsRecurring(opt.value); setDate(""); setTime(""); }}
                className={`flex-1 h-10 rounded-lg text-sm font-medium border transition-all ${
                  isRecurring === opt.value
                    ? "bg-accent/15 border-accent text-accent"
                    : "bg-input border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
                data-testid={`admin-toggle-recurring-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isRecurring ? (
            <motion.div
              key="single-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-5 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data</label>
                  <Input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    max={getMaxDate()}
                    onChange={handleDateChange}
                    className="bg-input border-border h-12"
                    data-testid="input-new-date"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Horário</label>
                  <Select value={time} onValueChange={setTime} disabled={!date || !serviceId || slotsLoading}>
                    <SelectTrigger className="bg-input border-border h-12" data-testid="input-new-time">
                      <SelectValue
                        placeholder={
                          !date || !serviceId ? "Selecione data e serviço"
                          : slotsLoading ? "Carregando..."
                          : "Selecione um horário"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-60 overflow-y-auto">
                      {(slotsData?.slots ?? []).map((slot: string) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                      {!slotsLoading && date && serviceId && (slotsData?.slots ?? []).length === 0 && (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">Sem horários disponíveis</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="recurring-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-5 overflow-hidden"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <CalendarDays className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-300 leading-relaxed">
                  Serão criados agendamentos para todos os dias da semana selecionados no período escolhido. Datas com conflito serão ignoradas automaticamente.
                </p>
              </div>

              {/* Dia da semana */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Dia da semana</label>
                <Select value={weekday} onValueChange={(v) => { setWeekday(v); setTime(""); }}>
                  <SelectTrigger className="bg-input border-border h-12" data-testid="admin-select-weekday">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {ADMIN_WEEKDAYS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horário fixo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Horário fixo</label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="bg-input border-border h-12" data-testid="admin-select-recurring-time">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60 overflow-y-auto">
                    {(ADMIN_WEEKDAY_SLOTS[weekday] ?? ADMIN_WEEKDAY_SLOTS["2"]).map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Período */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Período</label>
                <div className="flex gap-2">
                  {ADMIN_PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPeriod(opt.value as typeof period)}
                      className={`flex-1 h-10 rounded-lg text-xs font-medium border transition-all ${
                        period === opt.value
                          ? "bg-accent/15 border-accent text-accent"
                          : "bg-input border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                      data-testid={`admin-period-${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="button"
          onClick={isRecurring ? handleRecurring : handleSingle}
          disabled={isPending || (!canSingle && !canRecurring)}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 font-semibold mt-2"
          data-testid="button-new-submit"
        >
          {isPending
            ? "Salvando..."
            : isRecurring
            ? "Criar Agendamentos Recorrentes"
            : "Criar Agendamento"}
        </Button>
      </div>
    </div>
  );
}

function BarbeirosTab() {
  const qc = useQueryClient();
  const { data: barbers = [], isLoading } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const createMutation = useCreateBarber();
  const updateMutation = useUpdateBarber();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListBarbersQueryKey() });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(
      { data: { name: newName.trim() } },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Barbeiro adicionado." });
          invalidate();
          setNewName("");
          setShowForm(false);
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao adicionar barbeiro.", variant: "destructive" });
        },
      }
    );
  };

  const handleRename = (id: number) => {
    if (!editName.trim()) return;
    updateMutation.mutate(
      { id, data: { name: editName.trim() } },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Nome atualizado." });
          invalidate();
          setEditId(null);
        },
      }
    );
  };

  const handleToggleActive = (b: { id: number; active: boolean }) => {
    updateMutation.mutate(
      { id: b.id, data: { active: !b.active } },
      {
        onSuccess: () => {
          toast({
            title: b.active ? "Barbeiro desativado" : "Barbeiro ativado",
            description: b.active ? "Barbeiro não aparecerá nas seleções." : "Barbeiro disponível para agendamentos.",
          });
          invalidate();
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">Barbeiros</h2>
        <Button
          size="sm"
          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg gap-2"
          onClick={() => setShowForm((v) => !v)}
        >
          <Users className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="glass rounded-xl p-5 flex gap-3 items-end"
        >
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome do barbeiro</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: João"
              className="bg-input border-border h-11"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground h-11 px-6"
            disabled={createMutation.isPending || !newName.trim()}
          >
            {createMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/10 text-foreground hover:bg-white/5 h-11"
            onClick={() => { setShowForm(false); setNewName(""); }}
          >
            Cancelar
          </Button>
        </motion.form>
      )}

      <div className="glass rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-10 text-center text-muted-foreground text-sm">Carregando...</div>
        ) : barbers.length === 0 ? (
          <div className="px-6 py-10 text-center text-muted-foreground text-sm">Nenhum barbeiro cadastrado.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {barbers.map((b) => (
              <motion.li
                key={b.id}
                layout
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${b.active ? "bg-accent/15" : "bg-white/5"}`}>
                  <Users className={`w-4 h-4 ${b.active ? "text-accent" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  {editId === b.id ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-input border-border h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleRename(b.id); if (e.key === "Escape") setEditId(null); }}
                      />
                      <Button size="sm" className="h-8 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 text-xs" onClick={() => handleRename(b.id)}>
                        OK
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditId(null)}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${b.active ? "text-white" : "text-muted-foreground line-through"}`}>{b.name}</span>
                      {!b.active && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/20">
                          INATIVO
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10"
                    onClick={() => { setEditId(b.id); setEditName(b.name); }}
                    title="Renomear"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 ${b.active ? "text-yellow-500 hover:bg-yellow-500/10" : "text-green-500 hover:bg-green-500/10"}`}
                    onClick={() => handleToggleActive(b)}
                    title={b.active ? "Desativar" : "Ativar"}
                    disabled={updateMutation.isPending}
                  >
                    {b.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
