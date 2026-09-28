"use client";

import { useI18n } from "@/components/providers/I18nProvider";

/**
 * Inline translated string usable inside a Server Component. The surrounding
 * page still server-renders — only this label hydrates — so SEO-critical
 * content stays in the initial HTML.
 */
export default function T({ k }: { k: string }) {
  const { t } = useI18n();
  return <>{t(k)}</>;
}
