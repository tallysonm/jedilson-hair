import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, CalendarDays, List, PlusCircle, LogOut,
  Trash2, TrendingUp, CalendarCheck, DollarSign,
  Users, Pencil, UserCheck, UserX, Check, X as XIcon,
  MessageCircle, Instagram, Phone, Cake, FileText, Camera,
  ChevronDown, ChevronUp, Bell, Scissors, Ban, Download,
  Tag, Clock, AlertCircle, CalendarOff, RefreshCw, CheckCircle2,
  Settings,
} from "lucide-react";
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetRevenueChart,     getGetRevenueChartQueryKey,
  useGetServicesChart,    getGetServicesChartQueryKey,
  useListAppointments,    getListAppointmentsQueryKey,
  useUpdateAppointment,   useDeleteAppointment,
  useDeleteRecurringGroup, useListServices, getListServicesQueryKey,
  useCreateService, useUpdateService, useDeleteService,
  useCreateAppointment,
  useGetAvailableSlots,   getGetAvailableSlotsQueryKey,
  useListBarbers,         getListBarbersQueryKey,
  useCreateBarber,        useUpdateBarber,               
  useCreateRecurringAppointments,
  useListBlockedSlots,    getListBlockedSlotsQueryKey,
  useCreateBlockedSlot,   useDeleteBlockedSlot,
  useGetDashboardReminders, getGetDashboardRemindersQueryKey,
  useGetSettings, getGetSettingsQueryKey, useUpdateSettings,
} from "@workspace/api-client-react";
import type { Barber, Service } from "@workspace/api-client-react";
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
import { JedilsonLogo } from "@/components/Logo";
import { uploadBarberPhoto } from "@/lib/supabase";

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
    { id: "services",     icon: Scissors,        label: "Serviços" },
    { id: "blocked",      icon: CalendarOff,     label: "Horários Bloqueados" },
    { id: "reminders",    icon: Bell,            label: "Lembretes" },
    { id: "settings",    icon: Settings,        label: "Configurações" },
  ];

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-[#060606] border-r border-white/5 flex flex-col md:min-h-screen shrink-0">
        <div className="px-6 py-5 border-b border-white/5">
          <JedilsonLogo size="sm" />
          <p className="text-[10px] text-muted-foreground mt-2 ml-12">Painel Administrativo</p>
        </div>
        <nav className="flex md:flex-col flex-row gap-1 p-3 flex-1 overflow-x-auto md:overflow-x-visible">
          {NAV.map((item) => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${active ? "bg-white/6 text-white" : "text-muted-foreground hover:text-white hover:bg-white/4"}`}
                data-testid={`nav-${item.id}`}
              >
                {active && <motion.div layoutId="nav-ind" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full" transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
                <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-accent" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-red-500/8 hover:text-red-400 transition-all text-sm font-medium"
            data-testid="button-logout">
            <LogOut className="w-4 h-4" /><span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {activeTab === "overview"     && <OverviewTab />}
            {activeTab === "calendar"     && <CalendarTab />}
            {activeTab === "appointments" && <AppointmentsTab />}
            {activeTab === "new"          && <NewAppointmentTab onComplete={() => setActiveTab("appointments")} />}
            {activeTab === "barbers"      && <BarbeirosTab />}
            {activeTab === "services"     && <ServicosTab />}
            {activeTab === "blocked"      && <HorariosTab />}
            {activeTab === "reminders"    && <LembretesTab />}
            {activeTab === "settings"     && <ConfiguracoesTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ══ helpers ══ */
function AnimatedNumber({ target, prefix = "" }: { target: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 1000;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);
  return <>{prefix}{display.toFixed(prefix ? 2 : 0)}</>;
}

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
  const BAR_COLORS = ["#C1121F","#e35d66","#ea8c92","#f0b0b4","#f5cdd0"];
  const cards = [
    { title: "Faturamento Hoje", value: summary?.todayRevenue || 0, prefix: "R$ ", icon: DollarSign, gradient: "from-emerald-500/10 to-transparent", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400", border: "border-emerald-500/10" },
    { title: "Faturamento do Mês", value: summary?.monthRevenue || 0, prefix: "R$ ", icon: TrendingUp, gradient: "from-blue-500/10 to-transparent", iconBg: "bg-blue-500/10", iconColor: "text-blue-400", border: "border-blue-500/10" },
    { title: "Agendamentos Hoje", value: summary?.todayAppointments || 0, prefix: "", icon: CalendarCheck, gradient: "from-rose-500/10 to-transparent", iconBg: "bg-rose-500/10", iconColor: "text-rose-400", border: "border-rose-500/10" },
  ];
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <SectionHeader title="Visão Geral" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`relative overflow-hidden rounded-2xl p-6 border bg-gradient-to-br ${card.gradient} ${card.border} glass-card`}>
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="lg:col-span-2 glass-card rounded-2xl p-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Faturamento</p>
          <p className="font-display text-lg font-bold text-white mb-5">Últimos 14 dias</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData?.slice(-14) || []}>
                <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C1121F" stopOpacity={0.4}/><stop offset="95%" stopColor="#C1121F" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <RechartsTooltip contentStyle={{ backgroundColor:"#111", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", fontSize:"12px" }} labelStyle={{ color:"#eee" }} />
                <Area type="monotone" dataKey="revenue" stroke="#C1121F" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" dot={false} activeDot={{ r:4, fill:"#C1121F" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} className="glass-card rounded-2xl p-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Serviços</p>
          <p className="font-display text-lg font-bold text-white mb-5">Mais vendidos</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicesData || []} layout="vertical" margin={{ left:0, right:8 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="serviceName" type="category" stroke="#555" fontSize={10} tickLine={false} axisLine={false} width={90} tick={{ fill:"#777" }} />
                <RechartsTooltip contentStyle={{ backgroundColor:"#111", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", fontSize:"12px" }} cursor={{ fill:"rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[0,6,6,0]}>{(servicesData||[]).map((_:unknown,i:number)=><Cell key={i} fill={BAR_COLORS[i%BAR_COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ══ Calendar gradients ══ */
const SERVICE_GRADIENTS: Record<string,string> = {
  "corte-simples":"linear-gradient(135deg,#1D3557,#2a5298)","corte-sobrancelha":"linear-gradient(135deg,#1a2f50,#2563eb)",
  "corte-barba":"linear-gradient(135deg,#7c1d26,#E63946)","corte-penteado-barba-sobrancelha":"linear-gradient(135deg,#6d1e4c,#c2185b)",
  "corte-progressiva":"linear-gradient(135deg,#4a1d96,#7c3aed)","dois-cortes":"linear-gradient(135deg,#1d4556,#0ea5e9)",
  "pezinho":"linear-gradient(135deg,#14532d,#16a34a)","penteado":"linear-gradient(135deg,#1c3557,#0284c7)",
  "corte-luzes":"linear-gradient(135deg,#713f12,#d97706)","corte-luzes-branca":"linear-gradient(135deg,#7f1d1d,#f59e0b)",
  "sobrancelha":"linear-gradient(135deg,#14532d,#22c55e)","barba":"linear-gradient(135deg,#7c1d26,#f43f5e)",
  "corte-relaxamento":"linear-gradient(135deg,#312e81,#6366f1)","corte-penteado":"linear-gradient(135deg,#1d3557,#3b82f6)",
  "corte-dimil-colorido":"linear-gradient(135deg,#701a75,#a855f7)",
};
const COMPLETED_GRADIENT = "linear-gradient(135deg,#14532d,#22c55e)";
const CANCELLED_GRADIENT  = "linear-gradient(135deg,#1c1c1c,#374151)";

/* ══════════════════════════════════════════════
   CALENDAR TAB
══════════════════════════════════════════════ */
function CalendarTab() {
  const [selectedEvent, setSelectedEvent] = useState<Record<string,unknown>|null>(null);
  const [barberId, setBarberId] = useState("all");
  const qc = useQueryClient();
  const { data: barbers = [] } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const params = barberId !== "all" ? { barberId } : {};
  const { data: appointments = [] } = useListAppointments(params, { query: { queryKey: getListAppointmentsQueryKey(params) } });
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();
  const { toast } = useToast();
  const events = appointments.map((apt) => ({ id: String(apt.id), title: apt.clientName, start: `${apt.date}T${apt.time}`, extendedProps: apt, backgroundColor: "transparent", borderColor: "transparent" }));
  const renderEventContent = (info: { event: { extendedProps: Record<string,unknown>; startStr: string } }) => {
    const apt = info.event.extendedProps;
    const gradient = apt.status === "completed" ? COMPLETED_GRADIENT : apt.status === "cancelled" ? CANCELLED_GRADIENT : (SERVICE_GRADIENTS[apt.serviceId as string] ?? "linear-gradient(135deg,#1D3557,#C1121F)");
    return (<div className="cal-event-card" style={{ background: gradient, boxShadow:"0 2px 8px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)" }}><div className="cal-event-name">{apt.clientName as string}</div><div className="cal-event-service">{apt.serviceName as string}</div><div className="cal-event-time">{info.event.startStr.slice(11,16)}</div></div>);
  };
  const handleComplete = () => { if (!selectedEvent) return; updateMutation.mutate({ id: selectedEvent.id as number, data: { status: "completed" } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) }); toast({ title: "Concluído" }); setSelectedEvent(null); } }); };
  const handleDelete = () => { if (!selectedEvent) return; deleteMutation.mutate({ id: selectedEvent.id as number }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) }); toast({ title: "Excluído" }); setSelectedEvent(null); } }); };
  return (
    <div className="space-y-5 max-w-6xl mx-auto" style={{ height: "calc(100vh - 80px)" }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader title="Calendário" />
        <Select value={barberId} onValueChange={setBarberId}>
          <SelectTrigger className="bg-white/5 border-white/8 h-9 w-48 text-sm rounded-xl"><SelectValue placeholder="Todos os barbeiros" /></SelectTrigger>
          <SelectContent className="bg-[#111] border-white/8">
            <SelectItem value="all">Todos os barbeiros</SelectItem>
            {barbers.filter((b)=>b.active).map((b)=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="glass-card rounded-2xl p-5 overflow-hidden" style={{ height: "calc(100% - 72px)" }}>
        <FullCalendar plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]} initialView="timeGridWeek"
          headerToolbar={{ left:"prev,next today", center:"title", right:"timeGridWeek,timeGridDay" }}
          locale={ptBrLocale} slotMinTime="06:30:00" slotMaxTime="21:00:00"
          events={events} eventContent={renderEventContent}
          eventClick={(info)=>setSelectedEvent(info.event.extendedProps as Record<string,unknown>)}
          height="100%" eventMinHeight={36} nowIndicator allDaySlot={false} />
      </div>
      <AnimatePresence>
        {selectedEvent && (
          <Dialog open onOpenChange={(o)=>!o&&setSelectedEvent(null)}>
            <DialogContent className="bg-[#0f0f0f] border border-white/8 sm:max-w-md rounded-3xl shadow-2xl">
              <DialogHeader><DialogTitle className="font-display text-white text-lg font-bold">Detalhes</DialogTitle></DialogHeader>
              <div className="space-y-1 py-2">
                {[{label:"Cliente",value:selectedEvent.clientName as string},{label:"Telefone",value:selectedEvent.clientPhone as string},{label:"Serviço",value:selectedEvent.serviceName as string},{label:"Data / Hora",value:`${String(selectedEvent.date).split("-").reverse().join("/")} às ${selectedEvent.time as string}`}].map((row)=>(
                  <div key={row.label} className="flex justify-between items-center py-3 border-b border-white/5"><span className="text-muted-foreground text-sm">{row.label}</span><span className="text-white font-semibold text-sm text-right max-w-[200px]">{row.value}</span></div>
                ))}
                <div className="flex justify-between items-center py-3"><span className="text-muted-foreground text-sm">Valor</span><span className="text-gold font-bold text-base">R$ {Number(selectedEvent.servicePrice).toFixed(2)}</span></div>
              </div>
              <DialogFooter className="flex gap-2 sm:justify-end pt-1">
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 rounded-xl" onClick={()=>setSelectedEvent(null)}>Fechar</Button>
                {selectedEvent.status==="pending"&&<Button size="sm" className="bg-green-500/12 text-green-400 hover:bg-green-500/20 border border-green-500/20 rounded-xl" onClick={handleComplete}>Concluir</Button>}
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
  const [barberId, setBarberId] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{id:number;groupId:string|null;isRecurring:boolean}|null>(null);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: barbers = [] } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const params = { ...(period?{period}:{}), ...(barberId!=="all"?{barberId}:{}) };
  const { data: appointments = [] } = useListAppointments(params, { query: { queryKey: getListAppointmentsQueryKey(params) } });
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();
  const groupDeleteMutation = useDeleteRecurringGroup();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey(params) });
  const handleComplete = (id:number) => updateMutation.mutate({id,data:{status:"completed"}},{onSuccess:invalidate});
  const handleDeleteSingle = () => { if (!deleteTarget) return; deleteMutation.mutate({id:deleteTarget.id},{onSuccess:()=>{invalidate();toast({title:"Excluído"});setDeleteTarget(null);}}); };
  const handleDeleteGroup = () => { if (!deleteTarget?.groupId) return; groupDeleteMutation.mutate({groupId:deleteTarget.groupId},{onSuccess:()=>{invalidate();toast({title:"Grupo excluído"});setDeleteTarget(null);}}); };
  const handleSavePayment = () => {
    if (!editingAppointment) return;
    updateMutation.mutate({ id: editingAppointment.id, data: { paymentMethod: editingAppointment.paymentMethod } }, {
      onSuccess: () => { invalidate(); setEditingAppointment(null); },
    });
  };
  const FILTERS: {label:string;value:typeof period}[] = [{label:"Todos",value:undefined},{label:"Hoje",value:"day"},{label:"Semana",value:"week"},{label:"Mês",value:"month"}];
  const ss = (s:string) => s==="completed"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":s==="cancelled"?"bg-gray-500/10 text-gray-400 border-gray-500/20":"bg-amber-500/10 text-amber-400 border-amber-500/20";
  const sl = (s:string) => s==="completed"?"Concluído":s==="cancelled"?"Cancelado":"Pendente";
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <SectionHeader title="Agendamentos" />
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-white/4 rounded-xl p-1 border border-white/7 gap-1">
            {FILTERS.map((f)=><button key={f.label} onClick={()=>setPeriod(f.value)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${period===f.value?"bg-accent text-white shadow":"text-muted-foreground hover:text-white"}`} data-testid={`filter-${f.value||"all"}`}>{f.label}</button>)}
          </div>
          <Select value={barberId} onValueChange={setBarberId}>
            <SelectTrigger className="bg-white/5 border-white/8 h-8 w-44 text-xs rounded-xl"><SelectValue placeholder="Todos os barbeiros" /></SelectTrigger>
            <SelectContent className="bg-[#111] border-white/8">
              <SelectItem value="all">Todos os barbeiros</SelectItem>
              {barbers.filter((b)=>b.active).map((b)=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <a
            href={`/api/appointments/export?period=${period ?? "all"}${barberId !== "all" ? `&barberId=${barberId}` : ""}`}
            download
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gold/8 hover:bg-gold/15 text-gold border border-gold/20 text-xs font-semibold transition-colors"
            title="Exportar CSV"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </a>
        </div>
      </div>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-white/6">{["Cliente","Serviço","Data / Hora","Barbeiro","Valor","Pagamento","Status",""].map((h)=><th key={h} className="px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>
              {appointments.length===0?<tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground text-sm">Nenhum agendamento encontrado.</td></tr>:
              appointments.map((apt)=>(
                <tr key={apt.id} className="border-b border-white/4 hover:bg-white/3 transition-colors group">
                  <td className="px-5 py-4"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">{apt.clientName.split(" ").map((w:string)=>w[0]).slice(0,2).join("")}</div><div><div className="flex items-center gap-1.5"><span className="font-semibold text-white text-sm">{apt.clientName}</span>{apt.isRecurring&&<span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/12 text-blue-400 border border-blue-500/20 tracking-wide">RECORRENTE</span>}</div><div className="text-xs text-muted-foreground">{apt.clientPhone}</div></div></div></td>
                  <td className="px-5 py-4 text-sm text-muted-foreground max-w-[160px] truncate">{apt.serviceName}</td>
                  <td className="px-5 py-4"><div className="text-sm font-semibold text-white">{apt.date.split("-").reverse().join("/")}</div><div className="text-xs text-muted-foreground">{apt.time}</div></td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{apt.barberId?barbers.find((b)=>String(b.id)===apt.barberId)?.name??`#${apt.barberId}`:<span className="opacity-30">—</span>}</td>
                  <td className="px-5 py-4 text-sm text-gold font-bold">R$ {Number(apt.servicePrice).toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm"><span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${apt.paymentMethod === "pix_cartao" ? "bg-blue-500/15 text-blue-300" : "bg-emerald-500/15 text-emerald-300"}`}>{apt.paymentMethod === "pix_cartao" ? "Pix/Cartão" : "Dinheiro"}</span></td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${ss(apt.status)}`}>{sl(apt.status)}</span></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"> 
                    {apt.status==="pending"&&<button className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors" onClick={()=>handleComplete(apt.id)} data-testid={`btn-complete-${apt.id}`} title="Concluir"><Check className="w-3.5 h-3.5" /></button>}
                    <button className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-colors" onClick={()=>setEditingAppointment(apt)} title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                    <button className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors" onClick={()=>setDeleteTarget({id:apt.id,groupId:apt.recurrenceGroupId??null,isRecurring:!!apt.isRecurring})} data-testid={`btn-delete-${apt.id}`} title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {deleteTarget&&(
          <Dialog open onOpenChange={(o)=>!o&&setDeleteTarget(null)}>
            <DialogContent className="bg-[#0f0f0f] border border-white/8 sm:max-w-sm rounded-3xl">
              <DialogHeader><DialogTitle className="font-display text-white font-bold">Excluir agendamento</DialogTitle></DialogHeader>
              <p className="text-muted-foreground text-sm py-2">{deleteTarget.isRecurring&&deleteTarget.groupId?"Este agendamento faz parte de uma série recorrente. Deseja excluir somente este ou toda a série?":"Tem certeza que deseja excluir este agendamento?"}</p>
              <DialogFooter className="flex gap-2 flex-wrap sm:justify-end pt-1">
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 rounded-xl" onClick={()=>setDeleteTarget(null)}>Cancelar</Button>
                <Button size="sm" className="bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 rounded-xl" onClick={handleDeleteSingle}>{deleteTarget.isRecurring?"Só este":"Excluir"}</Button>
                {deleteTarget.isRecurring&&deleteTarget.groupId&&<Button size="sm" className="bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-600/25 rounded-xl" onClick={handleDeleteGroup}>Toda a série</Button>}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {editingAppointment && (
          <Dialog open onOpenChange={(o) => !o && setEditingAppointment(null)}>
            <DialogContent className="bg-[#0f0f0f] border border-white/8 sm:max-w-sm rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-display text-white font-bold">Editar agendamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Forma de pagamento</label>
                  <Select value={editingAppointment.paymentMethod ?? "dinheiro"} onValueChange={(value) => setEditingAppointment((prev) => prev ? { ...prev, paymentMethod: value } : prev)}>
                    <SelectTrigger className="bg-white/5 border-white/8 h-10 text-sm rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/8">
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix_cartao">Pix/Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex gap-2 flex-wrap sm:justify-end pt-1">
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 rounded-xl" onClick={()=>setEditingAppointment(null)}>Cancelar</Button>
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white rounded-xl font-bold px-6" onClick={handleSavePayment} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Salvando..." : "Salvar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════
   NEW APPOINTMENT TAB
══════════════════════════════════════════════ */
const ADMIN_WEEKDAYS = [
  { value:"0",label:"Domingo",short:"Dom"},{value:"2",label:"Terça-feira",short:"Ter"},{value:"3",label:"Quarta-feira",short:"Qua"},
  {value:"4",label:"Quinta-feira",short:"Qui"},{value:"5",label:"Sexta-feira",short:"Sex"},{value:"6",label:"Sábado",short:"Sáb"},
];
function generate30minSlots(openHour:number,closeHour:number):string[]{const slots:string[]=[];let cur=openHour*60;while(cur+30<=closeHour*60){const h=Math.floor(cur/60).toString().padStart(2,"0");const m=(cur%60).toString().padStart(2,"0");slots.push(`${h}:${m}`);cur+=30;}return slots;}
const ADMIN_WEEKDAY_SLOTS:Record<string,string[]>={"0":generate30minSlots(7,14),"2":generate30minSlots(7,20),"3":generate30minSlots(7,20),"4":generate30minSlots(7,20),"5":generate30minSlots(7,20),"6":generate30minSlots(7,20)};
const ADMIN_PERIOD_OPTIONS=[{value:"this_month",label:"Este mês"},{value:"next_2_months",label:"Próximos 2 meses"}];
function getMaxDate(){const now=new Date();return new Date(now.getFullYear(),now.getMonth()+3,now.getDate()).toISOString().split("T")[0];}
type AdminRecurringResult={groupId:string;created:string[];skipped:number;time:string};
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
function NewAppointmentTab({onComplete}:{onComplete:()=>void}){
  const {data:services=[]}=useListServices();
  const {data:barbers=[]}=useListBarbers({query:{queryKey:getListBarbersQueryKey()}});
  const createMutation=useCreateAppointment();
  const createRecurringMutation=useCreateRecurringAppointments();
  const {toast}=useToast();
  const qc=useQueryClient();
  const [name,setName]=useState("");const [phone,setPhone]=useState("");const [serviceId,setServiceId]=useState("");const [barberId,setBarberId]=useState("all");const [date,setDate]=useState("");const [time,setTime]=useState("");const [isRecurring,setIsRecurring]=useState(false);const [weekday,setWeekday]=useState("4");const [period,setPeriod]=useState<"this_month"|"next_2_months">("this_month");const [paymentMethod,setPaymentMethod]=useState<"dinheiro"|"pix_cartao">("dinheiro");const [result,setResult]=useState<AdminRecurringResult|null>(null);
  const resolvedBarberId=barberId!=="all"?barberId:null;
  const slotParams={date,serviceId,...(resolvedBarberId?{barberId:resolvedBarberId}:{})};
  const {data:slotsData,isLoading:slotsLoading}=useGetAvailableSlots(slotParams,{query:{enabled:!isRecurring&&!!date&&!!serviceId,queryKey:getGetAvailableSlotsQueryKey(slotParams)}});
  const handleDateChange=(v:string)=>{if(v&&new Date(v).getUTCDay()===1){toast({title:"Aviso",description:"Segunda-feira fechado"});setDate("");return;}setDate(v);setTime("");};
  const handleSingle=()=>{if(!name||!phone||!serviceId||!date||!time)return;createMutation.mutate({data:{serviceId,date,time,clientName:name,clientPhone:phone,barberId:resolvedBarberId,paymentMethod}},{onSuccess:()=>{toast({title:"Sucesso",description:"Agendamento criado."});qc.invalidateQueries({queryKey:getListAppointmentsQueryKey({})});onComplete();},onError:()=>toast({title:"Erro",description:"Horário indisponível.",variant:"destructive"})});};
  const handleRecurring=()=>{if(!name||!phone||!serviceId||!time)return;createRecurringMutation.mutate({data:{clientName:name,clientPhone:phone,serviceId,time,weekday:parseInt(weekday,10),period,startDate:new Date().toISOString().split("T")[0],barberId:resolvedBarberId,paymentMethod}},{onSuccess:(res)=>{qc.invalidateQueries({queryKey:getListAppointmentsQueryKey({})});if(res.created.length===0){toast({title:"Sem disponibilidade",variant:"destructive"});return;}setResult({groupId:res.groupId,created:res.created.map((a)=>a.date),skipped:res.skipped.length,time});},onError:()=>toast({title:"Erro",variant:"destructive"})});};
  const resetForm=()=>{setName("");setPhone("");setServiceId("");setBarberId("all");setDate("");setTime("");setIsRecurring(false);setWeekday("4");setPeriod("this_month");setPaymentMethod("dinheiro");setResult(null);};
  const isPending=createMutation.isPending||createRecurringMutation.isPending;
  const canSingle=!isRecurring&&!!name&&!!phone&&!!serviceId&&!!date&&!!time;
  const canRecurring=isRecurring&&!!name&&!!phone&&!!serviceId&&!!time;
  if(result)return(<div className="max-w-md mx-auto"><div className="glass-card rounded-3xl p-8 text-center space-y-6"><div className="flex justify-center"><div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="w-10 h-10 text-emerald-400" /></div></div><div><p className="text-muted-foreground text-sm mb-1">Recorrência criada</p><h2 className="font-display text-2xl font-bold text-white">{result.created.length} agendamentos!</h2>{result.skipped>0&&<p className="text-muted-foreground text-xs mt-1">{result.skipped} ignorado{result.skipped!==1?"s":""} por conflito</p>}</div><div className="rounded-2xl border border-white/6 divide-y divide-white/5 max-h-52 overflow-y-auto text-left">{result.created.map((d)=><div key={d} className="flex justify-between items-center px-5 py-3"><span className="text-white text-sm font-semibold">{d.split("-").reverse().join("/")}</span><span className="text-gold text-sm">{result.time}</span></div>)}</div><div className="flex gap-3"><Button className="flex-1 bg-accent hover:bg-accent/90 text-white h-11 rounded-xl font-semibold" onClick={onComplete}>Ver Agendamentos</Button><Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5 h-11 rounded-xl" onClick={resetForm}><RefreshCw className="w-4 h-4 mr-2" />Novo</Button></div></div></div>);
  return(
    <div className="max-w-lg mx-auto"><SectionHeader title="Novo Agendamento" />
    <div className="glass-card rounded-3xl p-7 space-y-5">
      <div className="grid grid-cols-2 gap-4"><FormField label="Cliente"><Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nome completo" className="bg-white/5 border-white/8 h-11 rounded-xl text-white" data-testid="input-new-client-name"/></FormField><FormField label="Telefone"><Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="(11) 99999-9999" className="bg-white/5 border-white/8 h-11 rounded-xl text-white" data-testid="input-new-client-phone"/></FormField></div>
      <FormField label="Serviço"><Select value={serviceId} onValueChange={(v)=>{setServiceId(v);setTime("");}}><SelectTrigger className="bg-white/5 border-white/8 h-11 rounded-xl" data-testid="select-new-service"><SelectValue placeholder="Selecione o serviço"/></SelectTrigger><SelectContent className="bg-[#111] border-white/8">{services.map((s)=><SelectItem key={s.id} value={s.id}>{s.name} — {s.priceLabel}</SelectItem>)}</SelectContent></Select></FormField>
      <FormField label="Barbeiro"><Select value={barberId} onValueChange={setBarberId}><SelectTrigger className="bg-white/5 border-white/8 h-11 rounded-xl" data-testid="select-new-barber"><SelectValue placeholder="Qualquer barbeiro"/></SelectTrigger><SelectContent className="bg-[#111] border-white/8"><SelectItem value="all">Qualquer barbeiro</SelectItem>{barbers.filter((b)=>b.active).map((b)=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent></Select></FormField>
      <FormField label="Pagamento"><div className="flex gap-2">{[{value:"dinheiro",label:"Dinheiro"},{value:"pix_cartao",label:"Pix/Cartão"}].map((opt)=><button key={opt.value} type="button" onClick={()=>setPaymentMethod(opt.value as any)} className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-all ${paymentMethod===opt.value?"bg-accent/15 border-accent text-white":"bg-white/4 border-white/8 text-muted-foreground hover:bg-white/7"}`} data-testid={`admin-payment-${opt.value}`}>{opt.label}</button>)}</div></FormField>
      <FormField label="Agendamento recorrente?"><div className="flex gap-2">{[{value:false,label:"Não"},{value:true,label:"Sim — semanal fixo"}].map((opt)=><button key={String(opt.value)} type="button" onClick={()=>{setIsRecurring(opt.value);setDate("");setTime("");}} className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-all ${isRecurring===opt.value?"bg-accent/15 border-accent text-white":"bg-white/4 border-white/8 text-muted-foreground hover:bg-white/7"}`} data-testid={`admin-toggle-recurring-${opt.value}`}>{opt.label}</button>)}</div></FormField>
      <AnimatePresence mode="wait">
        {!isRecurring?(<motion.div key="single" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden"><div className="grid grid-cols-2 gap-4"><FormField label="Data"><Input type="date" value={date} min={new Date().toISOString().split("T")[0]} max={getMaxDate()} onChange={(e)=>handleDateChange(e.target.value)} className="bg-white/5 border-white/8 h-11 rounded-xl text-white" data-testid="input-new-date"/></FormField><FormField label="Horário"><Select value={time} onValueChange={setTime} disabled={!date||!serviceId||slotsLoading}><SelectTrigger className="bg-white/5 border-white/8 h-11 rounded-xl" data-testid="input-new-time"><SelectValue placeholder={!date||!serviceId?"Escolha data e serviço":slotsLoading?"Carregando...":"Selecione"}/></SelectTrigger><SelectContent className="bg-[#111] border-white/8 max-h-56 overflow-y-auto">{(slotsData?.slots??[]).map((slot:string)=><SelectItem key={slot} value={slot}>{slot}</SelectItem>)}{!slotsLoading&&date&&serviceId&&(slotsData?.slots??[]).length===0&&<div className="px-3 py-4 text-sm text-muted-foreground text-center">Sem horários</div>}</SelectContent></Select></FormField></div></motion.div>):
        (<motion.div key="recurring" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/8 border border-blue-500/15"><CalendarDays className="w-4 h-4 text-blue-400 mt-0.5 shrink-0"/><p className="text-xs text-blue-300/90 leading-relaxed">Agendamentos para todos os dias selecionados no período. Datas com conflito são ignoradas.</p></div>
          <FormField label="Dia da semana"><div className="flex gap-2 flex-wrap">{ADMIN_WEEKDAYS.map((d)=><button key={d.value} type="button" onClick={()=>{setWeekday(d.value);setTime("");}} className={`h-9 px-3 rounded-xl text-sm font-semibold border transition-all ${weekday===d.value?"bg-accent border-accent text-white":"bg-white/5 border-white/8 text-muted-foreground hover:text-white"}`} data-testid="admin-select-weekday">{d.short}</button>)}</div></FormField>
          <FormField label="Horário fixo"><Select value={time} onValueChange={setTime}><SelectTrigger className="bg-white/5 border-white/8 h-11 rounded-xl" data-testid="admin-select-recurring-time"><SelectValue placeholder="Selecione o horário"/></SelectTrigger><SelectContent className="bg-[#111] border-white/8 max-h-56 overflow-y-auto">{(ADMIN_WEEKDAY_SLOTS[weekday]??ADMIN_WEEKDAY_SLOTS["2"]).map((slot)=><SelectItem key={slot} value={slot}>{slot}</SelectItem>)}</SelectContent></Select></FormField>
          <FormField label="Período"><div className="flex gap-2">{ADMIN_PERIOD_OPTIONS.map((opt)=><button key={opt.value} type="button" onClick={()=>setPeriod(opt.value as typeof period)} className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-all ${period===opt.value?"bg-gold/15 border-gold text-gold":"bg-white/4 border-white/8 text-muted-foreground hover:bg-white/7"}`} data-testid={`admin-period-${opt.value}`}>{opt.label}</button>)}</div></FormField>
        </motion.div>)}
      </AnimatePresence>
      <Button type="button" onClick={isRecurring?handleRecurring:handleSingle} disabled={isPending||(!canSingle&&!canRecurring)} className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold glow-accent" data-testid="button-new-submit">
        {isPending?"Salvando...":isRecurring?"Criar Agendamentos Recorrentes":"Criar Agendamento"}
      </Button>
    </div></div>
  );
}

/* ══════════════════════════════════════════════
   BARBEIROS TAB — Full profile management
══════════════════════════════════════════════ */
const AVATAR_BG = ["from-blue-600/30 to-blue-500/10","from-purple-600/30 to-purple-500/10","from-amber-600/30 to-amber-500/10","from-emerald-600/30 to-emerald-500/10","from-pink-600/30 to-pink-500/10","from-cyan-600/30 to-cyan-500/10"];
const AVATAR_TEXT = ["text-blue-300","text-purple-300","text-amber-300","text-emerald-300","text-pink-300","text-cyan-300"];
const SPECIALTIES = ["Cortes & Barba","Cortes Clássicos","Penteados","Barba & Acabamentos","Cortes Infantis","Coloração & Luzes","Sobrancelha","Relaxamento"];

type EditState = {
  name: string; photo: string; phone: string; birthDate: string;
  bio: string; specialty: string; instagram: string;
};

function BarberProfileCard({ barber, idx, onEdit, onToggle }: { barber: Barber; idx: number; onEdit: () => void; onToggle: () => void}) {
  const [expanded, setExpanded] = useState(false);
  const bgClass  = AVATAR_BG[idx % AVATAR_BG.length];
  const txtClass = AVATAR_TEXT[idx % AVATAR_TEXT.length];
  const waHref = barber.phone ? `https://wa.me/55${barber.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Olá ${barber.name}!`)}` : null;

  return (
    <motion.div layout className={`glass-card rounded-2xl overflow-hidden border transition-all ${barber.active ? "border-white/7" : "border-white/3 opacity-55"}`}>
      {/* Header */}
      <div className="p-5 flex items-start gap-4">
        {/* Avatar / Photo */}
        <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 bg-gradient-to-br ${bgClass} border border-white/8`}>
          {barber.photo ? (
            <img src={barber.photo} alt={barber.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <span className={`font-display font-bold text-xl ${txtClass}`}>{initials(barber.name)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`font-display font-semibold text-base leading-tight ${barber.active ? "text-white" : "text-muted-foreground line-through"}`}>{barber.name}</p>
              {barber.specialty && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/12 text-accent border border-accent/20">{barber.specialty}</span>
              )}
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${barber.active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-500"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${barber.active ? "bg-emerald-400" : "bg-gray-500"}`} />
              {barber.active ? "Disponível" : "Inativo"}
            </div>
          </div>

          {/* Contact row */}
          <div className="flex items-center gap-3 mt-2">
            {barber.phone && (
              <a href={`tel:${barber.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors">
                <Phone className="w-3 h-3" />{barber.phone}
              </a>
            )}
            {barber.instagram && (
              <a href={`https://instagram.com/${barber.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-pink-400 transition-colors">
                <Instagram className="w-3 h-3" />@{barber.instagram.replace("@","")}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Expandable bio */}
      {barber.bio && (
        <div className="px-5 pb-2">
          <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
            <FileText className="w-3 h-3" />
            {expanded ? "Ocultar bio" : "Ver bio"}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-xs text-muted-foreground leading-relaxed mt-2 overflow-hidden">
                {barber.bio}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Birthday */}
      {barber.birthDate && (
        <div className="px-5 pb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Cake className="w-3 h-3" />
          {barber.birthDate.split("-").reverse().join("/")}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 pb-5 pt-3 border-t border-white/5 flex gap-2 flex-wrap">
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-white/5 hover:bg-white/9 text-muted-foreground hover:text-white text-xs font-semibold transition-colors border border-white/7"
          data-testid={`btn-edit-${barber.id}`}>
          <Pencil className="w-3.5 h-3.5" /> Editar Perfil
        </button>
        {waHref && (
          <a href={waHref} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-500/8 hover:bg-emerald-500/15 text-emerald-400 text-xs font-semibold transition-colors border border-emerald-500/15">
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
        )}
        <button onClick={onToggle}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-colors border ${barber.active ? "bg-red-500/8 hover:bg-red-500/15 text-red-400 border-red-500/15" : "bg-emerald-500/8 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/15"}`}
          data-testid={`btn-toggle-${barber.id}`}>
          {barber.active ? <><UserX className="w-3.5 h-3.5" />Desativar</> : <><UserCheck className="w-3.5 h-3.5" />Ativar</>}
        </button>
      </div>
    </motion.div>
  );
}

function EditBarberDialog({ barber, onClose, onSave, isPending }: {
  barber: Barber; onClose: () => void;
  onSave: (data: EditState) => void; isPending: boolean;
}) {
  const { toast } = useToast();
  const [state, setState] = useState<EditState>({
    name:      barber.name      ?? "",
    photo:     barber.photo     ?? "",
    phone:     barber.phone     ?? "",
    birthDate: barber.birthDate ?? "",
    bio:       barber.bio       ?? "",
    specialty: barber.specialty ?? "",
    instagram: barber.instagram ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof EditState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setState((prev) => ({ ...prev, [k]: e.target.value }));

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBarberPhoto(file, barber.id);
      setState((prev) => ({ ...prev, photo: url }));
      toast({ title: "Foto enviada com sucesso!" });
    } catch (err) {
      toast({ title: "Erro ao enviar foto", description: String(err), variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [barber.id, toast]);

  const inputClass = "bg-white/5 border border-white/8 h-10 rounded-xl text-white text-sm px-3 w-full focus:outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0e0e0e] border border-white/8 rounded-3xl shadow-2xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-white text-lg font-bold">Editar Perfil — {barber.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Photo upload zone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />Foto do Barbeiro
            </label>
            <div className="flex items-center gap-4">
              {/* Clickable avatar */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] cursor-pointer group"
              >
                {state.photo ? (
                  <img src={state.photo} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display font-bold text-xl text-muted-foreground">{initials(barber.name)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  {uploading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Camera className="w-5 h-5 text-white" />}
                </div>
              </div>

              {/* Upload button + URL override */}
              <div className="flex-1 space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-xs font-semibold text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>
                    : <><Camera className="w-3.5 h-3.5" />Fazer Upload</>}
                </button>
                <input
                  value={state.photo}
                  onChange={set("photo")}
                  placeholder="ou cole uma URL..."
                  className={inputClass}
                />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
              <input value={state.name} onChange={set("name")} placeholder="Nome completo" className={inputClass} data-testid="edit-name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />WhatsApp / Telefone</label>
              <input value={state.phone} onChange={set("phone")} placeholder="(11) 99999-9999" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Especialidade</label>
            <div className="relative">
              <select
  value={state.specialty}
  onChange={set("specialty")}
  className={`${inputClass} appearance-none pr-8 bg-[#111] text-white`}
>
  <option value="" style={{ backgroundColor: "#111", color: "white" }}>
    — Selecione ou deixe em branco —
  </option>

  {SPECIALTIES.map((s) => (
    <option
      key={s}
      value={s}
      style={{ backgroundColor: "#111", color: "white" }}
    >
      {s}
    </option>
  ))}
</select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Cake className="w-3.5 h-3.5" />Data de Nascimento</label>
              <input type="date" value={state.birthDate} onChange={set("birthDate")} className={`${inputClass} cursor-pointer`} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5" />Instagram</label>
              <input value={state.instagram} onChange={set("instagram")} placeholder="@handle" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Biografia</label>
            <textarea
              value={state.bio} onChange={set("bio")}
              placeholder="Uma breve apresentação do barbeiro..."
              rows={3}
              className="bg-white/5 border border-white/8 rounded-xl text-white text-sm px-3 py-2.5 w-full focus:outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end pt-2">
          <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 rounded-xl" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={isPending || !state.name.trim()} onClick={() => onSave(state)}
            className="bg-accent hover:bg-accent/90 text-white rounded-xl font-bold px-6 glow-accent">
            {isPending ? "Salvando..." : "Salvar Perfil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BarbeirosTab() {
  const qc = useQueryClient();
  const { data: barbers = [], isLoading } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const createMutation = useCreateBarber();
  const updateMutation = useUpdateBarber();
  const { toast } = useToast();

  const [showForm,  setShowForm]  = useState(false);
  const [newName,   setNewName]   = useState("");
  const [editTarget, setEditTarget] = useState<Barber | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListBarbersQueryKey() });
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(
      { data: { name: newName.trim() } },
      { onSuccess: () => { toast({ title: "Barbeiro adicionado" }); invalidate(); setNewName(""); setShowForm(false); },
        onError: () => toast({ title: "Erro", variant: "destructive" }) }
    );
  };

  const handleSaveProfile = (data: EditState) => {
    if (!editTarget) return;
    updateMutation.mutate(
      { id: editTarget.id, data: {
        name:      data.name      || undefined,
        photo:     data.photo     || null,
        phone:     data.phone     || null,
        birthDate: data.birthDate || null,
        bio:       data.bio       || null,
        specialty: data.specialty || null,
        instagram: data.instagram || null,
      }},
      { onSuccess: () => { toast({ title: "Perfil atualizado!" }); invalidate(); setEditTarget(null); },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }) }
    );
  };

  const handleToggle = (b: Barber) => {
    updateMutation.mutate(
      { id: b.id, data: { active: !b.active } },
      { onSuccess: () => { toast({ title: b.active ? "Barbeiro desativado" : "Barbeiro ativado" }); invalidate(); } }
    );
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <SectionHeader
        title="Barbeiros"
        action={
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-white rounded-xl gap-2 h-9 font-semibold"
            onClick={() => setShowForm((v) => !v)}>
            <Users className="w-4 h-4" /> Adicionar
          </Button>
        }
      />

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
            <Button type="button" size="sm" variant="outline" className="border-white/10 hover:bg-white/5 h-11 rounded-xl"
              onClick={() => { setShowForm(false); setNewName(""); }}>
              <XIcon className="w-4 h-4" />
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center text-muted-foreground text-sm">Carregando...</div>
      ) : barbers.length === 0 ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center text-muted-foreground text-sm">Nenhum barbeiro cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbers.map((b, i) => (
            <BarberProfileCard key={b.id} barber={b} idx={i}
              onEdit={() => setEditTarget(b)}
              onToggle={() => handleToggle(b)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editTarget && (
        <EditBarberDialog
          barber={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveProfile}
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   SERVIÇOS TAB
══════════════════════════════════════════════ */
type EditServiceState = { name: string; price: string; durationMinutes: string };

function ServicosTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: services = [], isLoading } = useListServices({ query: { queryKey: getListServicesQueryKey() } });
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListServicesQueryKey() });

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState({ id: "", name: "", price: "", durationMinutes: "" });
  const [editState, setEditState] = useState<EditServiceState>({ name: "", price: "", durationMinutes: "" });

  const inputClass = "bg-white/5 border border-white/8 h-10 rounded-xl text-white text-sm px-3 w-full focus:outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.name || !form.price || !form.durationMinutes) return;
    createMutation.mutate(
      { data: { id: form.id, name: form.name, price: parseFloat(form.price), durationMinutes: parseInt(form.durationMinutes) } },
      { onSuccess: () => { toast({ title: "Serviço criado!" }); invalidate(); setShowForm(false); setForm({ id: "", name: "", price: "", durationMinutes: "" }); },
        onError: () => toast({ title: "Erro ao criar serviço", variant: "destructive" }) }
    );
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    updateMutation.mutate(
      { id: editTarget.id, data: { name: editState.name, price: parseFloat(editState.price), durationMinutes: parseInt(editState.durationMinutes) } },
      { onSuccess: () => { toast({ title: "Serviço atualizado!" }); invalidate(); setEditTarget(null); },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }) }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id }, { onSuccess: () => { toast({ title: "Serviço desativado" }); invalidate(); } });
  };

  const openEdit = (s: Service) => {
    setEditTarget(s);
    setEditState({ name: s.name, price: String(s.price), durationMinutes: String(s.durationMinutes) });
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <SectionHeader
        title="Serviços"
        action={
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-white rounded-xl gap-2 h-9 font-semibold" onClick={() => setShowForm(v => !v)}>
            <Tag className="w-4 h-4" /> Novo Serviço
          </Button>
        }
      />

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            onSubmit={handleCreate} className="glass-card rounded-2xl p-5 space-y-4 border border-white/8">
            <p className="text-sm font-semibold text-white">Adicionar novo serviço</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome do serviço</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Corte + Barba" className={inputClass} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID (slug)</label>
                <input value={form.id} onChange={e => setForm(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} placeholder="ex: corte-barba" className={inputClass} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" />Duração (min)</label>
                <input type="number" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: e.target.value }))} placeholder="30" className={inputClass} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço (R$)</label>
                <input type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="35.00" className={inputClass} required />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" className="border-white/10 hover:bg-white/5 rounded-xl" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" size="sm" className="bg-accent hover:bg-accent/90 text-white rounded-xl font-bold px-6" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Criar Serviço"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center text-muted-foreground text-sm">Carregando...</div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-white/6">{["Serviço","Duração","Preço",""].map(h => <th key={h} className="px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>
              {services.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground text-sm">Nenhum serviço encontrado.</td></tr>
              ) : services.map(s => (
                <tr key={s.id} className="border-b border-white/4 hover:bg-white/3 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground/60 font-mono">{s.id}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{s.durationLabel}</td>
                  <td className="px-5 py-4 text-sm text-gold font-bold">{s.priceLabel}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white flex items-center justify-center transition-colors" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(s.id)} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors" title="Desativar"><Ban className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      {editTarget && (
        <Dialog open onOpenChange={o => !o && setEditTarget(null)}>
          <DialogContent className="bg-[#0e0e0e] border border-white/8 rounded-3xl shadow-2xl sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display text-white text-lg font-bold">Editar — {editTarget.name}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
                <input value={editState.name} onChange={e => setEditState(p => ({ ...p, name: e.target.value }))} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" />Duração (min)</label>
                  <input type="number" value={editState.durationMinutes} onChange={e => setEditState(p => ({ ...p, durationMinutes: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço (R$)</label>
                  <input type="number" step="0.01" value={editState.price} onChange={e => setEditState(p => ({ ...p, price: e.target.value }))} className={inputClass} />
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2 sm:justify-end pt-2">
              <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 rounded-xl" onClick={() => setEditTarget(null)}>Cancelar</Button>
              <Button size="sm" disabled={updateMutation.isPending} onClick={handleUpdate} className="bg-accent hover:bg-accent/90 text-white rounded-xl font-bold px-6 glow-accent">
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   HORÁRIOS BLOQUEADOS TAB
══════════════════════════════════════════════ */
function HorariosTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: blocked = [], isLoading } = useListBlockedSlots({}, { query: { queryKey: getListBlockedSlotsQueryKey({}) } });
  const createMutation = useCreateBlockedSlot();
  const deleteMutation = useDeleteBlockedSlot();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListBlockedSlotsQueryKey({}) });

  const [form, setForm] = useState({ date: "", endDate: "", time: "", reason: "", allDay: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (value: Date) => {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  };

  const getDatesRange = (start: string, end: string) => {
    const dates: string[] = [];
    let current = parseDate(start);
    const last = parseDate(end);

    while (current <= last) {
      dates.push(formatDate(current));
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
    }

    return dates;
  };

  const executeBlockedSlotMutation = (slot: { date: string; time: string | null; reason: string | null; allDay: boolean }) =>
    new Promise<void>((resolve, reject) => {
      createMutation.mutate(
        { data: slot },
        { onSuccess: () => resolve(), onError: () => reject() }
      );
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) return;

    const startDate = form.date;
    const endDate = form.allDay && form.endDate ? form.endDate : form.date;
    if (form.allDay && form.endDate && endDate < startDate) {
      toast({ title: "Data final deve ser igual ou posterior à data inicial.", variant: "destructive" });
      return;
    }

    const dates = form.allDay ? getDatesRange(startDate, endDate) : [startDate];
    setIsSubmitting(true);

    try {
      for (const date of dates) {
        await executeBlockedSlotMutation({
          date,
          time: form.allDay ? null : (form.time || null),
          reason: form.reason || null,
          allDay: form.allDay,
        });
      }

      toast({ title: "Horário bloqueado!" });
      invalidate();
      setForm({ date: "", endDate: "", time: "", reason: "", allDay: true });
    } catch {
      toast({ title: "Erro ao bloquear", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRange = (type: "week" | "month") => {
    if (!form.date) return;

    const start = parseDate(form.date);
    const end =
      type === "week"
        ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
        : new Date(start.getFullYear(), start.getMonth() + 1, 0);

    setForm((prev) => ({ ...prev, allDay: true, endDate: formatDate(end) }));
  };

  const inputClass = "bg-white/5 border border-white/8 h-10 rounded-xl text-white text-sm px-3 w-full focus:outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground";

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <SectionHeader title="Horários Bloqueados" />

      {/* Add form */}
      <div className="glass-card rounded-2xl p-5 space-y-4 border border-white/8">
        <p className="text-sm font-semibold text-white flex items-center gap-2"><CalendarOff className="w-4 h-4 text-accent" />Bloquear data ou horário</p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data inicial</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={`${inputClass} cursor-pointer`} required />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motivo (opcional)</label>
              <input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Ex: Feriado, folga..." className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.allDay} onChange={e => setForm(p => ({ ...p, allDay: e.target.checked, endDate: e.target.checked ? p.endDate : "" }))}
                className="w-4 h-4 rounded border-white/20 accent-accent cursor-pointer" />
              <span className="text-sm text-muted-foreground">Bloquear o dia inteiro</span>
            </label>
          </div>
          {form.allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data final (opcional)</label>
                <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={`${inputClass} cursor-pointer`} />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações rápidas</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleQuickRange("week")}
                    className="bg-white/5 border border-white/8 text-white text-sm rounded-xl px-3 py-2 hover:bg-white/10 transition"
                    disabled={!form.date}>
                    Bloquear semana
                  </button>
                  <button type="button" onClick={() => handleQuickRange("month")}
                    className="bg-white/5 border border-white/8 text-white text-sm rounded-xl px-3 py-2 hover:bg-white/10 transition"
                    disabled={!form.date}>
                    Bloquear mês
                  </button>
                </div>
              </div>
            </div>
          )}
          {!form.allDay && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário específico (HH:MM)</label>
              <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className={`${inputClass} cursor-pointer`} />
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" size="sm" className="bg-accent hover:bg-accent/90 text-white rounded-xl font-bold px-6" disabled={createMutation.isPending || isSubmitting}>
              {createMutation.isPending || isSubmitting ? "Bloqueando..." : "Bloquear"}
            </Button>
          </div>
        </form>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center text-muted-foreground text-sm">Carregando...</div>
      ) : blocked.length === 0 ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center text-muted-foreground text-sm">Nenhum bloqueio cadastrado.</div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-white/6">{["Data","Horário","Motivo","Tipo",""].map(h => <th key={h} className="px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>
              {blocked.map(b => (
                <tr key={b.id} className="border-b border-white/4 hover:bg-white/3 transition-colors group">
                  <td className="px-5 py-4 text-sm font-semibold text-white">{b.date.split("-").reverse().join("/")}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{b.time ?? <span className="opacity-30">—</span>}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{b.reason ?? <span className="opacity-30">—</span>}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${b.allDay ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                      {b.allDay ? "Dia inteiro" : "Horário"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => deleteMutation.mutate({ id: b.id }, { onSuccess: () => { toast({ title: "Bloqueio removido" }); invalidate(); } })}
                      className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100" title="Remover">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   LEMBRETES TAB
══════════════════════════════════════════════ */
function LembretesTab() {
  const { data: reminders = [], isLoading, refetch } = useGetDashboardReminders({ query: { queryKey: getGetDashboardRemindersQueryKey() } });
  const { data: barbers = [] } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const [sentSet, setSentSet] = useState<Set<number>>(new Set());
  const [bulkIdx, setBulkIdx] = useState<number | null>(null);

  const waLink = (apt: { clientName: string; clientPhone: string; serviceName: string; date: string; time: string }) => {
    const dateStr = apt.date.split("-").reverse().join("/");
    const msg = `Olá, ${apt.clientName.split(" ")[0]}! 👋 Lembramos que você tem um agendamento amanhã (${dateStr}) às ${apt.time} para ${apt.serviceName} na Jedilson Hair. Qualquer dúvida, estamos aqui! ✂️`;
    return `https://wa.me/55${apt.clientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  };

  const markSent = (id: number) => setSentSet(prev => new Set([...prev, id]));

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0].split("-").reverse().join("/");
  })();

  const allSent = reminders.length > 0 && reminders.every(r => sentSet.has(r.id));
  const sentCount = reminders.filter(r => sentSet.has(r.id)).length;

  const handleBulkNext = () => {
    const nextIdx = bulkIdx === null ? 0 : bulkIdx + 1;
    if (nextIdx >= reminders.length) { setBulkIdx(null); return; }
    const apt = reminders[nextIdx];
    window.open(waLink(apt), "_blank");
    markSent(apt.id);
    setBulkIdx(nextIdx + 1 >= reminders.length ? null : nextIdx);
  };

  const bulkLabel = (() => {
    if (allSent) return null;
    if (bulkIdx === null) return { label: `Enviar para todos (${reminders.length - sentCount})`, next: 0 };
    const nextIdx = bulkIdx + 1;
    if (nextIdx >= reminders.length) return null;
    return { label: `Próximo: ${reminders[nextIdx]?.clientName?.split(" ")[0]} (${sentCount + 1}/${reminders.length})`, next: nextIdx };
  })();

  const handleReset = () => { setSentSet(new Set()); setBulkIdx(null); };
  const handleRefetch = () => { refetch(); handleReset(); };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <SectionHeader
        title="Lembretes"
        action={
          <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/5 rounded-xl gap-2 h-9 text-muted-foreground" onClick={handleRefetch}>
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </Button>
        }
      />

      {/* Info / progress box */}
      <div className="glass-card rounded-2xl p-5 border border-gold/15 bg-gold/3">
        <div className="flex items-center gap-3 flex-wrap">
          <Bell className="w-5 h-5 text-gold shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Agendamentos de amanhã — {tomorrow}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {reminders.length === 0
                ? "Nenhum agendamento pendente."
                : allSent
                ? "Todos os lembretes foram enviados! ✓"
                : `Cada clique em "Próximo" abre o WhatsApp já preenchido — só confirmar o envio e voltar.`}
            </p>
          </div>
          {/* Bulk button */}
          {!isLoading && reminders.length > 0 && !allSent && (
            <button
              onClick={handleBulkNext}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 text-sm font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              {bulkIdx === null
                ? `Enviar para todos`
                : `Próximo (${sentCount + 1}/${reminders.length})`}
            </button>
          )}
          {allSent && (
            <button onClick={handleReset} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/10 text-xs font-semibold transition-colors shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> Reiniciar
            </button>
          )}
        </div>

        {/* Progress bar */}
        {reminders.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{sentCount} de {reminders.length} enviados</span>
              <span>{Math.round((sentCount / reminders.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(sentCount / reminders.length) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center text-muted-foreground text-sm">Carregando...</div>
      ) : reminders.length === 0 ? (
        <div className="glass-card rounded-2xl px-6 py-12 text-center space-y-2">
          <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground text-sm">Nenhum agendamento para amanhã.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((apt, i) => {
            const sent = sentSet.has(apt.id);
            const isNext = !sent && bulkIdx !== null && reminders[bulkIdx + 1]?.id === apt.id;
            const barberName = apt.barberId ? barbers.find(b => String(b.id) === apt.barberId)?.name ?? `#${apt.barberId}` : "Qualquer disponível";
            return (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`glass-card rounded-2xl p-5 border flex items-center gap-4 transition-all ${sent ? "border-emerald-500/20 bg-emerald-500/3 opacity-70" : isNext ? "border-emerald-500/30 ring-1 ring-emerald-500/20" : "border-white/7"}`}>
                {/* Status indicator */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${sent ? "bg-emerald-500/15 text-emerald-400" : "bg-white/6 text-muted-foreground"}`}>
                  {sent ? <CheckCircle2 className="w-5 h-5" /> : apt.clientName.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${sent ? "text-muted-foreground line-through" : "text-white"}`}>{apt.clientName}</p>
                    <span className="text-xs text-muted-foreground">{apt.clientPhone}</span>
                    {isNext && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">PRÓXIMO</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">{apt.serviceName}</span>
                    <span className="text-xs text-gold font-semibold">{apt.time}</span>
                    <span className="text-xs text-muted-foreground/60">{barberName}</span>
                  </div>
                </div>
                {/* Individual CTA */}
                {!sent ? (
                  <a href={waLink(apt)} target="_blank" rel="noopener noreferrer"
                    onClick={() => markSent(apt.id)}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors shrink-0 whitespace-nowrap">
                    <MessageCircle className="w-3.5 h-3.5" /> Enviar
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-500/8 text-emerald-500/60 border border-emerald-500/15 text-xs font-semibold shrink-0 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   CONFIGURAÇÕES TAB
══════════════════════════════════════════════ */
function ConfiguracoesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const { mutate: save, isPending } = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        toast({ title: "Configurações salvas!" });
      },
      onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
    },
  });

  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (settings?.contactWhatsapp) {
      const raw = settings.contactWhatsapp;
      const formatted = raw.startsWith("55") ? raw.slice(2) : raw;
      setPhone(formatted);
    }
  }, [settings?.contactWhatsapp]);

  const handleSave = () => {
    const clean = phone.replace(/\D/g, "");
    if (!clean) { toast({ title: "Digite um número válido", variant: "destructive" }); return; }
    const full = clean.startsWith("55") ? clean : `55${clean}`;
    save({ data: { contactWhatsapp: full } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader title="Configurações" />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border border-white/7 space-y-6">
        <div>
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            WhatsApp de Contato
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Este número aparece no botão de WhatsApp da página de agendamento e no botão flutuante. Inclua o DDD.
          </p>
          {isLoading ? (
            <div className="h-11 rounded-xl bg-white/5 animate-pulse" />
          ) : (
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">+55</span>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="11 97343-6623"
                  className="pl-10 bg-white/5 border-white/8 h-11 rounded-xl text-sm"
                />
              </div>
              <Button onClick={handleSave} disabled={isPending}
                className="h-11 px-6 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold shrink-0">
                {isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          )}
          {settings?.contactWhatsapp && (
            <p className="mt-3 text-xs text-muted-foreground/70">
              Número atual: +{settings.contactWhatsapp}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
