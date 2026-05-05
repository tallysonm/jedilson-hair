import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  useGetDashboardSummary, 
  useListAppointments, 
  useUpdateAppointment, 
  useDeleteAppointment,
  useGetRevenueChart,
  useListServices,
  useGetAvailableSlots,
  useCreateAppointment
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: appointments, refetch: refetchAppointments, isLoading: loadingAppointments } = useListAppointments();
  const { data: chartData, isLoading: loadingChart } = useGetRevenueChart();
  const { data: services } = useListServices();
  
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const createAppointment = useCreateAppointment();

  const handleStatusChange = (id: number, status: "pending" | "completed" | "cancelled") => {
    updateAppointment.mutate({ id, data: { status } }, {
      onSuccess: () => {
        refetchAppointments();
        toast({ title: "Status atualizado" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir?")) {
      deleteAppointment.mutate({ id }, {
        onSuccess: () => {
          refetchAppointments();
          toast({ title: "Agendamento excluído" });
        }
      });
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/admin");
  };

  // Form states for new appointment
  const [newService, setNewService] = useState<string>("");
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const formattedDate = newDate ? format(newDate, "yyyy-MM-dd") : "";
  const { data: availableSlots } = useGetAvailableSlots(
    { date: formattedDate, serviceId: newService },
    { query: { enabled: !!newService && !!formattedDate } }
  );

  const handleCreateNew = () => {
    if (!newService || !newDate || !newTime || !newName || !newPhone) return;
    createAppointment.mutate({
      data: {
        serviceId: newService,
        date: formattedDate,
        time: newTime,
        clientName: newName,
        clientPhone: newPhone
      }
    }, {
      onSuccess: () => {
        toast({ title: "Agendamento criado" });
        refetchAppointments();
        setNewService("");
        setNewDate(undefined);
        setNewTime("");
        setNewName("");
        setNewPhone("");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <h1 className="text-3xl font-serif text-primary tracking-wider uppercase">Painel de Controle</h1>
          <Button variant="outline" onClick={logout}>Sair</Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            <TabsTrigger value="new">Novo Agendamento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {loadingSummary ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
              ) : (
                <>
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Receita Hoje</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-serif text-secondary">R$ {summary?.todayRevenue?.toFixed(2) || "0.00"}</div></CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Receita Mês</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-serif text-secondary">R$ {summary?.monthRevenue?.toFixed(2) || "0.00"}</div></CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Agendamentos Hoje</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-serif text-primary">{summary?.todayAppointments || 0}</div></CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Pendentes</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-serif text-primary">{summary?.pendingAppointments || 0}</div></CardContent>
                  </Card>
                </>
              )}
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Receita (Últimos 30 Dias)</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {loadingChart ? <Skeleton className="w-full h-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Todos os Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments?.map(apt => (
                        <TableRow key={apt.id}>
                          <TableCell className="font-medium">{apt.date} às {apt.time}</TableCell>
                          <TableCell>
                            <div>{apt.clientName}</div>
                            <div className="text-xs text-muted-foreground">{apt.clientPhone}</div>
                          </TableCell>
                          <TableCell>{apt.serviceName}</TableCell>
                          <TableCell>
                            <Badge variant={apt.status === "completed" ? "default" : apt.status === "pending" ? "outline" : "destructive"}
                              className={apt.status === "completed" ? "bg-emerald-700 hover:bg-emerald-800" : ""}
                            >
                              {apt.status === "completed" ? "Concluído" : apt.status === "pending" ? "Pendente" : "Cancelado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {apt.status === "pending" && (
                              <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-700 hover:bg-emerald-700/10" onClick={() => handleStatusChange(apt.id, "completed")}>Concluir</Button>
                            )}
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(apt.id)}>Excluir</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!appointments?.length && (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum agendamento encontrado.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new" className="space-y-6">
            <Card className="bg-card border-border max-w-2xl">
              <CardHeader>
                <CardTitle>Criar Novo Agendamento</CardTitle>
                <CardDescription>Adicionar manualmente um cliente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Serviço</Label>
                  <Select value={newService} onValueChange={setNewService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} - {s.priceLabel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newService && (
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Calendar
                      mode="single"
                      selected={newDate}
                      onSelect={setNewDate}
                      disabled={(date) => {
                        const day = date.getDay();
                        return day === 1 || date < new Date(new Date().setHours(0, 0, 0, 0));
                      }}
                      className="border rounded-md inline-block bg-background"
                      locale={ptBR}
                    />
                  </div>
                )}

                {newDate && (
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots?.slots.map(t => (
                        <Button 
                          key={t} 
                          variant={newTime === t ? "default" : "outline"} 
                          onClick={() => setNewTime(t)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {newTime && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <Label>Nome do Cliente</Label>
                      <Input value={newName} onChange={e => setNewName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                    </div>
                    <Button 
                      className="w-full" 
                      disabled={!newName || !newPhone || createAppointment.isPending}
                      onClick={handleCreateNew}
                    >
                      Confirmar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
