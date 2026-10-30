import React, { lazy, Suspense } from "react";
import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { LocalAuthGate } from "@/delux/components/Auth/LocalAuthGate";

const DeluxApp = lazy(() => import("@/delux/App"));

function StartupFallback({ message = "Preparando seu espaço..." }: { message?: string }) {
  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-[#090B12] px-6 text-white"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/25">
          <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8" aria-hidden="true">
            <path d="M8 22L16 10L24 22" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 18L16 13L19 18" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity=".78" />
            <circle cx="16" cy="6" r="2.2" fill="white" />
          </svg>
        </div>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </main>
  );
}

class AppStartupBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[Delux startup]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#090B12] px-6 text-white">
          <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl">
            <h1 className="text-xl font-bold">Não foi possível abrir o Delux</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              O aplicativo encontrou um erro ao iniciar. Tente carregar novamente.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 min-h-12 w-full rounded-xl bg-violet-600 px-4 font-semibold text-white transition hover:bg-violet-500"
            >
              Tentar novamente
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Delux 2.0 — Planos Reais para a sua Rotina" },
      {
        name: "description",
        content: "Transforme seus objetivos em planos que cabem na rotina real, com um coach de IA.",
      },
      { property: "og:title", content: "Delux 2.0 — Planos Reais para a sua Rotina" },
      {
        property: "og:description",
        content: "Transforme seus objetivos em planos que cabem na rotina real, com um coach de IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<StartupFallback message="Carregando o Delux..." />}>
      <Suspense fallback={<StartupFallback />}>
        <AppStartupBoundary>
          <LocalAuthGate>
            <DeluxApp />
          </LocalAuthGate>
        </AppStartupBoundary>
      </Suspense>
    </ClientOnly>
  );
}
