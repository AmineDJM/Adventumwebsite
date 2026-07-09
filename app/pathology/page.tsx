import type { Metadata } from "next";
import PathologyContent from "@/components/pathology/PathologyContent";

export const metadata: Metadata = {
  title: "MyPathology — Adventum Pharma",
  description:
    "An immersive, interactive exploration of infectious disease biology — the HIV replication cycle, pathogen structures and where therapeutic classes act. Educational visualization only.",
};

export default function PathologyPage() {
  return <PathologyContent />;
}
