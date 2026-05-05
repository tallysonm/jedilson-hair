import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Calendar, List, PlusCircle, LogOut,
  TrendingUp, DollarSign, BarChart2, Trash2, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useListAppointments, getListAppointmentsQueryKey,
  useGetRevenueChart, getGetRevenueChartQueryKey,
  useGetServicesChart, getGetServicesChartQueryKey,
  useDeleteAppointment,
  useUpdateAppointment,
  useListServices,
  useCreateAppointment,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

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
    { id: "agenda", icon: Calendar, label: "Agenda" },
    { id: "appointments", icon: List, label: "Agendamentos" },
    { id: "new", icon: PlusCircle, label: "Novo Agendamento" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border p-4 flex flex-col md:min-h-screen">
        <div className="mb-8 px-2">
          <p className="text-gold tracking-[0.25em] text-[11px] font-bold mb-1">JEDILSON HAIR</p>
          <h2 className="text-xl font-bold text-foreground">Painel Admin</h2>
        </div>

        <nav className="flex md:flex-col flex-row gap-2 flex-1 overflow-x-auto md:overflow-x-visible">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              data-testid={`nav-${item.id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all text-sm font-medium whitespace-nowrap ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(193,18,31,0.2)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          data-testid="button-logout"
          className="mt-4 md:mt-auto flex items-center gap-3 px-4 py-3 rounded-[12px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden md:inline">Sair</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "agenda" && <AgendaTab />}
        {activeTab === "appointments" && <AppointmentsTab />}
        {activeTab === "new" && <NewAppointmentTab onComplete={() => setActiveTab("appointments")} />}
      </main>
    </div>
  );
}

function OverviewTab() {
  const { data: summary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const { data: revenueData } = useGetRevenueChart({
    query: { queryKey: getGetRevenueChartQueryKey() },
  });
  const { data: servicesData } = useGetServicesChart({
    query: { queryKey: getGetServicesChartQueryKey() },
  });

  const ticketMedio =
    summary?.completedToday && summary.completedToday > 0
      ? (summary.todayRevenue ?? 0) / summary.completedToday
      : 0;

  const cards = [
    { title: "Faturamento Hoje", value: `R$ ${(summary?.todayRevenue ?? 0).toFixed(2)}`, icon: TrendingUp },
    { title: "Faturamento do Mês", value: `R$ ${(summary?.monthRevenue ?? 0).toFixed(2)}`, icon: DollarSign },
    { title: "Agendamentos Hoje", value: String(summary?.todayAppointments ?? 0), icon: Calendar },
    { title: "Ticket Médio", value: `R$ ${ticketMedio.toFixed(2)}`, icon: BarChart2 },
  ];

  const last14 = revenueData?.slice(-14) ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-muted-foreground text-sm font-medium">{card.title}</h3>
              <card.icon className="w-5 h-5 text-gold flex-shrink-0" />
            </div>
            <p className="text-3xl font-bold text-foreground" data-testid={`kpi-${i}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">Faturamento (14 dias)</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last14}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C1121F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C1121F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#9CA3AF" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C1121F" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">Serviços Populares</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicesData ?? []} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="serviceName"
                  type="category"
                  stroke="#6B7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tickFormatter={(v: string) => v.slice(0, 14) + (v.length > 14 ? "…" : "")}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="count" fill="#C1121F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgendaTab() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const qc = useQueryClient();
  const { data: appointments = [] } = useListAppointments(
    { date },
    { query: { queryKey: getListAppointmentsQueryKey({ date }) } }
  );

  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();

  const handleComplete = (id: number) => {
    updateMutation.mutate(
      { id, data: { status: "completed" } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({ date }) }) }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Excluir agendamento?")) {
      deleteMutation.mutate(
        { id },
        { onSuccess: () => qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({ date }) }) }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Agenda do Dia</h2>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-auto bg-card border-border"
          data-testid="input-agenda-date"
        />
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground glass-card">
            Nenhum agendamento para esta data.
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="glass-card p-5 flex items-center justify-between border-l-4"
              style={{
                borderLeftColor:
                  apt.status === "completed" ? "#22c55e" : apt.status === "cancelled" ? "#6b7280" : "#C1121F",
              }}
              data-testid={`agenda-row-${apt.id}`}
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-foreground text-lg">{apt.time}</span>
                  <span className="text-foreground font-medium">{apt.clientName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{apt.serviceName}</span>
                  <span className="text-gold font-medium">R$ {Number(apt.servicePrice).toFixed(2)}</span>
                </div>
              </div>

              {apt.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleComplete(apt.id)}
                    className="text-green-500 hover:bg-green-500/10 hover:text-green-400"
                    data-testid={`btn-complete-${apt.id}`}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(apt.id)}
                    className="text-destructive hover:bg-destructive/10"
                    data-testid={`btn-delete-${apt.id}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
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

  const filterBtns: { label: string; value: "day" | "week" | "month" | undefined }[] = [
    { label: "Todos", value: undefined },
    { label: "Hoje", value: "day" },
    { label: "Semana", value: "week" },
    { label: "Mês", value: "month" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Agendamentos</h2>
        <div className="flex gap-2">
          {filterBtns.map((b) => (
            <button
              key={String(b.value)}
              onClick={() => setPeriod(b.value)}
              data-testid={`filter-${b.value ?? "all"}`}
              className={`px-4 py-2 rounded-[8px] text-sm font-medium transition-all ${
                period === b.value
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">Serviço</th>
                <th className="p-4 font-medium">Data/Hora</th>
                <th className="p-4 font-medium">Valor</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="border-b border-border/50 hover:bg-white/5 transition-colors"
                    data-testid={`appointment-row-${apt.id}`}
                  >
                    <td className="p-4 font-medium text-foreground">{apt.clientName}</td>
                    <td className="p-4 text-muted-foreground text-sm">{apt.serviceName}</td>
                    <td className="p-4 text-foreground text-sm">{apt.date} às {apt.time}</td>
                    <td className="p-4 text-gold font-medium">R$ {Number(apt.servicePrice).toFixed(2)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          apt.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : apt.status === "cancelled"
                            ? "bg-gray-500/20 text-gray-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {apt.status === "completed" ? "Concluído" : apt.status === "cancelled" ? "Cancelado" : "Pendente"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {apt.status === "pending" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleComplete(apt.id)}
                            className="text-green-500 hover:bg-green-500/10"
                            data-testid={`btn-complete-${apt.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(apt.id)}
                          className="text-destructive hover:bg-destructive/10"
                          data-testid={`btn-delete-${apt.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
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

  const [form, setForm] = useState({
    serviceId: "", date: "", time: "", clientName: "", clientPhone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceId || !form.date || !form.time || !form.clientName || !form.clientPhone) return;
    createMutation.mutate(
      {
        data: {
          serviceId: form.serviceId,
          date: form.date,
          time: form.time,
          clientName: form.clientName,
          clientPhone: form.clientPhone,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Agendamento criado com sucesso." });
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
          onComplete();
        },
        onError: () => {
          toast({ title: "Erro", description: "Não foi possível criar o agendamento.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Novo Agendamento</h2>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Serviço</label>
          <Select value={form.serviceId} onValueChange={(v) => setForm({ ...form, serviceId: v })}>
            <SelectTrigger className="bg-input border-border" data-testid="select-service">
              <SelectValue placeholder="Selecione um serviço" />
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
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="bg-input border-border"
              data-testid="input-new-date"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Horário (ex: 14:00)</label>
            <Input
              type="time"
              required
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="bg-input border-border"
              data-testid="input-new-time"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nome do Cliente</label>
          <Input
            required
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            className="bg-input border-border"
            placeholder="Nome completo"
            data-testid="input-new-client-name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Telefone</label>
          <Input
            required
            value={form.clientPhone}
            onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
            className="bg-input border-border"
            placeholder="(11) 99999-9999"
            data-testid="input-new-client-phone"
          />
        </div>

        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-[12px] h-12 font-medium"
          data-testid="button-new-appointment-submit"
        >
          {createMutation.isPending ? "Salvando..." : "Agendar"}
        </Button>
      </form>
    </div>
  );
}
