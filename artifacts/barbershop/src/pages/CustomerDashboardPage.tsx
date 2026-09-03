import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { JedilsonLogo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

type ClientProfile = {
  id: string;
  auth_user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean | null;
};

type CustomerAppointment = {
  id: number;
  serviceName: string;
  servicePrice: number;
  barberId: string | null;
  barberName: string | null;
  date: string;
  time: string;
  status: "pending" | "completed" | "cancelled";
  paymentMethod: string | null;
  isRecurring: boolean;
};

export default function CustomerDashboardPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [appointmentsError, setAppointmentsError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");

  const handleLogout = async () => {
    setLogoutError("");
    setIsLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    setIsLoggingOut(false);

    if (error) {
      setLogoutError("Não foi possível sair. Tente novamente.");
      return;
    }

    setLocation("/login");
  };

  const openCancelDialog = (appointmentId: number) => {
    setCancelMessage("");
    setCancelTargetId(appointmentId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;

    setIsCancelling(true);
    setCancelMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setCancelMessage("Não foi possível cancelar o agendamento. Tente novamente.");
        setIsCancelling(false);
        return;
      }

      const response = await fetch(`/api/customer/appointments/${cancelTargetId}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        const backendError = typeof data?.error === "string" ? data.error : "";

        if (backendError.includes("30 minutos antes do horário")) {
          setCancelMessage(backendError);
        } else {
          setCancelMessage("Não foi possível cancelar o agendamento. Tente novamente.");
        }

        setIsCancelling(false);
        return;
      }

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === cancelTargetId
            ? { ...appointment, status: "cancelled" }
            : appointment,
        ),
      );
      setCancelDialogOpen(false);
      setCancelTargetId(null);
      setCancelMessage("Agendamento cancelado com sucesso.");
    } catch {
      setCancelMessage("Não foi possível cancelar o agendamento. Tente novamente.");
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage("");

      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (authError || !authData.user) {
        setLocation("/login");
        return;
      }

      setAppointments([]);
      setAppointmentsError(false);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        if (isMounted) {
          setErrorMessage("Erro ao validar autenticação.");
          setAppointmentsError(true);
        }
      } else {
        try {
          const backendResponse = await fetch("/api/customer/me", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!backendResponse.ok) {
            throw new Error("Backend auth validation failed");
          }

          await backendResponse.json();
        } catch {
          if (isMounted) {
            setErrorMessage("Erro ao validar autenticação.");
          }
        }

        try {
          const appointmentsResponse = await fetch("/api/customer/appointments", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!appointmentsResponse.ok) {
            throw new Error("Appointments fetch failed");
          }

          const appointmentsData = (await appointmentsResponse.json()) as CustomerAppointment[];

          if (isMounted) {
            setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
          }
        } catch {
          if (isMounted) {
            setAppointmentsError(true);
          }
        }
      }

      const { data, error } = await supabase
        .from("clients")
        .select("id, auth_user_id, name, email, phone, is_active")
        .eq("auth_user_id", authData.user.id)
        .single();

      if (!isMounted) return;

      if (error) {
        setErrorMessage("Erro ao carregar perfil.");
        setIsLoading(false);
        return;
      }

      setProfile(data as ClientProfile);
      setIsLoading(false);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-base">Carregando...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-base text-red-400">{errorMessage}</p>
      </div>
    );
  }

  const formatDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return value;
    return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const statusLabel = (status: CustomerAppointment["status"]) => {
    if (status === "completed") return "Concluído";
    if (status === "cancelled") return "Cancelado";
    return "Agendado";
  };

  const statusColor = (status: CustomerAppointment["status"]) => {
    if (status === "completed") return "text-emerald-400";
    if (status === "cancelled") return "text-red-400";
    return "text-gold";
  };

  const now = new Date();
  const pendingFuture = appointments
    .filter((appointment) => appointment.status === "pending")
    .filter((appointment) => new Date(`${appointment.date}T${appointment.time}:00`) >= now)
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}:00`).getTime() - new Date(`${b.date}T${b.time}:00`).getTime(),
    );

  const nextAppointment = pendingFuture[0] ?? null;

  const upcomingAppointments = pendingFuture.filter(
    (appointment) => appointment.id !== nextAppointment?.id,
  );

  const historyAppointments = appointments
    .filter((appointment) => {
      const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}:00`);
      const isPast = appointmentDateTime < now;

      if (appointment.status === "completed" || appointment.status === "cancelled") {
        return true;
      }

      return isPast;
    })
    .sort(
      (a, b) =>
        new Date(`${b.date}T${b.time}:00`).getTime() - new Date(`${a.date}T${a.time}:00`).getTime(),
    );

  const firstName = profile?.name?.trim().split(" ")[0] ?? "Cliente";

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 font-sans">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/6 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-gold/3 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-6xl mx-auto space-y-5">
        <section className="glass-card rounded-3xl p-5 sm:p-7 border border-white/7 shadow-2xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 min-w-0">
              <JedilsonLogo size="md" />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Minha conta</p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight mt-1">
                  Olá, {firstName}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Gerencie seus agendamentos e acompanhe seu histórico.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 px-5 rounded-xl border-white/15 text-white/90 bg-white/5 hover:bg-white/10"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Saindo..." : "Sair"}
            </Button>
          </div>
          {logoutError ? (
            <p className="text-xs text-red-400 mt-3">{logoutError}</p>
          ) : null}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <section className="xl:col-span-2 glass-card rounded-3xl p-5 sm:p-7 border border-white/7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">Próximo agendamento</h2>
              <Button
                type="button"
                className="h-10 px-4 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold"
                onClick={() => setLocation("/")}
              >
                Novo agendamento
              </Button>
            </div>

            {nextAppointment ? (
              <div className="rounded-2xl border border-gold/25 bg-gold/5 p-4 sm:p-5 space-y-3">
                <p className="font-display text-lg font-bold text-white leading-tight">
                  {nextAppointment.serviceName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Barbeiro: {nextAppointment.barberName ?? "Profissional não informado"}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <p className="text-white/90">Data: {formatDate(nextAppointment.date)}</p>
                  <p className="text-white/90">Horário: {nextAppointment.time}</p>
                  <p className="text-white/90">Valor: {formatCurrency(nextAppointment.servicePrice)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                    Agendado
                  </span>
                  {nextAppointment.paymentMethod ? (
                    <span className="text-muted-foreground">
                      Pagamento: {nextAppointment.paymentMethod}
                    </span>
                  ) : null}
                </div>
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-4 rounded-xl border-red-500/30 text-red-300 hover:bg-red-500/10"
                    onClick={() => openCancelDialog(nextAppointment.id)}
                    disabled={isCancelling}
                  >
                    Cancelar agendamento
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">Você não possui próximo horário marcado no momento.</p>
              </div>
            )}

            {cancelMessage ? (
              <p className={`text-sm ${cancelMessage.includes("sucesso") ? "text-emerald-400" : "text-red-400"}`}>
                {cancelMessage}
              </p>
            ) : null}

            <div className="pt-2 space-y-3">
              <h3 className="font-display text-lg sm:text-xl font-bold text-white">Agendamentos futuros</h3>

              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum outro agendamento futuro.</p>
              ) : (
                <div className="space-y-2.5">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{appointment.serviceName}</p>
                        <p className="text-sm font-semibold text-gold">Agendado</p>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Barbeiro: {appointment.barberName ?? "Profissional não informado"}
                      </p>
                      <p className="text-xs sm:text-sm text-white/90 mt-2">
                        {formatDate(appointment.date)} | {appointment.time} | {formatCurrency(appointment.servicePrice)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 space-y-3">
              <h3 className="font-display text-lg sm:text-xl font-bold text-white">Histórico de agendamentos</h3>

              {appointmentsError ? (
                <p className="text-sm text-red-400">Erro ao carregar agendamentos.</p>
              ) : historyAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado.</p>
              ) : (
                <div className="space-y-2.5">
                  {historyAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{appointment.serviceName}</p>
                        <p className={`text-sm font-semibold ${statusColor(appointment.status)}`}>
                          {statusLabel(appointment.status)}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {appointment.barberName ?? "Profissional não informado"}
                      </p>
                      <p className="text-xs sm:text-sm text-white/90 mt-2">
                        {formatDate(appointment.date)} | {appointment.time} | {formatCurrency(appointment.servicePrice)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="glass-card rounded-3xl p-5 sm:p-7 border border-white/7 shadow-2xl h-fit">
            <h2 className="font-display text-xl font-bold text-white mb-4">Meus dados</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nome</p>
                <p className="text-white mt-1 break-words">{profile?.name ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">E-mail</p>
                <p className="text-white mt-1 break-all">{profile?.email ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="text-white mt-1 break-words">{profile?.phone ?? "-"}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={(open) => !isCancelling && setCancelDialogOpen(open)}>
        <DialogContent className="bg-[#0f0f0f] border border-white/8 sm:max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-white font-bold">Confirmar cancelamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-white">Tem certeza que deseja cancelar este agendamento?</p>
            <p className="text-xs text-muted-foreground">
              O cancelamento pode ser realizado pelo site até 30 minutos antes do horário marcado.
            </p>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 hover:bg-white/5 rounded-xl"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Voltar
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-600/90 text-white rounded-xl"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
