import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LocalAuthGate } from "@/delux/components/Auth/LocalAuthGate";
import { useAppearance } from "@/delux/theme/appearance";

const DeluxApp = lazy(() => import("@/delux/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Delux 2.0 — Planos Reais para a sua Rotina" },
      {
        name: "description",
        content:
          "Transforme seus objetivos em planos que cabem na rotina real, com um coach de IA.",
      },
      { property: "og:title", content: "Delux 2.0 — Planos Reais para a sua Rotina" },
      {
        property: "og:description",
        content:
          "Transforme seus objetivos em planos que cabem na rotina real, com um coach de IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useAppearance();
  return (
    <ClientOnly fallback={<div className="min-h-screen" />}>
      <Suspense fallback={<div className="min-h-screen bg-delux-canvas" />}>
        <LocalAuthGate>
          <DeluxApp />
        </LocalAuthGate>
      </Suspense>
    </ClientOnly>
  );
}
