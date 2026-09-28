"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { useI18n } from "@/components/providers/I18nProvider";

/**
 * SectionHeading driven by dictionary keys, for use from Server Components
 * (blog, careers) where the i18n context is not directly reachable.
 */
export default function PageHeading({
  eyebrowKey,
  titleKey,
  subKey,
  align = "left",
  className = "",
}: {
  eyebrowKey: string;
  titleKey: string;
  subKey?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <SectionHeading
      eyebrow={t(eyebrowKey)}
      title={t(titleKey)}
      sub={subKey ? t(subKey) : undefined}
      align={align}
      className={className}
    />
  );
}
