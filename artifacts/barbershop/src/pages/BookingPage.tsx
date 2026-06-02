import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import {
  MessageCircle, CheckCircle2, RefreshCw,
  CalendarDays, ArrowLeft, Clock, Check, Repeat2,
  ChevronRight, User, Phone, Star, MapPin, Scissors,
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
  useGetSettings,
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
const applyPermanentBlocks=(weekday:string,slots:string[])=>slots.filter(slot=>{if(slot==="08:00")return false;if(["2","3","4","5"].includes(weekday)&&["11:30","12:00","12:30","13:00","13:30"].includes(slot))return false;if(weekday==="6"&&["13:00","13:30"].includes(slot))return false;return true;});
const WEEKDAY_SLOTS:Record<string,string[]>={"0":applyPermanentBlocks("0",generate30minSlots(6.5,21)),"2":applyPermanentBlocks("2",generate30minSlots(6.5,21)),"3":applyPermanentBlocks("3",generate30minSlots(6.5,21)),"4":applyPermanentBlocks("4",generate30minSlots(6.5,21)),"5":applyPermanentBlocks("5",generate30minSlots(6.5,21)),"6":applyPermanentBlocks("6",generate30minSlots(6.5,21))};
function getMaxDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()).toISOString().split("T")[0];
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
const SVC_COLORS = [
  "#2563eb","#C1121F","#7c3aed","#059669","#d97706",
  "#0891b2","#db2777","#4f46e5","#dc2626","#2563eb",
  "#059669","#9333ea","#1d4ed8","#db2777","#2563eb",
];
const FADE_UP = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };
const SLIDE = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 } };

type SuccessData =
  | { type: "single";    serviceName: string; servicePrice: string; serviceDuration: string; date: string; time: string; name: string; barberName: string }
  | { type: "recurring"; created: string[];   skipped: number;     serviceName: string; time: string; name: string };

const FALLBACK_WA = "5511973436623";

function useWaPhone() {
  const { data } = useGetSettings();
  return data?.contactWhatsapp || FALLBACK_WA;
}

/* ════════════════════ Main Page ════════════════════ */
export default function BookingPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const [step, setStep]               = useState(0);
  const [serviceId, setServiceId]     = useState("");
  const [barberId, setBarberId]       = useState("all");

  // Pre-select barber when arriving from /barbeiro/:id
  useEffect(() => {
    const params = new URLSearchParams(search);
    const bid = params.get("barberId");
    if (bid) setBarberId(bid);
  }, [search]);

  const [date, setDate]               = useState("");
  const [time, setTime]               = useState("");
  const [weekday, setWeekday]         = useState("4");
  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"dinheiro" | "pix_cartao">("dinheiro");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const { data: services = [] } = useListServices();
  const { data: barbers  = [] } = useListBarbers({ query: { queryKey: getListBarbersQueryKey() } });
  const activeBarbers = Array.isArray(barbers)
  ? barbers.filter((b) => b.active)
  : []

  const slotParams = { date, serviceId, ...(barberId !== "all" ? { barberId } : {}) };
  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlots(slotParams, {
    query: { enabled: !!date && !!serviceId, queryKey: getGetAvailableSlotsQueryKey(slotParams) },
  });
  const createMutation          = useCreateAppointment();
  const isPending = createMutation.isPending;

  const safeServices = Array.isArray(services) ? services : [];
  console.log("SERVICES:", services, "SAFE:", safeServices);
const selectedService = safeServices.find((s) => s.id === serviceId);
  const selectedBarber  = activeBarbers.find((b) => String(b.id) === barberId);

  const handleDateChange = (v: string) => {
    if (!v) { setDate(""); setTime(""); return; }
    if (v > getMaxDate()) {
      toast({ title: "Data indisponível", description: "Agendamentos disponíveis apenas para os próximos 3 meses.", variant: "destructive" });
      return;
    }
    if (new Date(v + "T12:00:00").getDay() === 1) {
      toast({ title: "Segunda-feira fechado", description: "Escolha outro dia." }); return;
    }
    setDate(v); setTime("");
  };

const handleSingle = () => {
  if (!name || !phone || !serviceId || !date || !time) return;
  if (date < new Date().toISOString().split("T")[0]) {
    toast({
      title: "Data inválida",
      description: "Não é possível agendar em data passada.",
      variant: "destructive",
    });
    return;
  }
    createMutation.mutate(
      { data: { serviceId, date, time, clientName: name, clientPhone: phone, barberId: barberId !== "all" ? barberId : null, paymentMethod, } },
      {
        onSuccess: () => setSuccessData({
          type: "single", serviceName: selectedService?.name || "",
          servicePrice: selectedService?.priceLabel || "",
          serviceDuration: selectedService?.durationLabel || "",
          date, time, name,
          barberName: selectedBarber?.name || "Qualquer disponível",
        }),
        onError: () => toast({ title: "Horário indisponível", description: "Tente outro horário ou data.", variant: "destructive" }),
      }
    );
  };

  const resetForm = () => {
    setStep(0); setServiceId("");
    setBarberId(activeBarbers.length === 1 ? String(activeBarbers[0].id) : "all");
    setIsRecurring(false);
    setDate(""); setTime(""); setWeekday("4");
    setName(""); setPhone(""); setSuccessData(null);
  };

  const waPhone = useWaPhone();
  const waMsg = (msg: string) => `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;

  /* ── SUCCESS ── */
  if (successData) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col">
        <PageHeader onAdminClick={() => setLocation("/admin")} />
        <main className="flex-1 flex items-center justify-center p-5 py-16">
          <AnimatePresence mode="wait">
            {successData.type === "single" ? (
              <motion.div key="ss" {...FADE_UP} className="w-full max-w-sm space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="relative w-24 h-24 rounded-full flex items-center justify-center"
                  >
                    <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20" />
                    <div className="absolute inset-3 rounded-full bg-emerald-500/8" />
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 relative z-10" />
                  </motion.div>
                </div>

                <div className="text-center">
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="text-muted-foreground text-sm mb-1">Tudo certo!</motion.p>
                  <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="font-display text-3xl font-bold text-white">
                    Até logo, {successData.name.split(" ")[0]}!
                  </motion.h2>
                </div>

                {/* Ticket card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="relative rounded-3xl overflow-hidden border border-white/8 bg-white/[0.025]">
                  <div className="h-0.5 bg-gradient-to-r from-accent via-gold to-accent" />
                  {/* Service header */}
                  <div className="px-6 pt-5 pb-4 border-b border-dashed border-white/8 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Serviço</p>
                      <p className="font-display font-bold text-white text-base leading-tight">{successData.serviceName}</p>
                      <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{successData.serviceDuration}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Valor</p>
                      <p className="font-bold text-gold text-2xl leading-none">{successData.servicePrice}</p>
                    </div>
                  </div>
                  {/* Ticket holes */}
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#080808]" />
                  <div className="absolute right-0 top-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-[#080808]" />
                  {/* Details grid */}
                  <div className="grid grid-cols-2 divide-x divide-white/5">
                    {[
                      { label: "Barbeiro", value: successData.barberName },
                      { label: "Data",     value: successData.date.split("-").reverse().join("/") },
                      { label: "Horário",  value: successData.time },
                      { label: "Status",   value: "✓ Confirmado" },
                    ].map((r) => (
                      <div key={r.label} className="px-5 py-4 border-b border-white/5 last:border-0 [&:nth-last-child(-n+2)]:border-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{r.label}</p>
                        <p className={`font-semibold text-sm ${r.label === "Status" ? "text-emerald-400" : "text-white"}`}>{r.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-3">
                  <a href={waMsg(`Olá! Confirmei meu agendamento:\nNome: ${successData.name}\nServiço: ${successData.serviceName}\nData: ${successData.date.split("-").reverse().join("/")}\nHorário: ${successData.time}`)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 font-semibold text-sm hover:bg-emerald-500/22 transition-colors">
                    <MessageCircle className="w-4 h-4" /> Confirmar no WhatsApp
                  </a>
                  <Button onClick={resetForm} variant="outline" className="border-white/10 text-muted-foreground hover:bg-white/5 h-12 rounded-2xl px-5">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div key="sr" {...FADE_UP} className="w-full max-w-sm space-y-4">
                <div className="flex justify-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="relative w-24 h-24 rounded-full flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gold/10 border border-gold/20" />
                    <Star className="w-11 h-11 text-gold relative z-10" fill="currentColor" />
                  </motion.div>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-sm mb-1">Recorrência criada</p>
                  <h2 className="font-display text-3xl font-bold text-white">{successData.created.length} agendamentos!</h2>
                  {successData.skipped > 0 && <p className="text-muted-foreground text-xs mt-1">{successData.skipped} ignorado(s) por conflito</p>}
                </div>
                <div className="rounded-2xl border border-white/7 overflow-hidden max-h-60 overflow-y-auto bg-white/[0.02]">
                  {successData.created.map((d, i) => (
                    <div key={d} className="flex justify-between items-center px-5 py-3.5 border-b border-white/5 last:border-0">
                      <span className="text-white text-sm font-semibold">{d.split("-").reverse().join("/")}</span>
                      <span className="text-gold text-sm font-medium">{successData.time}</span>
                      <span className="text-emerald-400 text-xs">#{i + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button onClick={resetForm} className="flex-1 bg-accent hover:bg-accent/90 text-white h-12 rounded-2xl font-bold"><RefreshCw className="w-4 h-4 mr-2" />Novo agendamento</Button>
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

  const STEPS = ["Serviço", "Barbeiro", "Horário", "Confirmar"];

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <PageHeader onAdminClick={() => setLocation("/admin")} />

      {/* ── Step indicator ── */}
      <div className="sticky top-16 z-40 bg-[#080808]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="relative flex items-start justify-between">
            {/* Track */}
            <div className="absolute left-4 right-4 top-4 h-px bg-white/8" />
            <motion.div
              className="absolute left-4 top-4 h-px bg-gold/50"
              animate={{ width: step === 0 ? "0%" : step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
            {STEPS.map((label, i) => (
              <div key={i} className="relative flex flex-col items-center gap-2 z-10">
                <motion.div
                  animate={{
                    backgroundColor: i < step ? "#C9A84C" : i === step ? "#C1121F" : "#1a1a1a",
                    scale: i === step ? 1.15 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border ${
                    i < step ? "border-gold/40 text-black shadow-lg shadow-yellow-900/30" :
                    i === step ? "border-accent/40 text-white shadow-lg shadow-accent/30" :
                    "border-white/10 text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </motion.div>
                <span className={`text-[10px] font-semibold hidden sm:block transition-colors whitespace-nowrap ${
                  i === step ? "text-white" : i < step ? "text-gold/60" : "text-white/25"
                }`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-start justify-center px-4 pb-28">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">

            {/* ══ STEP 0: SERVICE ══ */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {/* HERO */}
                <div className="relative -mx-4 mb-8 overflow-hidden">
                  {/* Background */}
                  <div className="absolute inset-0" style={{
                    background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(193,18,31,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 15% 10%, rgba(201,168,76,0.07) 0%, transparent 55%), #080808"
                  }} />
                  {/* Diagonal pattern */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: "repeating-linear-gradient(-45deg, rgba(255,255,255,0.012), rgba(255,255,255,0.012) 1px, transparent 1px, transparent 14px)"
                  }} />
                  {/* Top line */}
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,168,76,0.25), transparent)" }} />
                  {/* Bottom line */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5" />

                  {/* Content */}
                  <div className="relative text-center px-6 pt-10 pb-9">
                    {/* Badge */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/6 mb-5">
                      <Scissors className="w-3 h-3 text-gold" />
                      <span className="text-gold text-[10px] font-bold tracking-[0.22em] uppercase">Est. 2020 · Osasco, SP</span>
                    </motion.div>

                    {/* Brand name */}
                    <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="font-display text-[2.6rem] sm:text-5xl font-bold text-white tracking-tight leading-none mb-2">
                      Jedilson Hair
                    </motion.h1>

                    {/* Tagline */}
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                      className="font-display italic text-base text-white/35 mb-6">
                      Barbearia de Alta Performance
                    </motion.p>

                    {/* Gold divider */}
                    <motion.div initial={{ opacity: 0, scaleX: 0.3 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
                      className="flex items-center gap-3 justify-center mb-5">
                      <div className="h-px w-14 sm:w-20" style={{ background: "linear-gradient(to right, transparent, rgba(201,168,76,0.5))" }} />
                      <span className="text-gold text-sm">◆</span>
                      <div className="h-px w-14 sm:w-20" style={{ background: "linear-gradient(to left, transparent, rgba(201,168,76,0.5))" }} />
                    </motion.div>

                    {/* Info */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                      className="flex items-center gap-4 justify-center flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 text-accent/70" />
                        Ter–Sáb 06h30–21h · Dom 06h30–12h30
                      </span>
                      <span className="text-white/10 hidden sm:inline">|</span>
                      <a href="tel:+5511973436623" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
                        <Phone className="w-3 h-3 text-accent/70" />
                        (11) 97343-6623
                      </a>
                    </motion.div>
                  </div>
                </div>

                {/* Section label */}
                <div className="flex items-center gap-3 mb-4 px-1">
                  <div className="h-px flex-1" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.06), transparent)" }} />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Nossos Serviços</p>
                  <div className="h-px flex-1" style={{ background: "linear-gradient(to left, rgba(255,255,255,0.06), transparent)" }} />
                </div>

                {/* Service grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {safeServices.map((s, i) => {
                    const selected = serviceId === s.id;
                    const color = SVC_COLORS[i % SVC_COLORS.length];
                    return (
                      <motion.button
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.025, duration: 0.3 }}
                        whileHover={{ scale: 1.015, y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => {
                          setServiceId(s.id); setTime("");
                          if (activeBarbers.length === 1) {
                            setBarberId(String(activeBarbers[0].id));
                            setStep(2);
                          } else {
                            setStep(1);
                          }
                        }}
                        className={`relative text-left rounded-2xl overflow-hidden border transition-all group ${
                          selected
                            ? "border-gold/30 shadow-lg shadow-yellow-900/15"
                            : "border-white/6 hover:border-white/12"
                        }`}
                        style={{
                          background: selected
                            ? `linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 70%), #0f0f0f`
                            : "#0a0a0a",
                        }}
                        data-testid={`service-${s.id}`}
                      >
                        {/* Color strip */}
                        <div className="absolute left-0 inset-y-0 w-[3px]" style={{ background: `linear-gradient(to bottom, ${color}, ${color}55)` }} />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(255,255,255,0.016)" }} />

                        <div className="pl-4 pr-4 py-4">
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <p className="font-semibold text-[13px] text-white leading-snug flex-1">{s.name}</p>
                            {selected
                              ? <Check className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                              : <ChevronRight className="w-3.5 h-3.5 text-white/15 mt-0.5 shrink-0 group-hover:text-white/35 group-hover:translate-x-0.5 transition-all" />
                            }
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                              selected ? "bg-gold/10 text-gold/75 border-gold/15" : "bg-white/5 text-muted-foreground/70 border-white/6"
                            }`}>
                              <Clock className="w-2.5 h-2.5" />{s.durationLabel}
                            </span>
                            <span className="font-bold text-[15px] text-gold">{s.priceLabel}</span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ══ STEP 1: BARBER ══ */}
            {step === 1 && (
              <motion.div key="s1" {...SLIDE} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }} className="pt-8">
                <div className="flex items-center gap-3 mb-7">
                  <BackButton onClick={() => setStep(0)} />
                  <div>
                    <h1 className="font-display text-2xl font-bold text-white">Escolha o barbeiro</h1>
                    {activeBarbers.length > 1 && (
                      <p className="text-muted-foreground text-sm mt-0.5">Ou deixe-nos escolher para você</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activeBarbers.length > 1 && (
                    <BarberOptionCard
                      name="Qualquer" subtitle="Primeiro disponível"
                      photo={null} selected={barberId === "all"}
                      onSelect={() => { setBarberId("all"); setStep(2); }}
                      isAny
                    />
                  )}
                  {activeBarbers.map((b) => (
                    <BarberOptionCard
                      key={b.id}
                      name={b.name} subtitle={b.specialty ?? "Disponível"}
                      photo={b.photo ?? null} selected={barberId === String(b.id)}
                      onSelect={() => { setBarberId(String(b.id)); setStep(2); }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ STEP 2: DATE / TIME ══ */}
            {step === 2 && (
              <motion.div key="s2" {...SLIDE} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }} className="pt-8">
                <div className="flex items-center gap-3 mb-7">
                  <BackButton onClick={() => setStep(1)} />
                  <div>
                    <h1 className="font-display text-2xl font-bold text-white">Data e horário</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Quando quer ser atendido?</p>
                  </div>
                </div>

                {/* Toggle single / recurring */}

                <AnimatePresence mode="wait">
                    <motion.div key="single" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                      {/* Date picker */}
                      <div className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/6 flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Escolha a data</span>
                        </div>
                        <div className="p-5">
                          {/* Overlay pattern: styled display + invisible native input on top */}
                          <div className="relative">
                            <div className="flex items-center gap-3 py-1 pointer-events-none select-none">
                              <div className="flex-1 min-w-0">
                                {date ? (
                                  <p className="text-white text-2xl font-bold font-display leading-tight">
                                    {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                  </p>
                                ) : (
                                  <p className="text-muted-foreground text-lg">Toque para escolher</p>
                                )}
                              </div>
                              <CalendarDays className="w-6 h-6 text-accent/60 shrink-0" />
                            </div>
                            <input
                              type="date"
                              min={new Date().toISOString().split("T")[0]}
                              max={getMaxDate()}
                              value={date}
                              onChange={(e) => handleDateChange(e.target.value)}
                              data-testid="input-date"
                              style={{ colorScheme: "dark", fontSize: "16px" }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          {date && (
                            <p className="text-muted-foreground text-sm mt-2 capitalize">
                              {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Time slots */}
                      <AnimatePresence>
                        {date && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/6 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Horários disponíveis</span>
                            </div>
                            <div className="p-4">
                              {slotsLoading ? (
                                <div className="grid grid-cols-5 gap-2">
                                  {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />)}
                                </div>
                              ) : (slotsData?.slots ?? []).length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-6">Sem horários disponíveis nesta data.</p>
                              ) : (
                                <div className="grid grid-cols-5 gap-2">
                                  {(slotsData?.slots ?? []).map((slot) => (
                                    <motion.button key={slot}
                                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                      onClick={() => { setTime(slot); setTimeout(() => setStep(3), 320); }}
                                      className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                                        time === slot
                                          ? "bg-accent border-accent text-white shadow-lg shadow-accent/30"
                                          : "bg-white/4 border-white/7 text-muted-foreground hover:bg-white/9 hover:text-white hover:border-white/14"
                                      }`}
                                      data-testid={`slot-${slot}`}
                                    >{slot}</motion.button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div key="recurring" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                      <div className="flex gap-2 px-4 py-3 rounded-xl bg-blue-500/7 border border-blue-500/14">
                        <CalendarDays className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-300/80 leading-relaxed">Agendamentos criados para todos os dias selecionados no período. Conflitos são ignorados automaticamente.</p>
                      </div>

                      {/* Weekday */}
                      <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Dia da semana</p>
                        <div className="flex gap-2 flex-wrap">
                          {WEEKDAYS.map((d) => (
                            <button key={d.value} type="button" onClick={() => { setWeekday(d.value); setTime(""); }}
                              className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all ${
                                weekday === d.value ? "bg-accent border-accent text-white" : "bg-white/4 border-white/7 text-muted-foreground hover:text-white hover:bg-white/8"
                              }`} data-testid="select-weekday">{d.short}</button>
                          ))}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Horário fixo</p>
                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                          {(WEEKDAY_SLOTS[weekday] ?? WEEKDAY_SLOTS["2"]).map((slot) => (
                            <motion.button key={slot} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                              onClick={() => setTime(slot)}
                              className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                                time === slot ? "bg-accent border-accent text-white shadow-lg shadow-accent/30" : "bg-white/4 border-white/7 text-muted-foreground hover:bg-white/9 hover:text-white"
                              }`} data-testid="select-recurring-time">{slot}</motion.button>
                          ))}
                        </div>
                      </div>

                    </motion.div>
                  
                </AnimatePresence>

                {date && time && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                    <PremiumButton onClick={() => setStep(3)} label="Continuar" />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ══ STEP 3: CONFIRM ══ */}
            {step === 3 && (
              <motion.div key="s3" {...SLIDE} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }} className="pt-8">
                <div className="flex items-center gap-3 mb-7">
                  <BackButton onClick={() => setStep(2)} />
                  <div>
                    <h1 className="font-display text-2xl font-bold text-white">Confirmar reserva</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Quase lá — preencha seus dados</p>
                  </div>
                </div>

                {/* Voucher card */}
                <div className="relative rounded-3xl overflow-hidden border border-white/8 bg-white/[0.025] mb-5">
                  <div className="h-0.5" style={{ background: "linear-gradient(to right, #C1121F, #C9A84C, #C1121F)" }} />
                  {/* Ticket holes */}
                  <div className="absolute left-0 top-[48%] -translate-x-1/2 w-5 h-5 rounded-full bg-[#080808] border-r border-white/5" />
                  <div className="absolute right-0 top-[48%] translate-x-1/2 w-5 h-5 rounded-full bg-[#080808] border-l border-white/5" />
                  {/* Service header */}
                  <div className="px-6 pt-5 pb-4 border-b border-dashed border-white/8 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Serviço selecionado</p>
                      <p className="font-display font-bold text-white text-lg leading-tight">{selectedService?.name}</p>
                      <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{selectedService?.durationLabel}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Valor</p>
                      <p className="font-bold text-gold text-2xl leading-none">{selectedService?.priceLabel}</p>
                    </div>
                  </div>
                  {/* Details */}
                  <div className="grid grid-cols-2 divide-x divide-white/5">
                    <div className="px-5 py-4 border-b border-white/5">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Barbeiro</p>
                      <p className="font-semibold text-white text-sm">{selectedBarber?.name ?? "Qualquer disponível"}</p>
                    </div>

                      <>
                        <div className="px-5 py-4 border-b border-white/5">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Data</p>
                          <p className="font-semibold text-white text-sm">{date.split("-").reverse().join("/")}</p>
                        </div>
                        <div className="px-5 py-4 col-span-2">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Horário</p>
                          <p className="font-semibold text-white text-sm">{time}</p>
                        </div>
                      </>
                  </div>
                </div>

                {/* Client form */}
<div className="space-y-3 mb-5">

  <div className="relative">
    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />

    <Input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Nome completo"
      className="h-13 pl-11 rounded-2xl bg-white/[0.035] border-white/8 text-white placeholder:text-muted-foreground/50"
      style={{ height: "52px" }}
      data-testid="input-name"
    />
  </div>

  <div className="relative">
    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />

    <Input
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      placeholder="(11) 99999-9999"
      className="h-13 pl-11 rounded-2xl bg-white/[0.035] border-white/8 text-white placeholder:text-muted-foreground/50"
      style={{ height: "52px" }}
      data-testid="input-phone"
    />
  </div>

<div className="space-y-2">
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
    Pagamento
  </p>

  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
    <button
      type="button"
      onClick={() => setPaymentMethod("dinheiro")}
      className={`h-11 rounded-xl text-sm font-semibold transition-all ${
        paymentMethod === "dinheiro"
          ? "bg-accent text-white shadow-lg"
          : "text-muted-foreground hover:bg-white/[0.05]"
      }`}
    >
      Dinheiro
    </button>

    <button
      type="button"
      onClick={() => setPaymentMethod("pix_cartao")}
      className={`h-11 rounded-xl text-sm font-semibold transition-all ${
        paymentMethod === "pix_cartao"
          ? "bg-accent text-white shadow-lg"
          : "text-muted-foreground hover:bg-white/[0.05]"
      }`}
    >
      Pix/Cartão
    </button>
  </div>
</div>
</div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <PremiumButton
                    onClick={handleSingle}
                    label={isPending ? "Confirmando..." : "Confirmar Agendamento"}
                    disabled={isPending || !name || !phone}
                  />
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

/* ══ Sub-components ══ */

function PageHeader({ onAdminClick }: { onAdminClick: () => void }) {
  const waPhone = useWaPhone();
  return (
    <header className="sticky top-0 z-50 w-full bg-[#080808]/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <JedilsonLogo size="sm" />
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${waPhone}?text=${encodeURIComponent("Olá! Quero agendar um corte.")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border"
            style={{ background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.2)", color: "#4ade80" }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <button onClick={onAdminClick}
            className="text-xs text-muted-foreground hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/7">
            Admin
          </button>
        </div>
      </div>
    </header>
  );
}

function WhatsAppFAB() {
  const waPhone = useWaPhone();
  return (
    <motion.a
      href={`https://wa.me/${waPhone}?text=${encodeURIComponent("Olá! Gostaria de agendar um horário na Jedilson Hair.")}`}
      target="_blank" rel="noopener noreferrer"
      className="fixed bottom-6 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center"
      style={{ background: "#22C55E", boxShadow: "0 4px 28px rgba(34,197,94,0.55)" }}
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
      animate={{
        boxShadow: [
          "0 4px 28px rgba(34,197,94,0.55), 0 0 0 0 rgba(34,197,94,0.3)",
          "0 4px 28px rgba(34,197,94,0.55), 0 0 0 14px rgba(34,197,94,0)",
          "0 4px 28px rgba(34,197,94,0.55), 0 0 0 0 rgba(34,197,94,0)",
        ] as unknown as number
      }}
      transition={{ repeat: Infinity, duration: 2.8, ease: "easeOut" }}
      title="Falar no WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
    </motion.a>
  );
}

function InfoFooter() {
  return (
    <div className="border-t border-white/5 py-5 pb-8" style={{ background: "#060606" }}>
      <div className="max-w-lg mx-auto px-4 flex flex-col sm:flex-row gap-3 sm:gap-6 items-start sm:items-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>R. Mademoiselle - Helena Maria, Osasco - SP</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Ter–Sáb 06h30–21h · Dom 06h30–12h30 · Seg fechado</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
          <a href="tel:+5511973436623" className="hover:text-white transition-colors">(11) 97343-6623</a>
        </div>
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-white transition-all shrink-0 border border-white/8 hover:bg-white/6 hover:border-white/12">
      <ArrowLeft className="w-4 h-4" />
    </button>
  );
}

function PremiumButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="w-full h-13 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden group"
      style={{
        height: "52px",
        background: "linear-gradient(135deg, #a80f1a 0%, #C1121F 50%, #e8171f 100%)",
        boxShadow: disabled ? "none" : "0 4px 24px rgba(193,18,31,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
      data-testid="button-submit"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(255,255,255,0.08)" }} />
      <span className="relative">{label}</span>
    </button>
  );
}

function BarberOptionCard({ name, subtitle, photo, selected, onSelect, isAny }: {
  name: string; subtitle: string; photo: string | null; specialty?: string | null;
  selected: boolean; onSelect: () => void; isAny?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="relative flex flex-col items-center py-6 px-3 rounded-2xl border transition-all overflow-hidden"
      style={{
        border: selected ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.07)",
        background: selected
          ? "linear-gradient(160deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.02) 60%, transparent 100%)"
          : "rgba(255,255,255,0.02)",
        boxShadow: selected ? "0 8px 32px rgba(201,168,76,0.12)" : "none",
      }}
      data-testid={`barber-${name}`}
    >
      {/* Avatar */}
      <div className={`relative w-20 h-20 rounded-full overflow-hidden mb-3 transition-all ${selected ? "ring-2 ring-gold/50 ring-offset-2 ring-offset-[#080808]" : ""}`}>
        {isAny ? (
          <div className="w-full h-full flex items-center justify-center" style={{ background: selected ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.06)" }}>
            <Star className={`w-8 h-8 ${selected ? "text-gold" : "text-muted-foreground"}`} fill={selected ? "currentColor" : "none"} />
          </div>
        ) : photo ? (
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display font-bold text-xl"
            style={{ background: selected ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.07)", color: selected ? "#C9A84C" : "#888" }}>
            {initials(name)}
          </div>
        )}
      </div>

      <p className={`font-display font-semibold text-sm text-center leading-tight mb-1 ${selected ? "text-white" : "text-white/75"}`}>{name}</p>
      <p className={`text-[11px] text-center leading-tight ${selected ? "text-gold/70" : "text-muted-foreground"}`}>{subtitle}</p>

      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
          <Check className="w-3 h-3 text-black" />
        </motion.div>
      )}
    </motion.button>
  );
}
