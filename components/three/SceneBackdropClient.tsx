"use client";

import dynamic from "next/dynamic";

// Code-split the heavy Three.js scene into its own chunk, loaded on the
// client after first paint. The dark gradient base is shown until it mounts.
const SceneBackdrop = dynamic(() => import("./SceneBackdrop"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 bg-abyss"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 72% 22%, rgba(77,155,240,0.10), transparent 60%)," +
          "radial-gradient(ellipse 55% 45% at 20% 78%, rgba(31,196,221,0.08), transparent 60%)," +
          "linear-gradient(180deg, #050b17 0%, #02050c 100%)",
      }}
    />
  ),
});

export default function SceneBackdropClient() {
  return <SceneBackdrop />;
}
