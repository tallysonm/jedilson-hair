import { useState } from "react";
import { useLocation } from "wouter";
import {
  MessageCircle, CheckCircle2, RefreshCw,
  CalendarDays, ArrowLeft, Clock, Check, Repeat2,
  ChevronRight, User, Phone, Star, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  useListServices,
  useGetAvailableSlots,
  getGetAvailableSlotsQueryKey,
  useCreateAppointment,
  useCreateRecurringAppointments,
  useListBarbers,
  getListBarbersQueryKey,
} from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { JedilsonLogo } from "@/components/Logo";

/* ── Constants ── */
const WEEKDAYS = [
  { value: "0", label: "Domingo",      short: "Dom" },
  { value: "2", label: "Terça-feira",  short: "Ter" },
  { value: "3", label: "Quarta-feira", short: "Qua" },
  { value: "4", label: "Quinta-feira", short: "Qui" },
  { value: "5", label: "Sexta-feira",  short: "Sex" },
  { value: "6", label: "Sábado",       short: "Sáb" },
];
const PERIOD_OPTIONS = [
  { value: "this_month",    label: "Este mês" },
  { value: "next_2_months", label: "Próximos 2 meses" },
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
const WEEKDAY_SLOTS: Record<string, string[]> = {
  "0": generate30minSlots(7, 14),
  "2": generate30minSlots(7, 20),
  "3": generate30minSlots(7, 20),
  "4": generate30minSlots(7, 20),
  "5": generate30minSlots(7, 20),
  "6": generate30minSlots(7, 20),
};
function getMaxDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()).toISOString().split("T")[0];
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
const SVC_COLORS: string[] = [
  "#1D3557","#7c1d26","#4a1d96","#14532d","#713f12",
  "#1d4556","#6d1e4c","#312e81","#7f1d1d","#1c3557",
  "#14532d","#701a75","#1a2f50","#6d1e4c","#1D3557",
];
const PAGE = { initial: { opacity: 0, x: 32 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -32 } };
const FADE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

type SuccessData =
  | { type: "single";    serviceName: string; servicePrice: string; date: string; time: string; name: string; barberName: string }
  | { type: "recurring"; created: string[];   skipped: number;     serviceName: string; time: string; name: string; groupId: string };

const WA_PHONE = "5511973436623";

/* ════════════════════════════════ */
export default function BookingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep]               = useState(0);
  const [serviceId, setServiceId]     = useState("");
  const [barberId, setBarberId]       = useState("all");
  const [isRecurring, setIsRecurring] = useState(false);
  const [date, setDate]               = useState("");
  const [time, setTime]               = useState("");
  const [weekday, setWeekday]         = useState("4");
  const [period, setPeriod]           = useState<"this_month"|"next_2_months">("this_month");
  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const { data: services = [] } = useListServices();
  const { data: barbers  = [] } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const activeBarbers = barbers.filter((b) => b.active);

  const slotParams = { date, serviceId, ...(barberId !== "all" ? { barberId } : {}) };
  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlots(slotParams, {
    query: { enabled: !isRecurring && !!date && !!serviceId, queryKey: getGetAvailableSlotsQueryKey(slotParams) },
  });
  const createMutation          = useCreateAppointment();
  const createRecurringMutation = useCreateRecurringAppointments();
  const isPending = createMutation.isPending || createRecurringMutation.isPending;

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedBarber  = activeBarbers.find((b) => String(b.id) === barberId);

  const handleDateChange = (v: string) => {
    if (v && new Date(v).getUTCDay() === 1) {
      toast({ title: "Aviso", description: "Segunda-feira fechado" }); return;
    }
    setDate(v); setTime("");
  };

  const handleSingle = () => {
    if (!name || !phone || !serviceId || !date || !time) return;
    createMutation.mutate(
      { data: { serviceId, date, time, clientName: name, clientPhone: phone, barberId: barberId !== "all" ? barberId : null } },
      {
        onSuccess: () => setSuccessData({
          type: "single", serviceName: selectedService?.name || "",
          servicePrice: selectedService?.priceLabel || "", date, time, name,
          barberName: selectedBarber?.name || "Qualquer disponível",
        }),
        onError: () => toast({ title: "Horário indisponível", description: "Tente outro horário ou data.", variant: "destructive" }),
      }
    );
  };

  const handleRecurring = () => {
    if (!name || !phone || !serviceId || !time) return;
    createRecurringMutation.mutate(
      { data: { clientName: name, clientPhone: phone, serviceId, time, weekday: parseInt(weekday, 10), period, startDate: new Date().toISOString().split("T")[0], barberId: barberId !== "all" ? barberId : null } },
      {
        onSuccess: (result) => {
          if (result.created.length === 0) { toast({ title: "Sem disponibilidade", description: "Todas as datas do período estão ocupadas.", variant: "destructive" }); return; }
          setSuccessData({ type: "recurring", created: result.created.map((a) => a.date), skipped: result.skipped.length, serviceName: selectedService?.name || "", time, name, groupId: result.groupId });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao criar recorrências.", variant: "destructive" }),
      }
    );
  };

  const resetForm = () => {
    setStep(0); setServiceId(""); setBarberId("all"); setIsRecurring(false);
    setDate(""); setTime(""); setWeekday("4"); setPeriod("this_month");
    setName(""); setPhone(""); setSuccessData(null);
  };

  const waMsg = (msg: string) => `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;

  /* ── SUCCESS SCREENS ── */
  if (successData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PageHeader onAdminClick={() => setLocation("/admin")} />
        <main className="flex-1 flex items-center justify-center p-4 py-12">
          <AnimatePresence mode="wait">
            {successData.type === "single" ? (
              <motion.div key="ss" {...FADE} className="w-full max-w-sm">
                <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
                  {/* Accent top strip */}
                  <div className="h-1.5 bg-gradient-to-r from-accent via-gold to-accent" />
                  <div className="p-8 text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Agendamento confirmado</p>
                      <h2 className="font-display text-2xl font-bold text-white">Até logo, {successData.name.split(" ")[0]}!</h2>
                    </div>
                    <div className="rounded-2xl border border-white/7 divide-y divide-white/5 text-left overflow-hidden">
                      {[
                        { label: "Serviço",  value: successData.serviceName },
                        { label: "Barbeiro", value: successData.barberName },
                        { label: "Data",     value: successData.date.split("-").reverse().join("/") },
                        { label: "Horário",  value: successData.time },
                      ].map((r) => (
                        <div key={r.label} className="flex justify-between items-center px-5 py-3.5 bg-white/2">
                          <span className="text-muted-foreground text-sm">{r.label}</span>
                          <span className="text-white font-semibold text-sm">{r.value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center px-5 py-3.5 bg-white/2">
                        <span className="text-muted-foreground text-sm">Valor</span>
                        <span className="text-gold font-bold text-base">{successData.servicePrice}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={waMsg(`Olá! Confirmando meu agendamento:\nCliente: ${successData.name}\nServiço: ${successData.serviceName}\nData: ${successData.date.split("-").reverse().join("/")}\nHorário: ${successData.time}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold text-sm hover:bg-emerald-500/25 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> Confirmar no WhatsApp
                      </a>
                      <Button onClick={resetForm} variant="outline" className="flex-1 border-white/10 text-muted-foreground hover:bg-white/5 h-11 rounded-xl">
                        <RefreshCw className="w-4 h-4 mr-2" /> Novo
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="sr" {...FADE} className="w-full max-w-sm">
                <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
                  <div className="h-1.5 bg-gradient-to-r from-gold via-accent to-gold" />
                  <div className="p-8 text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
                        <Star className="w-10 h-10 text-gold" />
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Recorrência criada</p>
                      <h2 className="font-display text-2xl font-bold text-white">{successData.created.length} agendamentos!</h2>
                      {successData.skipped > 0 && <p className="text-muted-foreground text-xs mt-1">{successData.skipped} ignorado{successData.skipped !== 1 ? "s" : ""} por conflito</p>}
                    </div>
                    <div className="rounded-2xl border border-white/7 overflow-hidden max-h-52 overflow-y-auto">
                      {successData.created.map((d) => (
                        <div key={d} className="flex justify-between items-center px-5 py-3 border-b border-white/5 last:border-0 bg-white/2">
                          <span className="text-white text-sm font-semibold">{d.split("-").reverse().join("/")}</span>
                          <span className="text-gold text-sm">{successData.time}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={waMsg(`Olá! Meus agendamentos recorrentes:\nCliente: ${successData.name}\nServiço: ${successData.serviceName}\nHorário: ${successData.time}\nDatas: ${successData.created.map((d) => d.split("-").reverse().join("/")).join(", ")}`)}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold text-sm hover:bg-emerald-500/25 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                      <Button onClick={resetForm} variant="outline" className="flex-1 border-white/10 text-muted-foreground hover:bg-white/5 h-11 rounded-xl">
                        <RefreshCw className="w-4 h-4 mr-2" /> Novo
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <WhatsAppFAB />
        <InfoFooter />
      </div>
    );
  }

  const STEPS = ["Serviço", "Barbeiro", "Data & Hora", "Confirmar"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader onAdminClick={() => setLocation("/admin")} />

      {/* Step indicator */}
      <div className="sticky top-16 z-40 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ${
                  i < step ? "bg-gold text-black" :
                  i === step ? "bg-accent text-white shadow-lg shadow-accent/30" :
                  "bg-white/6 text-muted-foreground"
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-[11px] font-semibold ml-1.5 hidden sm:block transition-colors ${i === step ? "text-white" : "text-muted-foreground"}`}>{label}</span>
                {i < STEPS.length - 1 && <div className={`h-px flex-1 mx-2 transition-colors ${i < step ? "bg-gold/40" : "bg-white/8"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-start justify-center p-4 py-6 pb-24">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">

            {/* ── STEP 0: SERVICE ── */}
            {step === 0 && (
              <motion.div key="s0" {...PAGE} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}>
                <div className="mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Passo 1 de 4</p>
                  <h1 className="font-display text-2xl font-bold text-white">Escolha o serviço</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">Selecione o que você deseja hoje</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((s, i) => {
                    const selected = serviceId === s.id;
                    const color = SVC_COLORS[i % SVC_COLORS.length];
                    return (
                      <motion.button
                        key={s.id}
                        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setServiceId(s.id); setTime(""); setStep(1); }}
                        className={`relative text-left rounded-2xl p-4 border transition-all overflow-hidden ${
                          selected ? "border-gold bg-gold/8 shadow-lg shadow-yellow-900/20" : "border-white/7 bg-white/3 hover:bg-white/5 hover:border-white/12"
                        }`}
                        data-testid={`service-${s.id}`}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />
                        <div className="pl-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-white text-sm leading-snug">{s.name}</p>
                            {selected && <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-gold font-bold">{s.priceLabel}</span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />{s.durationLabel}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── STEP 1: BARBER ── */}
            {step === 1 && (
              <motion.div key="s1" {...PAGE} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}>
                <div className="flex items-start gap-3 mb-6">
                  <BackButton onClick={() => setStep(0)} />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Passo 2 de 4</p>
                    <h1 className="font-display text-2xl font-bold text-white">Escolha o barbeiro</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Ou deixe-nos escolher para você</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <BarberOptionCard
                    name="Qualquer" subtitle="Primeiro disponível"
                    photo={null} specialty={null}
                    selected={barberId === "all"}
                    onSelect={() => { setBarberId("all"); setStep(2); }}
                    isAny
                  />
                  {activeBarbers.map((b) => (
                    <BarberOptionCard
                      key={b.id}
                      name={b.name} subtitle={b.specialty ?? "Disponível"}
                      photo={b.photo ?? null} specialty={b.specialty ?? null}
                      selected={barberId === String(b.id)}
                      onSelect={() => { setBarberId(String(b.id)); setStep(2); }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: DATE / TIME ── */}
            {step === 2 && (
              <motion.div key="s2" {...PAGE} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}>
                <div className="flex items-start gap-3 mb-6">
                  <BackButton onClick={() => setStep(1)} />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Passo 3 de 4</p>
                    <h1 className="font-display text-2xl font-bold text-white">Data e horário</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Escolha quando quer ser atendido</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-5">
                  {[
                    { value: false, icon: CalendarDays, label: "Agendamento único" },
                    { value: true,  icon: Repeat2,      label: "Semanal fixo" },
                  ].map((opt) => (
                    <button key={String(opt.value)} type="button"
                      onClick={() => { setIsRecurring(opt.value); setDate(""); setTime(""); }}
                      className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold border transition-all ${
                        isRecurring === opt.value ? "bg-accent/15 border-accent text-white" : "bg-white/4 border-white/8 text-muted-foreground hover:bg-white/7"
                      }`}
                      data-testid={`toggle-recurring-${opt.value}`}
                    >
                      <opt.icon className="w-4 h-4" />{opt.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {!isRecurring ? (
                    <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="glass-card rounded-2xl p-5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Data</label>
                        <Input type="date" min={new Date().toISOString().split("T")[0]} max={getMaxDate()}
                          value={date} onChange={(e) => handleDateChange(e.target.value)}
                          className="bg-transparent border-none text-white text-lg font-semibold h-auto p-0 focus-visible:ring-0 shadow-none"
                          data-testid="input-date"
                        />
                      </div>
                      {date && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horários disponíveis</label>
                          </div>
                          {slotsLoading ? (
                            <div className="grid grid-cols-4 gap-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />)}</div>
                          ) : (slotsData?.slots ?? []).length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-4">Sem horários disponíveis nesta data.</p>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              {(slotsData?.slots ?? []).map((slot) => (
                                <motion.button key={slot} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={() => setTime(slot)}
                                  className={`h-10 rounded-xl text-sm font-semibold border transition-all ${
                                    time === slot ? "bg-accent border-accent text-white shadow-lg shadow-accent/25" : "bg-white/4 border-white/8 text-muted-foreground hover:bg-white/8 hover:text-white"
                                  }`}
                                  data-testid={`slot-${slot}`}
                                >{slot}</motion.button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="recurring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
                        <CalendarDays className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-300/90 leading-relaxed">Agendamentos para todos os dias selecionados no período. Datas com conflito são ignoradas automaticamente.</p>
                      </div>
                      <div className="glass-card rounded-2xl p-5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Dia da semana</label>
                        <div className="flex gap-2 flex-wrap">
                          {WEEKDAYS.map((d) => (
                            <button key={d.value} type="button" onClick={() => { setWeekday(d.value); setTime(""); }}
                              className={`h-9 px-3.5 rounded-xl text-sm font-semibold border transition-all ${weekday === d.value ? "bg-accent border-accent text-white" : "bg-white/4 border-white/8 text-muted-foreground hover:bg-white/8 hover:text-white"}`}
                              data-testid="select-weekday"
                            >{d.short}</button>
                          ))}
                        </div>
                      </div>
                      <div className="glass-card rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-muted-foreground" /><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário fixo</label></div>
                        <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto">
                          {(WEEKDAY_SLOTS[weekday] ?? WEEKDAY_SLOTS["2"]).map((slot) => (
                            <motion.button key={slot} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={() => setTime(slot)}
                              className={`h-10 rounded-xl text-sm font-semibold border transition-all ${time === slot ? "bg-accent border-accent text-white shadow-lg shadow-accent/25" : "bg-white/4 border-white/8 text-muted-foreground hover:bg-white/8 hover:text-white"}`}
                              data-testid="select-recurring-time"
                            >{slot}</motion.button>
                          ))}
                        </div>
                      </div>
                      <div className="glass-card rounded-2xl p-5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Período</label>
                        <div className="flex gap-2">
                          {PERIOD_OPTIONS.map((opt) => (
                            <button key={opt.value} type="button" onClick={() => setPeriod(opt.value as typeof period)}
                              className={`flex-1 h-11 rounded-xl text-sm font-semibold border transition-all ${period === opt.value ? "bg-gold/15 border-gold text-gold" : "bg-white/4 border-white/8 text-muted-foreground hover:bg-white/7"}`}
                              data-testid={`period-${opt.value}`}
                            >{opt.label}</button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {((!isRecurring && date && time) || (isRecurring && time)) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                    <Button onClick={() => setStep(3)} className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold glow-accent">
                      Continuar <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: INFO + CONFIRM ── */}
            {step === 3 && (
              <motion.div key="s3" {...PAGE} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}>
                <div className="flex items-start gap-3 mb-6">
                  <BackButton onClick={() => setStep(2)} />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Passo 4 de 4</p>
                    <h1 className="font-display text-2xl font-bold text-white">Seus dados</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Quase lá — confirme suas informações</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="glass-card rounded-2xl overflow-hidden mb-5">
                  <div className="h-0.5 bg-gradient-to-r from-accent via-gold to-accent" />
                  <div className="px-5 py-3 border-b border-white/6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumo do agendamento</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    <SummaryRow label="Serviço"  value={selectedService?.name ?? ""} />
                    <SummaryRow label="Barbeiro" value={selectedBarber ? selectedBarber.name : "Qualquer disponível"} />
                    {isRecurring ? (
                      <>
                        <SummaryRow label="Dia"     value={WEEKDAYS.find((d) => d.value === weekday)?.label ?? ""} />
                        <SummaryRow label="Horário" value={time} />
                        <SummaryRow label="Período" value={PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? ""} />
                      </>
                    ) : (
                      <>
                        <SummaryRow label="Data"    value={date.split("-").reverse().join("/")} />
                        <SummaryRow label="Horário" value={time} />
                      </>
                    )}
                    <SummaryRow label="Valor" value={selectedService?.priceLabel ?? ""} gold />
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo"
                      className="bg-white/4 border-white/8 h-12 pl-11 rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                      data-testid="input-name" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999"
                      className="bg-white/4 border-white/8 h-12 pl-11 rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                      data-testid="input-phone" />
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                  <Button onClick={isRecurring ? handleRecurring : handleSingle}
                    disabled={isPending || !name || !phone}
                    className="w-full h-13 rounded-xl bg-accent hover:bg-accent/90 text-white text-base font-bold glow-accent"
                    data-testid="button-submit"
                  >
                    {isPending ? "Confirmando..." : isRecurring ? "Criar Agendamentos Recorrentes" : "Confirmar Agendamento"}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <WhatsAppFAB />
      <InfoFooter />
    </div>
  );
}

/* ── Sub-components ── */

function PageHeader({ onAdminClick }: { onAdminClick: () => void }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#080808]/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <JedilsonLogo size="sm" />
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${WA_PHONE}?text=${encodeURIComponent("Olá! Quero agendar um corte.")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <button onClick={onAdminClick}
            className="text-xs text-muted-foreground hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/8">
            Admin
          </button>
        </div>
      </div>
    </header>
  );
}

function WhatsAppFAB() {
  const msg = "Olá! Gostaria de agendar um horário na Jedilson Hair.";
  return (
    <motion.a
      href={`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`}
      target="_blank" rel="noopener noreferrer"
      className="fixed bottom-6 right-5 z-50 w-14 h-14 rounded-full bg-[#22C55E] flex items-center justify-center"
      style={{ boxShadow: "0 4px 24px rgba(34,197,94,0.55), 0 0 0 0 rgba(34,197,94,0.4)" }}
      whileHover={{ scale: 1.12, boxShadow: "0 6px 30px rgba(34,197,94,0.65)" as unknown as number }}
      whileTap={{ scale: 0.94 }}
      animate={{ boxShadow: ["0 4px 24px rgba(34,197,94,0.55), 0 0 0 0 rgba(34,197,94,0.4)", "0 4px 24px rgba(34,197,94,0.55), 0 0 0 12px rgba(34,197,94,0)", "0 4px 24px rgba(34,197,94,0.55), 0 0 0 0 rgba(34,197,94,0)"] as unknown as number }}
      transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
      title="Falar no WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
    </motion.a>
  );
}

function InfoFooter() {
  return (
    <div className="bg-[#060606] border-t border-white/5 py-5 pb-8">
      <div className="max-w-lg mx-auto px-4 flex flex-col sm:flex-row gap-3 sm:gap-6 items-start sm:items-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>R. Mademoiselle - Helena Maria, Osasco - SP</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Ter–Sáb 07h–20h · Dom 07h–14h · Seg fechado</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
          <a href={`tel:+5511973436623`} className="hover:text-white transition-colors">(11) 97343-6623</a>
        </div>
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/9 transition-all shrink-0 mt-0.5">
      <ArrowLeft className="w-4 h-4" />
    </button>
  );
}

function BarberOptionCard({ name, subtitle, photo, selected, onSelect, isAny }: {
  name: string; subtitle: string; photo: string | null; specialty?: string | null;
  selected: boolean; onSelect: () => void; isAny?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`relative flex flex-col items-center p-4 rounded-2xl border transition-all ${
        selected ? "border-gold bg-gold/8 shadow-lg shadow-yellow-900/20" : "border-white/7 bg-white/3 hover:bg-white/5 hover:border-white/12"
      }`}
      data-testid={`barber-${name}`}
    >
      {/* Avatar */}
      <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center mb-2.5 border-2 transition-all shrink-0 ${
        selected ? "border-gold/60" : "border-white/10"
      }`}>
        {isAny ? (
          <div className="w-full h-full bg-accent/10 flex items-center justify-center">
            <Star className={`w-7 h-7 ${selected ? "text-gold" : "text-muted-foreground"}`} />
          </div>
        ) : photo ? (
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center font-display font-bold text-lg ${
            selected ? "bg-gold/20 text-gold" : "bg-white/8 text-muted-foreground"
          }`}>
            {initials(name)}
          </div>
        )}
      </div>
      <p className={`font-semibold text-sm text-center leading-tight ${selected ? "text-white" : "text-muted-foreground"}`}>{name}</p>
      <p className="text-xs text-muted-foreground mt-0.5 text-center leading-tight">{subtitle}</p>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
          <Check className="w-3 h-3 text-black" />
        </div>
      )}
    </motion.button>
  );
}

function SummaryRow({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex justify-between items-center px-5 py-3.5 bg-white/1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`text-sm font-semibold ${gold ? "text-gold" : "text-white"}`}>{value}</span>
    </div>
  );
}
