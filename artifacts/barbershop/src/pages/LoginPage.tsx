import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { JedilsonLogo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage("Não foi possível entrar. Verifique seu e-mail e senha.");
      return;
    }

    setLocation("/minha-conta");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/6 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gold/3 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/7 shadow-2xl">
          <div className="flex flex-col items-center mb-7 text-center">
            <div className="mb-5">
              <JedilsonLogo size="lg" />
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">Área do Cliente</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">
              Acesse sua conta para acompanhar seus agendamentos.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                className="bg-white/5 border-white/8 h-12 rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                data-testid="input-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                className="bg-white/5 border-white/8 h-12 rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                data-testid="input-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {errorMessage ? (
              <p className="text-sm text-red-300" role="alert">{errorMessage}</p>
            ) : null}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm glow-accent"
              data-testid="button-login"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="pt-1 text-right">
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-sm text-muted-foreground hover:text-white"
                onClick={() => setLocation("/esqueci-senha")}
              >
                Esqueci minha senha
              </Button>
            </div>
          </form>

          <div className="mt-7 pt-5 border-t border-white/8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Ainda não possui uma conta?</p>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm text-white hover:text-gold"
              onClick={() => setLocation("/cadastro")}
            >
              Criar conta
            </Button>
          </div>
        </div>

        <div className="text-center mt-5">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-white"
            onClick={() => setLocation("/")}
          >
            Voltar para o agendamento
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
