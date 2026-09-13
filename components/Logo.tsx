interface LogoProps {
  className?: string;
}

/**
 * Marca Guardião — escudo (a guarda) protegendo uma folha com seu talo
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
      {/* Folha */}
      <path d="M15.5 8.5c0 3.4-2.4 6-5.5 6.5 0-3.4 2.4-6 5.5-6.5z" />
      {/* Talo */}
      <path d="M9 17c0-3 1.5-5.5 4-7" />
    </svg>
  );
}
