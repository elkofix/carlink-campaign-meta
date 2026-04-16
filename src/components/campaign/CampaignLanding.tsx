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

      <header className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-8 text-center sm:pt-16">
        <div className="mx-auto mb-6 inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-semibold text-primary-700 shadow-sm">
          <span className="relative mr-2 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-500"></span>
          </span>
          Para propietarios
        </div>
        <h1 className="gradient-text mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl sm:leading-tight">
          Deja de perder dinero con tu carro en el garage
        </h1>
        <p className="text-secondary-600 mx-auto mb-10 max-w-2xl text-xl leading-relaxed">
          Convierte tu vehículo detenido en una fuente de ingresos real. Tú pones las reglas, nosotros nos encargamos de que sea seguro y sin complicaciones.
        </p>
        <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
          <button
            type="button"
            onClick={openChat}
            className="btn-gradient group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full px-10 py-5 text-lg font-bold text-white shadow-xl ring-4 ring-primary-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 sm:w-auto"
          >
            <span className="relative z-10 flex items-center gap-2">
              Quiero rentar mi auto
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 z-0 h-full w-full bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          </button>
          <div className="flex items-center space-x-2 text-sm font-medium text-secondary-500">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Toma menos de 2 minutos</span>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center pb-12">
         <h3 className="text-2xl font-bold text-secondary-900 mb-3">Esto es lo que nos dicen quienes quieren rentar su auto</h3>
         <p className="text-secondary-600 text-lg">Y cómo lo resolvemos contigo para que ganes con tranquilidad.</p>
      </div>

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

        <div className="glass relative z-10 mx-auto mt-16 max-w-xl rounded-3xl p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-12">
          <h4 className="mb-4 text-2xl font-bold text-secondary-900">¿Listo para dar el primer paso?</h4>
          <p className="text-secondary-600 mb-8 text-base leading-relaxed">
            Sin compromisos. Cuéntanos lo básico en el asistente y te contactaremos para explicarte cómo funciona.
          </p>
          <button
            type="button"
            onClick={openChat}
            className="btn-gradient group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full px-8 py-4 text-lg font-bold text-white shadow-lg ring-4 ring-primary-50 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 sm:w-auto mx-auto"
          >
            <span className="relative z-10">Quiero rentar mi auto</span>
            <svg className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="absolute inset-0 z-0 h-full w-full bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          </button>
        </div>
      </div>

      <footer className="relative z-10 pb-10 text-center text-sm text-secondary-500">
        <p>&copy; {new Date().getFullYear()} CarLink. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
