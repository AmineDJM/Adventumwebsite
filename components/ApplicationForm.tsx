"use client";

import { useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { PrimaryButton } from "@/components/ui/Buttons";

/**
 * The careers form: a candidate applies here, and the application reaches the
 * company's ERP (the recruitment team) — no e-mail client, nothing to attach
 * by hand. When the site is not linked to the ERP yet, the former e-mail
 * button is shown instead, so applying is never impossible.
 */

const INPUT_CLASS =
  "w-full rounded-xl border border-hairline/10 bg-surface/[0.03] px-4 py-3 text-frost placeholder:text-muted focus:border-pulse/50 focus:outline-none focus:ring-1 focus:ring-pulse/30 transition-colors duration-300";
const LABEL_CLASS = "mb-2 block font-mono text-[0.65rem] uppercase tracking-[0.25em] text-silver";
const CV_MAX_BYTES = 5 * 1024 * 1024;
const CV_ACCEPT = ".pdf,.doc,.docx,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; reference: string }
  | { kind: "error"; code: string; field: string | null };

export default function ApplicationForm({
  linked,
  jobSlug,
  jobTitle,
  fallbackEmail,
  spontaneous = false,
  framed = true,
}: {
  linked: boolean;
  jobSlug?: string;
  jobTitle?: string;
  fallbackEmail: string;
  spontaneous?: boolean;
  /** False when the page already draws the card and the heading around the form. */
  framed?: boolean;
}) {
  const { t, locale } = useI18n();
  const [state, setState] = useState<State>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  const mailto = `mailto:${fallbackEmail}?subject=${encodeURIComponent(
    spontaneous ? "Candidature spontanée" : `Candidature — ${jobTitle ?? ""}`
  )}`;

  if (!linked) {
    return (
      <a
        href={mailto}
        className="inline-flex items-center gap-2 rounded-full border border-bio/40 bg-bio/10 px-6 py-3 text-sm font-semibold text-bio transition-all duration-500 ease-premium hover:border-bio/70 hover:bg-bio/[0.16]"
      >
        {t(spontaneous ? "careers.spontaneous_cta" : "careers.apply_cta")}
      </a>
    );
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const cv = data.get("cv");
    // Checked here to save the candidate a slow upload; the server checks again.
    if (!(cv instanceof File) || cv.size === 0) return setState({ kind: "error", code: "cv_required", field: "cv" });
    if (cv.size > CV_MAX_BYTES) return setState({ kind: "error", code: "cv_too_large", field: "cv" });
    data.set("language", locale);
    if (jobSlug) data.set("jobSlug", jobSlug);
    if (jobTitle) data.set("jobTitle", jobTitle);
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/candidatures", { method: "POST", body: data });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; reference?: string; error?: string; field?: string | null };
      if (res.ok && j.ok && j.reference) {
        setState({ kind: "done", reference: j.reference });
        form.reset();
        return;
      }
      setState({ kind: "error", code: j.error ?? "generic", field: j.field ?? null });
    } catch {
      setState({ kind: "error", code: "generic", field: null });
    }
  };

  if (state.kind === "done") {
    return (
      <div role="status" className={framed ? "rounded-3xl glass card-shadow p-8 md:p-10" : ""}>
        <p className="font-display text-2xl font-medium text-frost">{t("careers.form_success_title")}</p>
        <p className="mt-3 text-sm leading-relaxed text-silver md:text-base">
          {t("careers.form_success_body")} <span className="font-mono text-frost">{state.reference}</span>
        </p>
      </div>
    );
  }

  const errorKey = state.kind === "error" ? `careers.form_error_${state.code}` : null;
  const errorText = errorKey ? (t(errorKey) === errorKey ? t("careers.form_error_generic") : t(errorKey)) : null;
  const fieldError = (name: string) => state.kind === "error" && state.field === name;

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate={false}
      className={framed ? "relative space-y-6 rounded-3xl glass card-shadow p-8 md:p-10" : "relative space-y-6"}
      aria-busy={state.kind === "sending"}
    >
      {framed && (
        <p className="font-display text-2xl font-medium text-frost">
          {t(spontaneous ? "careers.form_heading_spontaneous" : "careers.form_heading")}
        </p>
      )}

      {/* Invisible to people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="application-website">Website</label>
        <input id="application-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="application-name" className={LABEL_CLASS}>{t("careers.form_name")}</label>
          <input id="application-name" name="fullName" required minLength={2} maxLength={160} autoComplete="name"
            aria-invalid={fieldError("fullName")} className={INPUT_CLASS} />
        </div>
        <div>
          <label htmlFor="application-email" className={LABEL_CLASS}>{t("careers.form_email")}</label>
          <input id="application-email" name="email" type="email" required maxLength={254} autoComplete="email"
            aria-invalid={fieldError("email")} className={INPUT_CLASS} />
        </div>
      </div>

      <div>
        <label htmlFor="application-phone" className={LABEL_CLASS}>{t("careers.form_phone")}</label>
        <input id="application-phone" name="phone" type="tel" maxLength={40} autoComplete="tel"
          aria-invalid={fieldError("phone")} className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="application-message" className={LABEL_CLASS}>{t("careers.form_message")}</label>
        <textarea id="application-message" name="message" rows={4} maxLength={5000} className={`${INPUT_CLASS} resize-none`} />
      </div>

      <div>
        <label htmlFor="application-cv" className={LABEL_CLASS}>{t("careers.form_cv")}</label>
        <input id="application-cv" name="cv" type="file" required accept={CV_ACCEPT}
          aria-invalid={fieldError("cv")}
          className="block w-full text-sm text-silver file:mr-4 file:rounded-full file:border-0 file:bg-bio/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-bio hover:file:bg-bio/25" />
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-silver">
        <input name="consent" type="checkbox" required aria-invalid={fieldError("consent")}
          className="mt-1 h-4 w-4 shrink-0 rounded border-hairline/30 accent-[rgb(104,210,223)]" />
        <span>{t("careers.form_consent")}</span>
      </label>

      {errorText && (
        <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-frost">
          {errorText}
          {state.kind === "error" && state.code === "applications_unavailable" && (
            <> <a href={mailto} className="text-pulse underline underline-offset-4">{fallbackEmail}</a></>
          )}
        </p>
      )}

      <PrimaryButton type="submit" className="w-full">
        {state.kind === "sending" ? t("careers.form_sending") : t("careers.form_submit")}
      </PrimaryButton>
      <p className="text-center text-xs text-muted">{t("careers.form_privacy")}</p>
    </form>
  );
}
