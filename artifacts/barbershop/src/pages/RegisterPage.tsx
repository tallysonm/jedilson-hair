import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { JedilsonLogo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEmailAlreadyRegisteredError = (error: unknown) => {
    if (!error || typeof error !== "object") return false;

    const maybeError = error as { code?: string; message?: string };
    const code = typeof maybeError.code === "string" ? maybeError.code.toLowerCase() : "";
    const message = typeof maybeError.message === "string" ? maybeError.message.toLowerCase() : "";

    return (
      code.includes("user_already_exists")
      || code.includes("email_exists")
      || message.includes("user already registered")
      || message.includes("already registered")
      || message.includes("already exists")
    );
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, "");

    if (!normalizedName || !normalizedPhone || !normalizedEmail || !password || !confirmPassword) {
      setErrorMessage("Preencha todos os campos obrigatórios.");
      return;
    }

    if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
      setErrorMessage("Informe um telefone válido com DDD.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setIsLoading(false);

      if (isEmailAlreadyRegisteredError(error)) {
        setErrorMessage("Este e-mail já possui uma conta. Faça login ou recupere sua senha.");
        return;
      }

      setErrorMessage("Não foi possível criar sua conta. Verifique os dados e tente novamente.");
      return;
    }

    if (!data.user) {
      setIsLoading(false);
      setErrorMessage("Conta criada sem usuário retornado. Tente novamente.");
      return;
    }

    const { error: profileError } = await supabase.from("clients").insert({
      auth_user_id: data.user.id,
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      is_active: true,
    });

    setIsLoading(false);

    if (profileError) {
      setErrorMessage("Conta criada, mas houve problema ao criar seu perfil de cliente.");
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
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">Criar conta</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">
              Cadastre-se para acompanhar seus agendamentos.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/90">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                autoComplete="name"
                className="bg-white/5 border-white/8 h-12 rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                data-testid="input-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/90">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                autoComplete="tel"
                className="bg-white/5 border-white/8 h-12 rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                data-testid="input-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  autoComplete="new-password"
                  className="bg-white/5 border-white/8 h-12 rounded-xl pr-11 text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                  data-testid="input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-white/90">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  autoComplete="new-password"
                  className="bg-white/5 border-white/8 h-12 rounded-xl pr-11 text-white placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent/40"
                  data-testid="input-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <p className="text-sm text-red-300" role="alert">{errorMessage}</p>
            ) : null}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm glow-accent"
              data-testid="button-register"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <div className="mt-7 pt-5 border-t border-white/8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Já possui uma conta?</p>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm text-white hover:text-gold"
              onClick={() => setLocation("/login")}
            >
              Entrar
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
