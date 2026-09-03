import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { JedilsonLogo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasRecoveryAccess, setHasRecoveryAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const applyRecoveryState = (sessionExists: boolean) => {
      if (!isMounted) {
        return;
      }

      setHasRecoveryAccess(sessionExists);
    };

    const validateRecoverySession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        applyRecoveryState(false);
        return;
      }

      applyRecoveryState(Boolean(data.session));
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        applyRecoveryState(Boolean(session));
      }
    });

    validateRecoverySession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading || !hasRecoveryAccess) {
      return;
    }

    setErrorMessage("");

    if (!password || !confirmPassword) {
      setErrorMessage("Preencha os dois campos de senha.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setIsLoading(false);
      setErrorMessage("Não foi possível redefinir sua senha. Tente novamente.");
      return;
    }

    await supabase.auth.signOut();
    setIsLoading(false);
    setLocation("/login");
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
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">Criar nova senha</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">
              Digite sua nova senha para recuperar o acesso à sua conta.
            </p>
          </div>

          {hasRecoveryAccess === false ? (
            <div className="space-y-6">
              <p className="text-sm text-red-300" role="alert">
                Este link de recuperação é inválido ou expirou. Solicite um novo link.
              </p>

              <Button
                type="button"
                className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm glow-accent"
                onClick={() => setLocation("/esqueci-senha")}
              >
                Voltar para recuperar senha
              </Button>
            </div>
          ) : hasRecoveryAccess === null ? (
            <p className="text-sm text-muted-foreground text-center">Validando link de recuperação...</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  autoComplete="new-password"
                  className="bg-white/5 border-white/8 h-12 rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                  data-testid="input-new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white/90">Confirmar nova senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  autoComplete="new-password"
                  className="bg-white/5 border-white/8 h-12 rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                  data-testid="input-confirm-new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {errorMessage ? (
                <p className="text-sm text-red-300" role="alert">{errorMessage}</p>
              ) : null}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm glow-accent"
                data-testid="button-reset-password"
                disabled={isLoading}
              >
                {isLoading ? "Redefinindo..." : "Redefinir senha"}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}