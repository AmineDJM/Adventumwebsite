import type { Metadata } from "next";
import type { ReactNode } from "react";

// The admin area must never appear in search results.
export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
