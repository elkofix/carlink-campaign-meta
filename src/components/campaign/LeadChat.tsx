"use client";

import { campaignEvents } from "@/lib/analytics/events";
import { type LeadAnswers, saveLead } from "@/lib/lead-storage";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "name" | "email" | "city" | "vehicle" | "commission" | "plan" | "done";

type Msg = { role: "bot" | "user"; text: string };

const COMMISSION_OPTIONS = [
  "Hasta 10%",
  "10% – 15%",
  "15% – 20%",
  "Prefiero asesoría personalizada",
] as const;

const PLAN_OPTIONS = [
  "Sí, me interesa",
  "Solo comisión por viaje",
  "Aún no lo decido",
] as const;

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="glass max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <span className="bg-secondary-400 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
          <span className="bg-secondary-400 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
          <span className="bg-secondary-400 h-2 w-2 animate-bounce rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function LeadChat({ onBack }: { onBack: () => void }) {
  const posthog = usePostHog();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [phase, setPhase] = useState<Phase>("name");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(true);
  const [answers, setAnswers] = useState<Partial<LeadAnswers>>({});

  const capture = useCallback(
    (event: string, props?: Record<string, unknown>) => {
      if (posthog) posthog.capture(event, props);
    },
    [posthog],
  );

  const pushBot = useCallback((text: string) => {
    setMessages((m) => [...m, { role: "bot", text }]);
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages((m) => [...m, { role: "user", text }]);
  }, []);

  const scrollDown = () => {
    window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  useEffect(() => {
    capture(campaignEvents.chatOpened);
  }, [capture]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setTyping(false);
      pushBot(
        "Hola, soy el asistente de CarLink para propietarios. Para empezar, ¿cómo te llamas?",
      );
      scrollDown();
    }, 900);
    return () => window.clearTimeout(t);
  }, [pushBot]);

  useEffect(() => {
    scrollDown();
  }, [messages, typing]);

  const runBotTyping = (next: () => void) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      next();
      scrollDown();
    }, 700);
  };

  const finishFlow = (finalAnswers: LeadAnswers) => {
    saveLead(finalAnswers);
    setPhase("done");
    capture(campaignEvents.chatCompleted, {
      name: finalAnswers.name,
      email: finalAnswers.email,
      city: finalAnswers.city,
      vehicle: finalAnswers.vehicleBrandModel,
      commission_preference: finalAnswers.commissionPreference,
      plan_interest: finalAnswers.paymentPlanInterest,
    });
    runBotTyping(() => {
      pushBot(
        "Gracias por tu tiempo. Nos pondremos en contacto contigo pronto con los siguientes pasos. ¡Que tu carro trabaje por ti!",
      );
    });
  };

  const submitText = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (!v || typing || phase === "done") return;

    pushUser(v);
    setInput("");
    capture(campaignEvents.chatMessageSent, { phase });

    if (phase === "name") {
      setAnswers((a) => ({ ...a, name: v }));
      setPhase("email");
      runBotTyping(() => {
        pushBot(`Encantado, ${v}. ¿Cuál es tu correo electrónico para enviarte la información?`);
      });
      return;
    }
    if (phase === "email") {
      const email = v.toLowerCase();
      setAnswers((a) => ({ ...a, email }));
      if (posthog) {
        posthog.identify(email, { email, name: answers.name });
      }
      capture(campaignEvents.leadEmailCaptured, { email });
      setPhase("city");
      runBotTyping(() => {
        pushBot("Perfecto. ¿En qué ciudad te encuentras?");
      });
      return;
    }
    if (phase === "city") {
      setAnswers((a) => ({ ...a, city: v }));
      setPhase("vehicle");
      runBotTyping(() => {
        pushBot("¿Qué marca y modelo es tu vehículo?");
      });
      return;
    }
    if (phase === "vehicle") {
      setAnswers((a) => ({ ...a, vehicleBrandModel: v }));
      setPhase("commission");
      runBotTyping(() => {
        pushBot(
          "¿Qué rango de comisión por viaje te resulta aceptable para usar la plataforma?",
        );
      });
      return;
    }
  };

  const pickCommission = (label: string) => {
    if (phase !== "commission" || typing) return;
    pushUser(label);
    setAnswers((a) => ({ ...a, commissionPreference: label }));
    capture(campaignEvents.chatMessageSent, { phase: "commission", choice: label });
    setPhase("plan");
    runBotTyping(() => {
      pushBot(
        "¿Te interesa que te contactemos con información sobre planes mensuales (mantenimiento, seguros con aliados)?",
      );
    });
  };

  const pickPlan = (label: string) => {
    if (phase !== "plan" || typing) return;
    pushUser(label);
    const name = answers.name ?? "";
    const email = answers.email ?? "";
    const city = answers.city ?? "";
    const vehicleBrandModel = answers.vehicleBrandModel ?? "";
    const commissionPreference = answers.commissionPreference ?? "";
    const final: LeadAnswers = {
      name,
      email,
      city,
      vehicleBrandModel,
      commissionPreference,
      paymentPlanInterest: label,
    };
    capture(campaignEvents.chatMessageSent, { phase: "plan", choice: label });
    finishFlow(final);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-primary-50 via-white to-accent-50 auth-pattern">
      <header className="glass sticky top-0 z-20 flex items-center justify-between gap-3 border-b-2 border-primary-100 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-secondary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <div className="flex items-center gap-2">
          <div className="btn-gradient flex h-9 w-9 items-center justify-center rounded-xl">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-secondary-900 text-sm font-semibold">Asistente CarLink</p>
            <p className="text-secondary-500 text-xs">Propietarios</p>
          </div>
        </div>
        <div className="w-14" aria-hidden />
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6">
        {messages.map((msg, i) => (
          <div
            key={`${i}-${msg.role}`}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "btn-gradient text-white rounded-br-md"
                  : "glass text-secondary-800 rounded-bl-md"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {typing && <TypingBubble />}
        <div ref={bottomRef} />
      </div>

      {phase !== "done" && phase !== "commission" && phase !== "plan" && (
        <form onSubmit={submitText} className="glass border-t-2 border-primary-100 p-4">
          <div className="mx-auto flex max-w-lg gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                phase === "name"
                  ? "Tu nombre"
                  : phase === "email"
                    ? "tu@email.com"
                    : phase === "city"
                      ? "Ciudad"
                      : "Ej. Nissan Versa 2022"
              }
              className="border-secondary-300 focus:ring-primary-500 flex-1 rounded-xl border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
              disabled={typing}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={typing || !input.trim()}
              className="btn-gradient rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </form>
      )}

      {phase === "commission" && !typing && (
        <div className="glass border-t-2 border-primary-100 p-4">
          <div className="mx-auto grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
            {COMMISSION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => pickCommission(opt)}
                className="border-primary-200 hover:bg-primary-50 rounded-xl border-2 bg-white px-3 py-3 text-left text-sm font-medium text-secondary-800 transition"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "plan" && !typing && (
        <div className="glass border-t-2 border-primary-100 p-4">
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            {PLAN_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => pickPlan(opt)}
                className="border-primary-200 hover:bg-primary-50 rounded-xl border-2 bg-white px-4 py-3 text-left text-sm font-medium text-secondary-800 transition"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && !typing && (
        <div className="glass border-t-2 border-primary-100 p-4">
          <div className="mx-auto max-w-lg text-center">
            <button type="button" onClick={onBack} className="text-secondary-600 text-sm font-medium underline">
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
