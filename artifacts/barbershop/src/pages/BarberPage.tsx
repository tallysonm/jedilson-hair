import { useParams, useLocation } from "wouter";
import { useGetBarber, getGetBarberQueryKey, useListServices, getListServicesQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Instagram, Phone, Scissors, ArrowLeft, Cake, MessageCircle, Star, FileText, Clock } from "lucide-react";
import { JedilsonLogo } from "@/components/Logo";

const WA_PHONE = "5511973436623";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function BarberPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id ?? "");

  const { data: barber, isLoading, isError } = useGetBarber(id, {
    query: { queryKey: getGetBarberQueryKey(id), enabled: !isNaN(id) },
  });
  const { data: services = [] } = useListServices({ query: { queryKey: getListServicesQueryKey() } });

  const waLink = barber?.phone
    ? `https://wa.me/55${barber.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${barber.name}! Vi seu perfil e gostaria de agendar.`)}`
    : `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(`Olá! Gostaria de agendar com ${barber?.name ?? "vocês"}.`)}`;

  if (isNaN(id) || isError) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-accent mx-auto" />
          <p className="font-display text-xl text-white">Barbeiro não encontrado</p>
          <button onClick={() => setLocation("/")} className="text-muted-foreground hover:text-white text-sm transition-colors">
            ← Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col font-sans">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-accent/5 blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-gold/3 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 bg-[#080808]/90 backdrop-blur-xl px-5 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Início
          </button>
          <JedilsonLogo size="sm" />
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 relative z-10">
        <div className="max-w-xl mx-auto px-5 py-10 space-y-6">

          {/* Hero card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="glass-card rounded-3xl overflow-hidden border border-white/8">
            {/* Top gradient strip */}
            <div className="h-1 bg-gradient-to-r from-accent via-gold to-accent" />

            <div className="p-7">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-gradient-to-br from-accent/20 to-gold/10 flex items-center justify-center">
                  {barber?.photo ? (
                    <img src={barber.photo} alt={barber.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <span className="font-display font-bold text-3xl text-white">{initials(barber?.name ?? "")}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-2xl font-bold text-white leading-tight">{barber?.name}</h1>
                  {barber?.specialty && (
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-accent/12 text-accent border border-accent/20">
                      {barber.specialty}
                    </span>
                  )}

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {barber?.phone && (
                      <a href={`tel:${barber.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
                        <Phone className="w-3 h-3 text-accent/60" />{barber.phone}
                      </a>
                    )}
                    {barber?.instagram && (
                      <a href={`https://instagram.com/${barber.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-pink-400 transition-colors">
                        <Instagram className="w-3 h-3" />@{barber.instagram.replace("@", "")}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {barber?.bio && (
                <div className="mt-5 pt-5 border-t border-white/6">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    <FileText className="w-3 h-3" /> Sobre
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{barber.bio}</p>
                </div>
              )}

              {/* Birthday */}
              {barber?.birthDate && (
                <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
                  <Cake className="w-3 h-3" />
                  Aniversário: {barber.birthDate.split("-").reverse().join("/")}
                </div>
              )}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="grid grid-cols-2 gap-3">
            <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-sm hover:bg-emerald-500/18 transition-colors">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </motion.a>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setLocation(`/?barberId=${id}`)}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors"
              style={{ boxShadow: "0 4px 20px rgba(193,18,31,0.3)" }}>
              <Scissors className="w-4 h-4" /> Agendar
            </motion.button>
          </motion.div>

          {/* Services offered */}
          {services.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-white/6 to-transparent" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Serviços Disponíveis</p>
                <div className="h-px flex-1 bg-gradient-to-l from-white/6 to-transparent" />
              </div>
              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.025] border border-white/6">
                    <div>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />{s.durationLabel}
                      </p>
                    </div>
                    <span className="font-bold text-gold text-sm">{s.priceLabel}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer info */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="text-center space-y-1 py-4">
            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Star className="w-3 h-3 text-gold" fill="currentColor" />
              <span>Jedilson Hair — Barbearia de Alta Performance</span>
              <Star className="w-3 h-3 text-gold" fill="currentColor" />
            </div>
            <p className="text-xs text-muted-foreground/50">R. Mademoiselle - Helena Maria, Osasco - SP</p>
            <p className="text-xs text-muted-foreground/50">Ter–Sáb 06h30–21h · Dom 06h30–12h30 · Seg: Fechado</p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
