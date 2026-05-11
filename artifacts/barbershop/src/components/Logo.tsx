import { Scissors } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function JedilsonLogo({ size = "md", className = "" }: LogoProps) {
  const s = {
    sm: { box: "w-8 h-8 p-1.5 rounded-xl",  name: "text-[15px]", sub: "text-[8px]",  gap: "gap-2.5", dot: "w-2.5 h-2.5" },
    md: { box: "w-10 h-10 p-2 rounded-xl",   name: "text-[19px]", sub: "text-[9px]",  gap: "gap-3",   dot: "w-3 h-3"     },
    lg: { box: "w-16 h-16 p-3.5 rounded-2xl", name: "text-3xl",   sub: "text-[11px]", gap: "gap-4",   dot: "w-4 h-4"     },
  }[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* Icon badge */}
      <div
        className={`relative flex items-center justify-center shrink-0 bg-accent ${s.box}`}
        style={{ boxShadow: "0 4px 24px rgba(193,18,31,0.5), inset 0 1px 0 rgba(255,255,255,0.12)" }}
      >
        <Scissors className="w-full h-full text-white" strokeWidth={2} />
        {/* Gold accent dot */}
        <span
          className={`absolute -top-1 -right-1 ${s.dot} rounded-full bg-gold border-2 border-background`}
          style={{ boxShadow: "0 2px 8px rgba(201,168,76,0.6)" }}
        />
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none gap-0.5">
        <span className={`font-display font-bold text-white tracking-[0.07em] uppercase ${s.name}`}>
          Jedilson
        </span>
        <span className={`text-gold font-semibold tracking-[0.5em] uppercase ${s.sub}`}>
          Hair
        </span>
      </div>
    </div>
  );
}
