import { useState } from "react";
import { useLocation } from "wouter";
import { Scissors, MessageCircle, CheckCircle2, RefreshCw, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useListServices,
  useGetAvailableSlots,
  getGetAvailableSlotsQueryKey,
  useCreateAppointment,
  useCreateRecurringAppointments,
} from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

const WEEKDAYS = [
  { value: "0", label: "Domingo" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
];

const PERIOD_OPTIONS = [
  { value: "this_month", label: "Este mês" },
  { value: "next_2_months", label: "Próximos 2 meses" },
];

type SuccessData =
  | { type: "single"; serviceName: string; servicePrice: string; date: string; time: string; name: string }
  | { type: "recurring"; created: string[]; skipped: number; serviceName: string; time: string; name: string; groupId: string };

export default function BookingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [weekday, setWeekday] = useState("4");
  const [period, setPeriod] = useState<"this_month" | "next_2_months">("this_month");

  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const { data: services = [] } = useListServices();

  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlots(
    { date, serviceId },
    {
      query: {
        enabled: !isRecurring && !!date && !!serviceId,
        queryKey: getGetAvailableSlotsQueryKey({ date, serviceId }),
      },
    }
  );

  const createMutation = useCreateAppointment();
  const createRecurringMutation = useCreateRecurringAppointments();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      const dayOfWeek = new Date(selectedDate).getUTCDay();
      if (dayOfWeek === 1) {
        toast({ title: "Aviso", description: "Segunda-feira fechado" });
        setDate("");
        return;
      }
    }
    setDate(selectedDate);
    setTime("");
  };

  const handleSingleBooking = () => {
    if (!name || !phone || !serviceId || !date || !time) return;
    const service = services.find((s) => s.id === serviceId);
    createMutation.mutate(
      { data: { serviceId, date, time, clientName: name, clientPhone: phone } },
      {
        onSuccess: () => {
          setSuccessData({
            type: "single",
            serviceName: service?.name || "",
            servicePrice: service?.priceLabel || "",
            date,
            time,
            name,
          });
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao agendar. Tente outro horário.", variant: "destructive" });
        },
      }
    );
  };

  const handleRecurringBooking = () => {
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
        },
      },
      {
        onSuccess: (result) => {
          if (result.created.length === 0) {
            toast({
              title: "Nenhum horário disponível",
              description: "Todas as datas do período selecionado já estão ocupadas.",
              variant: "destructive",
            });
            return;
          }
          setSuccessData({
            type: "recurring",
            created: result.created.map((a) => a.date),
            skipped: result.skipped.length,
            serviceName: service?.name || "",
            time,
            name,
            groupId: result.groupId,
          });
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao criar agendamentos recorrentes.", variant: "destructive" });
        },
      }
    );
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setServiceId("");
    setDate("");
    setTime("");
    setIsRecurring(false);
    setWeekday("4");
    setPeriod("this_month");
    setSuccessData(null);
  };

  const singleWhatsApp = () => {
    if (!successData || successData.type !== "single") return;
    const msg = `Novo agendamento:\nCliente: ${successData.name}\nServiço: ${successData.serviceName}\nData: ${successData.date.split("-").reverse().join("/")}\nHora: ${successData.time}`;
    window.open(`https://wa.me/5511973436623?text=${encodeURIComponent(msg)}`);
  };

  const recurringWhatsApp = () => {
    if (!successData || successData.type !== "recurring") return;
    const dates = successData.created.map((d) => d.split("-").reverse().join("/")).join(", ");
    const msg = `Agendamentos recorrentes:\nCliente: ${successData.name}\nServiço: ${successData.serviceName}\nHorário: ${successData.time}\nDatas: ${dates}`;
    window.open(`https://wa.me/5511973436623?text=${encodeURIComponent(msg)}`);
  };

  const isPending = createMutation.isPending || createRecurringMutation.isPending;
  const canSubmitSingle = !isRecurring && !!name && !!phone && !!serviceId && !!date && !!time;
  const canSubmitRecurring = isRecurring && !!name && !!phone && !!serviceId && !!time;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/barbershop-logo.jpeg" alt="Jedilson Hair" className="w-10 h-10 rounded-full object-cover" />
            <span className="text-white font-bold tracking-tight">Jedilson Hair</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/admin")}
            className="border-border text-foreground hover:bg-white/5 rounded-md text-xs font-medium"
          >
            Área do Administrador
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!successData ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-xl p-8"
              >
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Scissors className="w-6 h-6 text-accent" />
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Agende seu horário</h1>
                  <p className="text-muted-foreground text-sm">Jedilson Hair · Osasco, SP</p>
                </div>

                <div className="space-y-5">
                  {/* Nome */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <Input
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-input border-border h-12"
                      data-testid="input-name"
                    />
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Telefone</label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-input border-border h-12"
                      data-testid="input-phone"
                    />
                  </div>

                  {/* Serviço */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Serviço</label>
                    <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setTime(""); }}>
                      <SelectTrigger className="bg-input border-border h-12" data-testid="select-service">
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

                  {/* Recurring toggle */}
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
                          data-testid={`toggle-recurring-${opt.value}`}
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
                        {/* Data */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Data</label>
                          <Input
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            value={date}
                            onChange={handleDateChange}
                            className="bg-input border-border h-12"
                            data-testid="input-date"
                          />
                        </div>

                        {/* Horário */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Horário</label>
                          <Select disabled={!date || !serviceId} value={time} onValueChange={setTime}>
                            <SelectTrigger className="bg-input border-border h-12" data-testid="select-time">
                              <SelectValue
                                placeholder={
                                  !date || !serviceId
                                    ? "Selecione data e serviço primeiro"
                                    : slotsLoading
                                    ? "Carregando..."
                                    : "Selecione o horário"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {slotsData?.slots?.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  Sem horários disponíveis
                                </SelectItem>
                              ) : (
                                slotsData?.slots?.map((slot) => (
                                  <SelectItem key={slot} value={slot}>
                                    {slot}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
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
                        {/* Recurring info banner */}
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <CalendarDays className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-blue-300 leading-relaxed">
                            Serão criados agendamentos para todos os dias da semana selecionados no período escolhido. Datas com conflito serão ignoradas automaticamente.
                          </p>
                        </div>

                        {/* Dia da semana */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Dia da semana</label>
                          <Select value={weekday} onValueChange={setWeekday}>
                            <SelectTrigger className="bg-input border-border h-12" data-testid="select-weekday">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {WEEKDAYS.map((d) => (
                                <SelectItem key={d.value} value={d.value}>
                                  {d.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Horário */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Horário fixo</label>
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            min="07:00"
                            max="19:30"
                            className="bg-input border-border h-12"
                            data-testid="input-recurring-time"
                          />
                        </div>

                        {/* Período */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Período</label>
                          <div className="flex gap-2">
                            {PERIOD_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setPeriod(opt.value as typeof period)}
                                className={`flex-1 h-10 rounded-lg text-xs font-medium border transition-all ${
                                  period === opt.value
                                    ? "bg-accent/15 border-accent text-accent"
                                    : "bg-input border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
                                }`}
                                data-testid={`period-${opt.value}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                    <Button
                      onClick={isRecurring ? handleRecurringBooking : handleSingleBooking}
                      disabled={isPending || (!canSubmitSingle && !canSubmitRecurring)}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-base font-semibold glow-accent rounded-lg"
                      data-testid="button-submit"
                    >
                      {isPending
                        ? "Confirmando..."
                        : isRecurring
                        ? "Criar Agendamentos Recorrentes"
                        : "Confirmar Agendamento"}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ) : successData.type === "single" ? (
              /* ── Single success ── */
              <motion.div
                key="success-single"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-8 text-center"
              >
                <div className="flex justify-center mb-6">
                  <CheckCircle2 className="w-20 h-20 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
                  Agendamento confirmado!
                </h2>
                <div className="glass rounded-lg p-5 mb-8 text-left space-y-3">
                  {[
                    { label: "Serviço", value: successData.serviceName },
                    { label: "Data", value: successData.date.split("-").reverse().join("/") },
                    { label: "Horário", value: successData.time },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground text-sm">{row.label}</span>
                      <span className="text-foreground font-medium text-sm">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground text-sm">Valor</span>
                    <span className="text-gold font-semibold">{successData.servicePrice}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={singleWhatsApp}
                    className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-medium h-11 rounded-lg"
                    data-testid="button-whatsapp"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-white/5 h-11 rounded-lg font-medium"
                    data-testid="button-new-booking"
                  >
                    Novo Agendamento
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* ── Recurring success ── */
              <motion.div
                key="success-recurring"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-8 text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <RefreshCw className="w-10 h-10 text-blue-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                  {successData.created.length} agendamento{successData.created.length !== 1 ? "s" : ""} criado{successData.created.length !== 1 ? "s" : ""}!
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {successData.serviceName} · {successData.time}
                  {successData.skipped > 0 && (
                    <span className="block mt-1 text-yellow-500/70">
                      {successData.skipped} data{successData.skipped !== 1 ? "s" : ""} com conflito ignorada{successData.skipped !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                <div className="glass rounded-lg p-4 mb-6 text-left max-h-48 overflow-y-auto">
                  <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">Datas confirmadas</p>
                  <div className="space-y-1.5">
                    {successData.created.map((d) => (
                      <div key={d} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className="text-sm text-foreground">{d.split("-").reverse().join("/")} às {successData.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={recurringWhatsApp}
                    className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-medium h-11 rounded-lg"
                    data-testid="button-whatsapp-recurring"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-white/5 h-11 rounded-lg font-medium"
                    data-testid="button-new-booking"
                  >
                    Novo Agendamento
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
