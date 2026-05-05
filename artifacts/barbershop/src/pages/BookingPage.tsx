import { useState } from "react";
import { MapPin, Phone, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useListServices,
  useGetAvailableSlots,
  getGetAvailableSlotsQueryKey,
  useCreateAppointment,
} from "@workspace/api-client-react";
import { format, addDays, isMonday, startOfDay, isSunday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const { data: services = [], isLoading: loadingServices } = useListServices();

  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const { data: slotsData, isLoading: loadingSlots } = useGetAvailableSlots(
    { date: formattedDate, serviceId: selectedServiceId ?? "" },
    {
      query: {
        enabled: !!formattedDate && !!selectedServiceId,
        queryKey: getGetAvailableSlotsQueryKey({ date: formattedDate, serviceId: selectedServiceId ?? "" }),
      },
    }
  );

  const createMutation = useCreateAppointment({
    mutation: {
      onSuccess: () => setStep(5),
    },
  });

  const handleBooking = () => {
    if (!selectedServiceId || !selectedDate || !selectedTime || !clientName || !clientPhone) return;
    createMutation.mutate({
      data: {
        serviceId: selectedServiceId,
        date: formattedDate,
        time: selectedTime,
        clientName,
        clientPhone,
      },
    });
  };

  const selectedServiceObj = services.find((s) => s.id === selectedServiceId);
  const availableSlots = slotsData?.slots ?? [];

  const resetBooking = () => {
    setStep(1);
    setSelectedServiceId(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setClientName("");
    setClientPhone("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: 'url("/barbershop-logo.jpeg")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-[#0A0A0A]/95 z-10" />

        <div className="relative z-20 text-center px-4 flex flex-col items-center">
          <span className="text-gold tracking-[0.3em] text-[12px] font-bold mb-6">JEDILSON HAIR</span>
          <h1 className="text-white font-bold text-4xl md:text-6xl mb-4 max-w-4xl leading-tight">
            Gedilson Rai Barbershop
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-10">
            Agende seu horário com facilidade
          </p>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg font-medium shadow-[0_0_20px_rgba(193,18,31,0.3)] transition-all hover:scale-105"
            onClick={() => document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" })}
            data-testid="button-scroll-booking"
          >
            Agendar Agora
          </Button>
        </div>
      </section>

      {/* Info Bar */}
      <section className="max-w-5xl mx-auto px-4 -mt-16 relative z-30 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: MapPin, title: "Endereço", desc: "R. Mademoiselle - Helena Maria, Osasco - SP" },
            { icon: Phone, title: "Contato", desc: "(11) 97343-6623" },
            { icon: Clock, title: "Horário", desc: "Ter-Sáb: 07:00–20:00 | Dom: 07:00–14:00 | Seg: Fechado" },
          ].map((info, i) => (
            <div key={i} className="glass-card p-6 flex flex-col items-center text-center hover-glow">
              <info.icon className="w-8 h-8 text-gold mb-3" />
              <h3 className="font-semibold text-foreground">{info.title}</h3>
              <p className="text-muted-foreground text-sm mt-1">{info.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking-section" className="max-w-4xl mx-auto px-4 pb-24">
        {/* Step Progress */}
        <div className="flex justify-between items-center mb-12 relative">
          <div className="absolute left-0 top-1/2 w-full h-[1px] bg-border -z-10" />
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors ${
                s === step
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(193,18,31,0.5)]"
                  : s < step
                  ? "bg-primary/50 text-white"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="glass-card p-6 md:p-10">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Selecione o Serviço</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {loadingServices ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-5 rounded-[16px] border border-border bg-card animate-pulse h-28" />
                  ))
                ) : (
                  services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => { setSelectedServiceId(service.id); setStep(2); }}
                      className={`p-5 rounded-[16px] border cursor-pointer transition-all hover-glow ${
                        selectedServiceId === service.id
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(193,18,31,0.2)]"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                      data-testid={`service-card-${service.id}`}
                    >
                      <h3 className="font-bold text-foreground mb-1 text-sm">{service.name}</h3>
                      <p className="text-muted-foreground text-xs mb-3">{service.durationLabel}</p>
                      <p className="text-gold font-bold">{service.priceLabel}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2: Date Selection */}
          {step === 2 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Selecione a Data</h2>
                <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground">
                  Voltar
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {Array.from({ length: 14 }).map((_, i) => {
                  const date = addDays(startOfDay(new Date()), i);
                  const disabled = isMonday(date);
                  const isWeekend = isSunday(date);
                  const isSelected = selectedDate?.getTime() === date.getTime();

                  return (
                    <button
                      key={i}
                      disabled={disabled}
                      onClick={() => { setSelectedDate(date); setStep(3); }}
                      data-testid={`date-btn-${i}`}
                      className={`p-4 rounded-[12px] flex flex-col items-center justify-center transition-all ${
                        disabled
                          ? "opacity-30 cursor-not-allowed bg-card border border-border"
                          : isSelected
                          ? "bg-primary text-white shadow-[0_0_15px_rgba(193,18,31,0.4)] border-primary"
                          : "bg-card border border-border hover:border-primary/50 hover-glow"
                      }`}
                    >
                      <span className={`text-xs mb-1 ${isWeekend && !isSelected && !disabled ? "text-gold" : ""}`}>
                        {format(date, "EEE", { locale: ptBR })}
                      </span>
                      <span className="text-xl font-bold">{format(date, "dd")}</span>
                      <span className="text-xs opacity-70">{format(date, "MMM", { locale: ptBR })}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Time Slot Selection */}
          {step === 3 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Selecione o Horário</h2>
                <Button variant="ghost" onClick={() => setStep(2)} className="text-muted-foreground">
                  Voltar
                </Button>
              </div>

              {loadingSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="py-3 rounded-[12px] bg-card animate-pulse h-10" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  Nenhum horário disponível nesta data.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => { setSelectedTime(time); setStep(4); }}
                      data-testid={`time-slot-${time}`}
                      className={`py-3 rounded-[12px] font-medium transition-all text-sm ${
                        selectedTime === time
                          ? "bg-primary text-white shadow-[0_0_15px_rgba(193,18,31,0.4)]"
                          : "bg-card border border-border text-foreground hover:border-primary/50 hover-glow"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Client Info */}
          {step === 4 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Seus Dados</h2>
                <Button variant="ghost" onClick={() => setStep(3)} className="text-muted-foreground">
                  Voltar
                </Button>
              </div>
              <div className="space-y-4 max-w-md mx-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome Completo</label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-input border-border focus:border-primary rounded-[8px] h-12"
                    placeholder="Seu nome completo"
                    data-testid="input-client-name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Telefone (WhatsApp)</label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="bg-input border-border focus:border-primary rounded-[8px] h-12"
                    placeholder="(11) 99999-9999"
                    data-testid="input-client-phone"
                  />
                </div>
                <div className="pt-4">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-[12px] h-12 text-lg font-medium"
                    onClick={handleBooking}
                    disabled={!clientName || !clientPhone || createMutation.isPending}
                    data-testid="button-confirm-booking"
                  >
                    {createMutation.isPending ? "Confirmando..." : "Confirmar Agendamento"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="text-center py-10">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-foreground mb-2">Agendamento Confirmado!</h2>
              <p className="text-muted-foreground mb-8">Te esperamos na barbearia.</p>

              <div className="glass-card p-6 max-w-sm mx-auto mb-8 text-left space-y-3">
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Serviço</span>
                  <span className="font-bold text-foreground text-sm text-right max-w-[180px]">{selectedServiceObj?.name}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-bold text-foreground">{formattedDate}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-bold text-foreground">{selectedTime}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-bold text-gold">{selectedServiceObj?.priceLabel}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-white/5 rounded-[12px]"
                onClick={resetBooking}
                data-testid="button-new-booking"
              >
                Novo Agendamento
              </Button>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-muted-foreground text-sm">
        <p className="font-bold text-foreground mb-2">Gedilson Rai Barbershop</p>
        <p>R. Mademoiselle - Helena Maria, Osasco - SP, 06253-200</p>
        <p className="mt-1">(11) 97343-6623</p>
      </footer>
    </div>
  );
}
