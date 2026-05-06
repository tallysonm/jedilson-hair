import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { JedilsonLogo } from "@/components/Logo";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("adminToken", data.token);
        setLocation("/admin/dashboard");
      },
      onError: () => {
        toast({ title: "Credenciais inválidas", description: "Verifique usuário e senha.", variant: "destructive" });
      },
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { username, password } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/6 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gold/3 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div className="glass-card rounded-3xl p-8 border border-white/7 shadow-2xl">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-5">
              <JedilsonLogo size="lg" />
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />
            <h1 className="font-display text-xl font-bold text-white tracking-tight">Painel Administrativo</h1>
            <p className="text-muted-foreground text-sm mt-1">Osasco, SP · (11) 97343-6623</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-11 bg-white/5 border-white/8 h-12 rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                data-testid="input-username"
                required
                autoComplete="username"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 bg-white/5 border-white/8 h-12 rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                data-testid="input-password"
                required
                autoComplete="current-password"
              />
            </div>

            <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} className="pt-1">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm glow-accent"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </motion.div>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Acesso restrito à equipe
          </p>
        </div>

        {/* Back to booking link */}
        <div className="text-center mt-5">
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="text-xs text-muted-foreground hover:text-white transition-colors"
          >
            ← Voltar para o agendamento
          </button>
        </div>
      </motion.div>
    </div>
  );
}
