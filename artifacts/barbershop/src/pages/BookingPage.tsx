import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Scissors, MessageCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useListServices,
  useGetAvailableSlots,
  getGetAvailableSlotsQueryKey,
  useCreateAppointment,
} from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [isSuccess, setIsSuccess] = useState(false);

  const { data: services = [] } = useListServices();
  
  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlots(
    { date, serviceId },
    {
      query: {
        enabled: !!date && !!serviceId,
        queryKey: getGetAvailableSlotsQueryKey({ date, serviceId }),
      },
    }
  );

  const createMutation = useCreateAppointment();

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

  const handleBooking = () => {
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
          setIsSuccess(true);
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao agendar", variant: "destructive" });
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
    setIsSuccess(false);
  };

  const serviceName = services.find((s) => s.id === serviceId)?.name || "";
  const servicePrice = services.find((s) => s.id === serviceId)?.priceLabel || "";

  const whatsappMessage = `Novo agendamento:
Cliente: ${name}
Serviço: ${serviceName}
Data: ${date}
Hora: ${time}`;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/barbershop-logo.jpeg" alt="Jedilson Hair" className="w-10 h-10 rounded-full object-cover" />
            <span className="text-white font-bold tracking-tight">Jedilson Hair</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin")} className="border-border text-foreground hover:bg-white/5 rounded-md text-xs font-medium">
            Área do Administrador
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-xl p-8"
              >
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Scissors className="w-6 h-6 text-accent" />
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Agende seu horário</h1>
                  <p className="text-muted-foreground text-sm">Jedilson Hair · Osasco, SP</p>
                </div>

                <div className="space-y-5">
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Serviço</label>
                    <Select value={serviceId} onValueChange={setServiceId}>
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

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                    <Button
                      onClick={handleBooking}
                      disabled={!name || !phone || !serviceId || !date || !time || createMutation.isPending}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-base font-semibold glow-accent rounded-lg"
                      data-testid="button-submit"
                    >
                      {createMutation.isPending ? "Confirmando..." : "Confirmar Agendamento"}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-8 text-center"
              >
                <div className="flex justify-center mb-6">
                  <CheckCircle2 className="w-20 h-20 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
                  Agendamento confirmado com sucesso!
                </h2>

                <div className="glass rounded-lg p-5 mb-8 text-left space-y-3">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-muted-foreground text-sm">Serviço</span>
                    <span className="text-foreground font-medium text-sm">{serviceName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-muted-foreground text-sm">Data</span>
                    <span className="text-foreground font-medium text-sm">{date.split("-").reverse().join("/")}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-muted-foreground text-sm">Horário</span>
                    <span className="text-foreground font-medium text-sm">{time}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground text-sm">Valor</span>
                    <span className="text-gold font-semibold">{servicePrice}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => window.open(`https://wa.me/5511973436623?text=${encodeURIComponent(whatsappMessage)}`)}
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
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
