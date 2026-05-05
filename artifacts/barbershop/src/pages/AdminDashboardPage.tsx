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
  const qc = useQueryClient();
  const { data: appointments = [] } = useListAppointments({}, { query: { queryKey: getListAppointmentsQueryKey({}) } });

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
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
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
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
          toast({ title: "Sucesso", description: "Agendamento excluído." });
          setSelectedEvent(null);
        },
      }
    );
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto" style={{ height: "calc(100vh - 120px)" }}>
      <h2 className="text-2xl font-bold text-white tracking-tight">Calendário</h2>
      <div className="glass rounded-2xl p-5 overflow-hidden" style={{ height: "calc(100% - 52px)" }}>
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; groupId: string | null; isRecurring: boolean } | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const params = period ? { period } : {};
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Agendamentos</h2>
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
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Serviço</th>
                <th className="px-6 py-4 font-medium">Data/Hora</th>
                <th className="px-6 py-4 font-medium">Valor</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">
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

function NewAppointmentTab({ onComplete }: { onComplete: () => void }) {
  const { data: services = [] } = useListServices();
  const createMutation = useCreateAppointment();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlots(
    { date, serviceId },
    {
      query: {
        enabled: !!date && !!serviceId,
        queryKey: getGetAvailableSlotsQueryKey({ date, serviceId }),
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !serviceId || !date || !time) return;

    createMutation.mutate(
      { data: { serviceId, date, time, clientName: name, clientPhone: phone } },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Agendamento criado." });
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
          onComplete();
        },
        onError: () => {
          toast({ title: "Erro", description: "Horário indisponível ou conflito.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Novo Agendamento</h2>
      
      <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Cliente</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            className="bg-input border-border h-12"
            required
            data-testid="input-new-client-name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Telefone</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="bg-input border-border h-12"
            required
            data-testid="input-new-client-phone"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Serviço</label>
          <Select value={serviceId} onValueChange={setServiceId} required>
            <SelectTrigger className="bg-input border-border h-12" data-testid="select-new-service">
              <SelectValue placeholder="Selecione o serviço" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — {s.priceLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Data</label>
            <Input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              max={(() => {
                const now = new Date();
                return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()).toISOString().split("T")[0];
              })()}
              onChange={(e) => { setDate(e.target.value); setTime(""); }}
              className="bg-input border-border h-12"
              required
              data-testid="input-new-date"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Horário</label>
            <Select
              value={time}
              onValueChange={setTime}
              disabled={!date || !serviceId || slotsLoading}
            >
              <SelectTrigger className="bg-input border-border h-12" data-testid="input-new-time">
                <SelectValue
                  placeholder={
                    !date || !serviceId
                      ? "Selecione data e serviço"
                      : slotsLoading
                        ? "Carregando..."
                        : "Selecione um horário"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-60 overflow-y-auto">
                {(slotsData?.slots ?? []).map((slot: string) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
                {!slotsLoading && date && serviceId && (slotsData?.slots ?? []).length === 0 && (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    Sem horários disponíveis
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 font-semibold mt-2"
          data-testid="button-new-submit"
        >
          {createMutation.isPending ? "Salvando..." : "Criar Agendamento"}
        </Button>
      </form>
    </div>
  );
}
