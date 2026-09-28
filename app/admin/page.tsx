"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/providers/I18nProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AdventumMark from "@/components/ui/AdventumMark";
import type { Job } from "@/lib/jobs";

type Draft = {
  id?: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  summary: string;
  mission: string;
  profile: string;
  offer: string;
  published: boolean;
};

const EMPTY: Draft = {
  title: "",
  department: "",
  location: "Cheraga, Alger",
  type: "CDI",
  experience: "",
  summary: "",
  mission: "",
  profile: "",
  offer: "",
  published: true,
};

const field =
  "w-full rounded-xl border border-hairline/12 bg-surface/[0.04] px-4 py-3 text-sm text-frost outline-none transition-colors duration-300 placeholder:text-muted focus:border-pulse/50";
const label =
  "block font-mono text-[0.58rem] uppercase tracking-[0.25em] text-muted";

function toDraft(job: Job): Draft {
  return {
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    type: job.type,
    experience: job.experience,
    summary: job.summary,
    mission: job.mission.join("\n"),
    profile: job.profile.join("\n"),
    offer: job.offer.join("\n"),
    published: job.published,
  };
}

export default function AdminPage() {
  const { t } = useI18n();

  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const loadJobs = useCallback(async () => {
    const res = await fetch("/api/jobs", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { jobs: Job[] };
      setJobs(data.jobs);
    }
  }, []);

  // Restore an existing session on load.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data = (await res.json()) as {
          authenticated: boolean;
          configured: boolean;
        };
        setConfigured(data.configured);
        setAuthed(data.authenticated);
        if (data.authenticated) await loadJobs();
      } finally {
        setReady(true);
      }
    })();
  }, [loadJobs]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthed(true);
        setPassword("");
        await loadJobs();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({ kind: "err", text: data.error ?? t("admin.wrong_password") });
      }
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthed(false);
    setJobs([]);
    setDraft(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        ...draft,
        mission: draft.mission.split("\n"),
        profile: draft.profile.split("\n"),
        offer: draft.offer.split("\n"),
      };
      const res = await fetch(
        draft.id ? `/api/jobs/${draft.id}` : "/api/jobs",
        {
          method: draft.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        setDraft(null);
        setMessage({ kind: "ok", text: t("admin.saved") });
        await loadJobs();
      } else if (res.status === 401) {
        setAuthed(false);
        setMessage({ kind: "err", text: t("admin.session_expired") });
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({ kind: "err", text: data.error ?? t("admin.error") });
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (job: Job) => {
    if (!window.confirm(t("admin.confirm_delete"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadJobs();
      } else if (res.status === 401) {
        setAuthed(false);
      } else {
        setMessage({ kind: "err", text: t("admin.error") });
      }
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <div className="min-h-screen bg-abyss" />;
  }

  return (
    <div className="min-h-screen bg-abyss">
      <header className="border-b border-hairline/[0.06]">
        <div className="shell flex h-[72px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AdventumMark id="admin-mark" className="h-8 w-8" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[0.95rem] font-semibold tracking-[0.18em] text-frost">
                ADVENTUM
              </span>
              <span className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.45em] text-bio/90">
                {t("admin.title")}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {authed && (
              <button
                onClick={logout}
                className="rounded-full border border-hairline/12 px-4 py-2 text-xs font-medium text-silver transition-colors duration-300 hover:border-pulse/40 hover:text-frost"
              >
                {t("admin.logout")}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="shell py-16">
        {message && (
          <p
            className={`mb-8 rounded-xl border px-4 py-3 text-sm ${
              message.kind === "ok"
                ? "border-bio/30 bg-bio/[0.07] text-bio"
                : "border-red-500/30 bg-red-500/[0.07] text-red-300"
            }`}
          >
            {message.text}
          </p>
        )}

        {!authed ? (
          <div className="mx-auto max-w-sm">
            <h1 className="font-display text-2xl font-medium text-frost">
              {t("admin.title")}
            </h1>
            <p className="mt-2 text-sm text-silver">{t("admin.subtitle")}</p>

            {!configured ? (
              <p className="mt-8 rounded-xl border border-hairline/12 bg-surface/[0.04] p-4 text-sm leading-relaxed text-muted">
                L&apos;accès administrateur n&apos;est pas configuré. Définissez
                la variable d&apos;environnement{" "}
                <code className="text-frost">ADMIN_PASSWORD</code> sur
                l&apos;hébergement, puis rechargez cette page.
              </p>
            ) : (
              <form onSubmit={login} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="admin-password" className={label}>
                    {t("admin.password")}
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${field} mt-2`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full border border-bio/40 bg-bio/10 px-6 py-3 text-sm font-semibold text-bio transition-all duration-500 ease-premium hover:border-bio/70 hover:bg-bio/[0.16] disabled:opacity-50"
                >
                  {t("admin.login")}
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-medium text-frost">
                  {t("admin.subtitle")}
                </h1>
                <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted">
                  {jobs.length} · {t("careers.open_positions")}
                </p>
              </div>
              {!draft && (
                <button
                  onClick={() => setDraft({ ...EMPTY })}
                  className="rounded-full border border-bio/40 bg-bio/10 px-5 py-2.5 text-sm font-semibold text-bio transition-all duration-500 ease-premium hover:border-bio/70 hover:bg-bio/[0.16]"
                >
                  + {t("admin.new_job")}
                </button>
              )}
            </div>

            {draft && (
              <form
                onSubmit={save}
                className="mt-10 space-y-6 rounded-2xl glass p-7 md:p-9"
              >
                <h2 className="font-display text-lg font-medium text-frost">
                  {draft.id ? t("admin.edit_job") : t("admin.new_job")}
                </h2>

                <div className="grid gap-5 md:grid-cols-2">
                  {(
                    [
                      ["title", "admin.field_title"],
                      ["department", "admin.field_department"],
                      ["location", "admin.field_location"],
                      ["type", "admin.field_type"],
                      ["experience", "admin.field_experience"],
                    ] as const
                  ).map(([key, labelKey]) => (
                    <div key={key}>
                      <label htmlFor={`f-${key}`} className={label}>
                        {t(labelKey)}
                      </label>
                      <input
                        id={`f-${key}`}
                        value={draft[key]}
                        onChange={(e) =>
                          setDraft({ ...draft, [key]: e.target.value })
                        }
                        className={`${field} mt-2`}
                        required={key === "title"}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label htmlFor="f-summary" className={label}>
                    {t("admin.field_summary")}
                  </label>
                  <textarea
                    id="f-summary"
                    rows={3}
                    value={draft.summary}
                    onChange={(e) =>
                      setDraft({ ...draft, summary: e.target.value })
                    }
                    className={`${field} mt-2 resize-y`}
                  />
                </div>

                {(
                  [
                    ["mission", "admin.field_mission"],
                    ["profile", "admin.field_profile"],
                    ["offer", "admin.field_offer"],
                  ] as const
                ).map(([key, labelKey]) => (
                  <div key={key}>
                    <label htmlFor={`f-${key}`} className={label}>
                      {t(labelKey)}
                    </label>
                    <textarea
                      id={`f-${key}`}
                      rows={5}
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.value })
                      }
                      className={`${field} mt-2 resize-y font-mono text-xs leading-relaxed`}
                    />
                  </div>
                ))}

                <label className="flex items-center gap-3 text-sm text-silver">
                  <input
                    type="checkbox"
                    checked={draft.published}
                    onChange={(e) =>
                      setDraft({ ...draft, published: e.target.checked })
                    }
                    className="h-4 w-4 accent-bio"
                  />
                  {t("admin.field_published")}
                </label>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full border border-bio/40 bg-bio/10 px-6 py-3 text-sm font-semibold text-bio transition-all duration-500 ease-premium hover:border-bio/70 hover:bg-bio/[0.16] disabled:opacity-50"
                  >
                    {t("admin.save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    className="rounded-full border border-hairline/12 px-6 py-3 text-sm font-medium text-silver transition-colors duration-300 hover:border-pulse/40 hover:text-frost"
                  >
                    {t("admin.cancel")}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-10 space-y-4">
              {jobs.length === 0 && !draft && (
                <p className="text-sm text-silver">{t("admin.no_jobs")}</p>
              )}
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col gap-4 rounded-2xl glass p-6 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-[0.52rem] uppercase tracking-[0.2em] ${
                          job.published
                            ? "bg-bio/15 text-bio"
                            : "bg-surface/[0.08] text-muted"
                        }`}
                      >
                        {job.published ? t("admin.published") : t("admin.draft")}
                      </span>
                      <h3 className="font-display text-lg font-medium text-frost">
                        {job.title}
                      </h3>
                    </div>
                    <p className="mt-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted">
                      {[job.department, job.location, job.type]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2.5">
                    <button
                      onClick={() => setDraft(toDraft(job))}
                      className="rounded-full border border-hairline/12 px-4 py-2 text-xs font-medium text-silver transition-colors duration-300 hover:border-pulse/40 hover:text-frost"
                    >
                      {t("admin.edit_job")}
                    </button>
                    <button
                      onClick={() => remove(job)}
                      disabled={busy}
                      className="rounded-full border border-red-500/25 px-4 py-2 text-xs font-medium text-red-300/90 transition-colors duration-300 hover:border-red-500/50 hover:text-red-200 disabled:opacity-50"
                    >
                      {t("admin.delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
