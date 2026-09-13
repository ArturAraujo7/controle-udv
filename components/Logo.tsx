interface LogoProps {
  className?: string;
}

/**
 * Marca Guardião — escudo (guarda) contendo a nervura de uma folha
 * (mariri/chacrona). Traço único estilo Lucide, herda a cor do contexto
 * via currentColor (`text-primary`, `text-foreground`, etc.).
 */
export function Logo({ className = "w-10 h-10" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Escudo */}
      <path d="M12 3l7 3v5c0 4.8-3 8.3-7 10-4-1.7-7-5.2-7-10V6l7-3z" />
      {/* Nervura central da folha */}
      <path d="M12 8v9" />
      {/* Veios opostos (folhas alternadas do cipó) */}
      <path d="M12 13.5c-1.8-.3-3.2-1.7-3.5-3.5M12 11c1.8-.3 3.2-1.7 3.5-3.5" />
    </svg>
  );
}
