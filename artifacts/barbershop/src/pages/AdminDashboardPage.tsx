import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  CalendarDays,
  List,
  PlusCircle,
  LogOut,
  Trash2,
  CheckCircle2,
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
  useListServices,
  useCreateAppointment,
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

function OverviewTab() {
  const { data: summary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: revenueData } = useGetRevenueChart({ query: { queryKey: getGetRevenueChartQueryKey() } });
  const { data: servicesData } = useGetServicesChart({ query: { queryKey: getGetServicesChartQueryKey() } });

  const cards = [
    { title: "Faturamento Hoje", value: `R$ ${(summary?.todayRevenue || 0).toFixed(2)}` },
    { title: "Faturamento do Mês", value: `R$ ${(summary?.monthRevenue || 0).toFixed(2)}` },
    { title: "Agendamentos Hoje", value: String(summary?.todayAppointments || 0) },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-white tracking-tight">Visão Geral</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-muted-foreground text-sm font-medium mb-2">{card.title}</h3>
            <p className="text-3xl font-bold text-white">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6">Faturamento (14 dias)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData?.slice(-14) || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <RechartsTooltip contentStyle={{ backgroundColor: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="revenue" stroke="#E63946" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6">Serviços Mais Vendidos</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicesData || []} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="serviceName" type="category" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} width={90} />
                <RechartsTooltip contentStyle={{ backgroundColor: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" fill="#E63946" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CalendarTab() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const qc = useQueryClient();
  const { data: appointments = [] } = useListAppointments({}, { query: { queryKey: getListAppointmentsQueryKey({}) } });

  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();
  const { toast } = useToast();

  const events = appointments.map((apt) => ({
    id: String(apt.id),
    title: `${apt.clientName} - ${apt.serviceName}`,
    start: `${apt.date}T${apt.time}`,
    color: apt.status === 'completed' ? '#22c55e' : apt.status === 'cancelled' ? '#6b7280' : '#E63946',
    extendedProps: apt
  }));

  const handleComplete = () => {
    if (!selectedEvent) return;
    updateMutation.mutate(
      { id: selectedEvent.id, data: { status: "completed" } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
          toast({ title: "Sucesso", description: "Agendamento concluído." });
          setSelectedEvent(null);
        }
      }
    );
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    deleteMutation.mutate(
      { id: selectedEvent.id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
          toast({ title: "Sucesso", description: "Agendamento excluído." });
          setSelectedEvent(null);
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[80vh]">
      <h2 className="text-2xl font-bold text-white tracking-tight">Calendário</h2>
      <div className="glass rounded-xl p-6 h-full">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridWeek,timeGridDay" }}
          locale={ptBrLocale}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          events={events}
          eventClick={(info) => setSelectedEvent(info.event.extendedProps)}
          height="100%"
        />
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground text-sm">Cliente</span>
                <span className="text-white font-medium">{selectedEvent.clientName}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground text-sm">Serviço</span>
                <span className="text-white font-medium text-right max-w-[200px]">{selectedEvent.serviceName}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground text-sm">Data/Hora</span>
                <span className="text-white font-medium">{selectedEvent.date.split('-').reverse().join('/')} às {selectedEvent.time}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground text-sm">Telefone</span>
                <span className="text-white font-medium">{selectedEvent.clientPhone}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground text-sm">Valor</span>
                <span className="text-gold font-semibold">R$ {Number(selectedEvent.servicePrice).toFixed(2)}</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-end gap-2 sm:justify-end">
            <Button variant="outline" className="border-border text-foreground hover:bg-white/5" onClick={() => setSelectedEvent(null)}>
              Fechar
            </Button>
            {selectedEvent?.status === "pending" && (
              <Button variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20" onClick={handleComplete}>
                Concluir
              </Button>
            )}
            <Button variant="outline" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AppointmentsTab() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | undefined>(undefined);
  const qc = useQueryClient();

  const params = period ? { period } : {};
  const { data: appointments = [] } = useListAppointments(params, {
    query: { queryKey: getListAppointmentsQueryKey(params) },
  });

  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();

  const handleComplete = (id: number) => {
    updateMutation.mutate(
      { id, data: { status: "completed" } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) }) }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Excluir agendamento?")) {
      deleteMutation.mutate(
        { id },
        { onSuccess: () => qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) }) }
      );
    }
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
              data-testid={`filter-${f.value || 'all'}`}
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
                      <div className="font-medium text-white">{apt.clientName}</div>
                      <div className="text-xs text-muted-foreground">{apt.clientPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{apt.serviceName}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{apt.date.split('-').reverse().join('/')}</div>
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
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10" onClick={() => handleComplete(apt.id)} data-testid={`btn-complete-${apt.id}`}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(apt.id)} data-testid={`btn-delete-${apt.id}`}>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !serviceId || !date || !time) return;

    createMutation.mutate(
      {
        data: {
          serviceId,
          date,
          time,
          clientName: name,
          clientPhone: phone,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Agendamento criado." });
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
          onComplete();
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao criar agendamento.", variant: "destructive" });
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
              onChange={(e) => setDate(e.target.value)}
              className="bg-input border-border h-12"
              required
              data-testid="input-new-date"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Horário</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-input border-border h-12"
              required
              data-testid="input-new-time"
            />
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
