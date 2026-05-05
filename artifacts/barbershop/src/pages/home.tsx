import React, { useState } from "react";
import { useListServices, useCreateAppointment, useGetAvailableSlots } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Home() {
  const { data: services } = useListServices();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const { data: availableSlots } = useGetAvailableSlots(
    { date: formattedDate, serviceId: selectedService! },
    { query: { enabled: !!selectedService && !!formattedDate } }
  );

  const createAppointment = useCreateAppointment();

  const handleBook = () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      return;
    }
    createAppointment.mutate({
      data: {
        serviceId: selectedService,
        date: formattedDate,
        time: selectedTime,
        clientName,
        clientPhone
      }
    }, {
      onSuccess: () => {
        setStep(5);
      },
      onError: () => {
        toast({ title: "Erro ao agendar", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="w-full h-64 bg-cover bg-center relative" 
        style={{ backgroundImage: "url('/barbershop-logo.jpeg')" }}
      >
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl md:text-5xl font-serif text-white tracking-wider text-center uppercase">Gedilson Rai Barbershop</h1>
          <p className="text-secondary mt-2 font-light">Elegância e Tradição</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-12 px-4">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-primary border-b border-border pb-2">Selecione o Serviço</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {services?.map(service => (
                <Card 
                  key={service.id} 
                  className={`cursor-pointer transition-colors ${selectedService === service.id ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <CardHeader>
                    <CardTitle>{service.name}</CardTitle>
                    <CardDescription>{service.durationLabel}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-secondary">{service.priceLabel}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button disabled={!selectedService} onClick={() => setStep(2)} className="w-full mt-6">Continuar</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-primary border-b border-border pb-2">Selecione a Data</h2>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const day = date.getDay();
                  // Disable Mondays (1) and past dates
                  return day === 1 || date < new Date(new Date().setHours(0, 0, 0, 0));
                }}
                className="bg-card rounded-md border"
                locale={ptBR}
              />
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="w-1/2">Voltar</Button>
              <Button disabled={!selectedDate} onClick={() => setStep(3)} className="w-1/2">Continuar</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-primary border-b border-border pb-2">Selecione o Horário</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {availableSlots?.slots.map(time => (
                <Button 
                  key={time} 
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => setSelectedTime(time)}
                  className="w-full"
                >
                  {time}
                </Button>
              ))}
              {availableSlots?.slots.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-8">Nenhum horário disponível para esta data.</p>
              )}
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)} className="w-1/2">Voltar</Button>
              <Button disabled={!selectedTime} onClick={() => setStep(4)} className="w-1/2">Continuar</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-primary border-b border-border pb-2">Seus Dados</h2>
            <div className="space-y-4 bg-card p-6 rounded-lg border border-border">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Compledo</Label>
                <Input id="name" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="João Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input id="phone" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(3)} className="w-1/2">Voltar</Button>
              <Button disabled={!clientName || !clientPhone || createAppointment.isPending} onClick={handleBook} className="w-1/2">Confirmar Agendamento</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center space-y-6 bg-card p-8 rounded-lg border border-border">
            <div className="w-20 h-20 bg-secondary/20 text-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-serif text-primary">Agendamento Confirmado!</h2>
            <p className="text-muted-foreground">Te esperamos no dia {formattedDate} às {selectedTime}.</p>
            <Button onClick={() => {
              setStep(1);
              setSelectedService(null);
              setSelectedDate(undefined);
              setSelectedTime(null);
              setClientName("");
              setClientPhone("");
            }} className="mt-8">Novo Agendamento</Button>
          </div>
        )}

        <div className="mt-16 text-center text-sm text-muted-foreground space-y-2 border-t border-border pt-8">
          <p className="font-bold text-foreground">Gedilson Rai Barbershop</p>
          <p>R. Mademoiselle - Helena Maria, Osasco - SP, 06253-200</p>
          <p>(11) 97343-6623</p>
          <p className="mt-4">Ter-Sáb 07:00–20:00 | Dom 07:00–14:00 | Seg: Fechado</p>
        </div>
      </div>
    </div>
  );
}
