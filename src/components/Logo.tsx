interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        {/* Orelhas */}
        <path
          d="M8 12C8 8 10 4 16 4C22 4 24 8 24 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Cabeça */}
        <circle
          cx="16"
          cy="18"
          r="8"
          stroke="currentColor"
          strokeWidth="2"
        />
        
        {/* Olhos */}
        <circle
          cx="13"
          cy="16"
          r="1"
          fill="currentColor"
        />
        <circle
          cx="19"
          cy="16"
          r="1"
          fill="currentColor"
        />
        
        {/* Nariz */}
        <path
          d="M15 19.5C15.5 20.5 16.5 20.5 17 19.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-semibold text-xl tracking-tight">Rabbit</span>
    </div>
  );
} 