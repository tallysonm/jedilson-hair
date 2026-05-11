interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function JedilsonLogo({ size = "md", className = "" }: LogoProps) {
  const dims: Record<string, { circle: string; ring: string; text: string; sub: string }> = {
    sm: { circle: "w-9 h-9",  ring: "p-[2px]", text: "text-[14px]", sub: "text-[8px]"  },
    md: { circle: "w-12 h-12", ring: "p-[2px]", text: "text-[18px]", sub: "text-[9px]"  },
    lg: { circle: "w-20 h-20", ring: "p-[3px]", text: "text-[28px]", sub: "text-[11px]" },
  };
  const d = dims[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Circular photo with gold ring */}
      <div
        className={`shrink-0 rounded-full ${d.ring} ${d.circle}`}
        style={{
          background: "linear-gradient(135deg, #C9A84C 0%, #f0d07a 50%, #C9A84C 100%)",
          boxShadow: "0 0 16px rgba(201,168,76,0.5), 0 2px 8px rgba(0,0,0,0.6)",
        }}
      >
        <img
          src="/logo-circular.png"
          alt="Jedilson Barbershop"
          className="w-full h-full rounded-full object-cover"
        />
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none gap-0.5">
        <span
          className={`font-display font-bold text-white tracking-[0.06em] uppercase ${d.text}`}
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
        >
          Jedilson
        </span>
        <span className={`text-gold font-semibold tracking-[0.45em] uppercase ${d.sub}`}>
          Hair
        </span>
      </div>
    </div>
  );
}
