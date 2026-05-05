import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        toast({
          title: "Erro",
          description: "Credenciais invalidas.",
          variant: "destructive"
        });
      }
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { username, password } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md glass-card p-8 rounded-[16px] hover-glow">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-2">Gedilson Rai Barbershop</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Usuario" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-input border-border focus:border-primary focus:ring-primary rounded-[8px]"
                data-testid="input-username"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                type="password" 
                placeholder="Senha" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-input border-border focus:border-primary focus:ring-primary rounded-[8px]"
                data-testid="input-password"
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-[12px] h-12 text-lg font-medium"
            disabled={loginMutation.isPending}
            data-testid="button-login"
          >
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
