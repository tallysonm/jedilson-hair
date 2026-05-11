interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function JedilsonLogo({ size = "md", className = "" }: LogoProps) {
  const heights: Record<string, string> = {
    sm: "h-10",
    md: "h-14",
    lg: "h-20",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/fachada.jpg"
        alt="Jedilson Barbershop"
        className={`${heights[size]} w-auto object-contain`}
        style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.7))" }}
      />
    </div>
  );
}
