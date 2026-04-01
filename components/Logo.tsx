interface LogoProps {
  className?: string;
}

export function Logo({ className = "w-10 h-10" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
    >
      <defs>
        {/* Gradiente dourado — escudo */}
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Gradiente azul celeste — gota do Vegetal */}
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        {/* Glow suave da estrela */}
        <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Glow do escudo (sutil, pra dark mode) */}
        <filter id="shieldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Escudo externo — forma heráldica clássica */}
      <path
        d="M50 6 C50 6, 82 8, 88 28 C94 48, 80 72, 50 94 C20 72, 6 48, 12 28 C18 8, 50 6, 50 6 Z"
        fill="none"
        stroke="url(#goldGradient)"
        strokeWidth="5.5"
        strokeLinejoin="round"
        filter="url(#shieldGlow)"
      />

      {/* Escudo interno — detalhe elegante */}
      <path
        d="M50 15 C50 15, 76 17, 81 32 C86 48, 74 68, 50 84 C26 68, 14 48, 19 32 C24 17, 50 15, 50 15 Z"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Gota do Vegetal (Hoasca) — símbolo central */}
      <path
        d="M50 24 C57 33, 66 44, 66 56 C66 67, 59 74, 50 74 C41 74, 34 67, 34 56 C34 44, 43 33, 50 24 Z"
        fill="url(#skyGradient)"
      />

      {/* Brilho interno da gota — reflexo superior */}
      <path
        d="M45 32 C48 37, 50 42, 49 47"
        fill="none"
        stroke="#E0F2FE"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Estrela de 4 pontas — luz do sacramento */}
      <path
        d="M50 41 L51.8 48.2 L59 50 L51.8 51.8 L50 59 L48.2 51.8 L41 50 L48.2 48.2 Z"
        fill="#FFFFFF"
        filter="url(#starGlow)"
        opacity="0.95"
      />
    </svg>
  );
}
