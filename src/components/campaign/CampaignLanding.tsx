"use client";

import { campaignEvents } from "@/lib/analytics/events";
import { LeadChat } from "@/components/campaign/LeadChat";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useRef, useState } from "react";

const PAIN_SECTIONS = [
  {
    id: "seguridad",
    eyebrow: "Tranquilidad",
    pain: "No confías en dejar tu auto a un desconocido",
    relief:
      "En CarLink cada arrendatario pasa verificación y tú decides a quién entregas el vehículo. Además puedes apoyarte en coberturas opcionales y soporte cuando lo necesites.",
    accent: "from-primary-50 to-white",
  },
  {
    id: "papeleo",
    eyebrow: "Cero filas",
    pain: "Te haces bolas con trámites, copias y tiempos de respuesta",
    relief:
      "El alta de tu auto y la documentación van en tu celular: pasos claros, sin colas ni oficinas. Un proceso rápido y digital de principio a fin.",
    accent: "from-accent-50 to-white",
  },
  {
    id: "dinero-quieto",
    eyebrow: "Ingresos reales",
    pain: "Tu carro pierde valor parado y el mantenimiento sigue saliendo",
    relief:
      "Convierte días sin uso en ingresos: publicas cuando quieres y pones tus reglas. El auto deja de ser solo un gasto y empieza a compensar.",
    accent: "from-primary-50 via-white to-accent-50",
  },
  {
    id: "comisiones",
    eyebrow: "Sin sorpresas",
    pain: "No sabes si el negocio cierra después de comisiones y cargos ocultos",
    relief:
      "La comisión por viaje y las condiciones se entienden antes de arrancar. Nada de letras diminutas: tú eliges el rango que te hace sentido.",
    accent: "from-white to-primary-50",
  },
  {
    id: "pagos",
    eyebrow: "Cobros claros",
    pain: "Te preocupa que el pago llegue tarde o que haya malentendidos",
    relief:
      "Los cobros y liquidaciones pasan por la plataforma: menos riesgos, menos llamadas de cobranza y más claridad en cada viaje.",
    accent: "from-accent-50 to-white",
  },
] as const;

export function CampaignLanding() {
  const posthog = usePostHog();
  const [showChat, setShowChat] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  const capture = useCallback(
    (event: string, props?: Record<string, unknown>) => {
      if (posthog) posthog.capture(event, props);
    },
    [posthog],
  );

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = e.target.getAttribute("data-pain-id");
          if (!id || seen.current.has(id)) continue;
          seen.current.add(id);
          capture(campaignEvents.painSectionView, { section_id: id });
        }
      },
      { threshold: 0.45 },
    );
    document.querySelectorAll("[data-pain-id]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [capture]);

  const openChat = () => {
    capture(campaignEvents.painCtaClick);
    setShowChat(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (showChat) {
    return <LeadChat onBack={() => setShowChat(false)} />;
  }

  return (
    <div className="min-h-screen bg-white auth-pattern">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-primary-200 to-accent-300 opacity-40 mix-blend-multiply blur-3xl filter" />
        <div className="animate-pulse-slow absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-accent-200 to-primary-300 opacity-40 mix-blend-multiply blur-3xl filter" />
      </div>

      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <div className="btn-gradient flex h-10 w-10 animate-float items-center justify-center rounded-2xl">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <span className="text-xl font-bold gradient-text">CarLink</span>
        </div>

      </nav>

      <header className="relative z-10 mx-auto max-w-3xl px-4 pb-12 pt-4 text-center sm:pt-10">
        <p className="text-primary-700 mb-3 text-sm font-semibold tracking-wide uppercase">
          Para propietarios
        </p>
        <h1 className="gradient-text mb-4 text-4xl font-bold leading-tight sm:text-5xl">
          Deja de perder dinero con el carro en el garage
        </h1>
        <p className="text-secondary-600 mx-auto max-w-xl text-lg leading-relaxed">
          Esto es lo que de verdad nos dicen quienes quieren rentar su auto — y cómo lo resolvemos contigo.
        </p>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-40">
        {PAIN_SECTIONS.map((section, i) => (
          <section
            key={section.id}
            data-pain-id={section.id}
            className={`mb-6 scroll-mt-24 rounded-3xl border-2 border-primary-100 bg-gradient-to-br p-8 shadow-sm sm:p-12 ${section.accent} sm:mb-10`}
          >
            <p className="text-primary-600 mb-2 text-xs font-bold uppercase tracking-wider">
              {section.eyebrow}
            </p>
            <h2 className="text-secondary-900 mb-4 text-2xl font-bold leading-snug sm:text-3xl">
              {section.pain}
            </h2>
            <p className="text-secondary-700 border-primary-100 border-l-4 pl-4 text-base leading-relaxed">
              {section.relief}
            </p>
            <p className="text-secondary-400 mt-6 text-right text-sm font-medium">
              {String(i + 1).padStart(2, "0")} / {String(PAIN_SECTIONS.length).padStart(2, "0")}
            </p>
          </section>
        ))}

        <div className="glass relative z-10 mx-auto mt-8 max-w-xl rounded-3xl p-8 text-center shadow-lg">
          <p className="text-secondary-700 mb-6 text-sm leading-relaxed">
            ¿Listo para que tu auto genere sin complicarte la vida? Cuéntanos lo básico en el asistente y te contactamos.
          </p>
          <button
            type="button"
            onClick={openChat}
            className="btn-gradient w-full rounded-2xl px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98] sm:w-auto"
          >
            Haz que tu carro trabaje por ti
          </button>
        </div>
      </div>

      <footer className="relative z-10 pb-10 text-center text-sm text-secondary-500">
        <p>&copy; {new Date().getFullYear()} CarLink. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
