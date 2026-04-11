/**
 * Copia local en el navegador del usuario (sin servidor).
 * No es accesible para ti como operador; usa PostHog u otro backend para agregar leads.
 */

export const LEAD_STORAGE_KEY = "carlink_owner_lead_submissions";

export type LeadAnswers = {
  name: string;
  city: string;
  vehicleBrandModel: string;
  commissionPreference: string;
  paymentPlanInterest: string;
};

export type LeadSubmission = LeadAnswers & {
  submittedAt: string;
};

export function saveLead(answers: LeadAnswers): LeadSubmission {
  const entry: LeadSubmission = {
    ...answers,
    submittedAt: new Date().toISOString(),
  };
  if (typeof window === "undefined") return entry;
  try {
    const raw = window.localStorage.getItem(LEAD_STORAGE_KEY);
    const list: LeadSubmission[] = raw ? JSON.parse(raw) : [];
    list.push(entry);
    window.localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota / private mode
  }
  return entry;
}
