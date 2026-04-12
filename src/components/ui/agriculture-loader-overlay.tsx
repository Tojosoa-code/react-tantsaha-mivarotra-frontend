import { cn } from "@/lib/utils";

interface OrganicSproutLoaderProps {
  className?: string;
  text?: string;
}

function OrganicSproutLoader({ className, text }: OrganicSproutLoaderProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "bg-background/90 backdrop-blur-sm",
        className,
      )}
    >
      <style>
        {`
        /* 🌍 TERRE : Cycle de 3s */
        @keyframes base-lifecycle {
          0%, 5% { opacity: 0; transform: scaleX(0); }
          10%, 90% { opacity: 1; transform: scaleX(1); }
          95%, 100% { opacity: 0; transform: scaleX(0); }
        }

        /* 🌱 TIGE : Sortie plus rapide */
        @keyframes stem-lifecycle {
          0%, 10% { stroke-dashoffset: 20; opacity: 0; }
          15% { opacity: 1; }
          40% { stroke-dashoffset: 0; }
          80% { stroke-dashoffset: 0; opacity: 1; }
          90% { stroke-dashoffset: 20; opacity: 1; }
          95%, 100% { opacity: 0; }
        }

        /* 🍃 FEUILLE GAUCHE */
        @keyframes leaf-left-fall {
          0%, 40% { transform: translateY(0) scale(0); opacity: 0; }
          50% { transform: translateY(0) scale(1.2); opacity: 1; }
          55%, 75% { transform: translateY(0) scale(1); opacity: 1; }
          88% { transform: translateY(16px) scale(1); opacity: 0; }
          100% { opacity: 0; }
        }

        /* 🍃 FEUILLE DROITE */
        @keyframes leaf-right-fall {
          0%, 45% { transform: translateY(0) scale(0); opacity: 0; }
          55% { transform: translateY(0) scale(1.2); opacity: 1; }
          60%, 80% { transform: translateY(0) scale(1); opacity: 1; }
          93% { transform: translateY(16px) scale(1); opacity: 0; }
          100% { opacity: 0; }
        }

        .base {
          animation: base-lifecycle 3s ease-in-out infinite;
          transform-origin: center;
        }

        .stem {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: stem-lifecycle 3s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        .leaf-left {
          transform-origin: 12px 8px;
          animation: leaf-left-fall 3s ease-in-out infinite;
        }

        .leaf-right {
          transform-origin: 12px 8px;
          animation: leaf-right-fall 3s ease-in-out infinite;
        }

        /* Flottaison globale légèrement accélérée pour matcher les 3s */
        .float-slow {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        `}
      </style>

      <div className="flex flex-col items-center">
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary float-slow"
        >
          <path d="M7 20h10" className="base" />
          <path d="M12 20V8" className="stem" />
          <path
            className="leaf-left"
            d="M12 8a3 3 0 0 0-3-3 3 3 0 0 0-3 3c0 2 1.5 3 3 3h3"
          />
          <path
            className="leaf-right"
            d="M12 8a3 3 0 0 1 3-3 3 3 0 0 1 3 3c0 2-1.5 3-3 3h-3"
          />
        </svg>

        {text && (
          <p className="mt-8 text-xs font-bold text-muted-foreground tracking-[0.4em] uppercase opacity-80">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

export { OrganicSproutLoader };
