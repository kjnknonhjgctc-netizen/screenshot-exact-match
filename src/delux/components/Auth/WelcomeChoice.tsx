import { useEffect, useState } from "react";
import { ArrowRight, Check, Download, Globe2, Smartphone, Sparkles } from "lucide-react";

const ENTRY_KEY = "delux_entry_choice_v1";

type WelcomeChoiceProps = { onContinue: () => void };

export function WelcomeChoice({ onContinue }: WelcomeChoiceProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [help, setHelp] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      }, { once: true });
    }
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const continueWith = (choice: "installed" | "browser") => {
    try {
      localStorage.setItem(ENTRY_KEY, choice);
    } catch {
      // The entry choice is optional; the app remains usable without storage.
    }
    onContinue();
  };

  const install = async () => {
    if (!installPrompt) {
      setHelp(true);
      return;
    }
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (result.outcome === "accepted") continueWith("installed");
      else setInstalling(false);
    } catch {
      setInstalling(false);
      setHelp(true);
    }
  };

  return (
    <main className="delux-app min-h-[100dvh] bg-delux-canvas text-delux-light flex items-center justify-center px-5 py-10 sm:px-8">
      <section className="w-full max-w-[720px]">
        <div className="mb-12 flex items-center justify-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-delux-light/10 bg-delux-light/[0.06] text-delux-accent">
            <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
              <path d="M8 22L16 10L24 22" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 18L16 13L19 18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity=".78" />
              <circle cx="16" cy="6" r="2.2" fill="currentColor" />
            </svg>
          </div>
          <span className="text-3xl font-semibold tracking-[0.16em]">DELUX</span>
        </div>

        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-delux-light/10 bg-delux-light/[0.04] px-3 py-1.5 text-xs font-medium tracking-wide text-delux-secondary">
            <Sparkles className="h-3.5 w-3.5 text-delux-accent" />
            SEU PRÓXIMO PASSO COMEÇA AQUI
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Como deseja acessar o DELUX?</h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-delux-secondary sm:text-lg">
            Tenha seus objetivos e planos sempre à mão. Escolha como prefere começar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={install}
            disabled={installing}
            className="group relative flex min-h-[230px] flex-col rounded-3xl border border-delux-accent/35 bg-delux-light/[0.055] p-6 text-left shadow-[0_18px_60px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-1 hover:border-delux-accent/70 hover:bg-delux-light/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-delux-accent"
          >
            <span className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-delux-accent/10 text-delux-accent">
              <Download className="h-6 w-6" />
            </span>
            <span className="text-xl font-semibold">Instalar aplicativo</span>
            <span className="mt-2 text-sm leading-relaxed text-delux-secondary">
              Adicione o DELUX à tela inicial e abra em uma janela própria, como um aplicativo.
            </span>
            <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-delux-accent">
              {installing ? "Aguardando confirmação..." : "Instalar agora"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => continueWith("browser")}
            className="group flex min-h-[230px] flex-col rounded-3xl border border-delux-light/10 bg-delux-surface/70 p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-delux-light/25 hover:bg-delux-light/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-delux-accent"
          >
            <span className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-delux-light/[0.07] text-delux-light">
              <Globe2 className="h-6 w-6" />
            </span>
            <span className="text-xl font-semibold">Continuar pelo navegador</span>
            <span className="mt-2 text-sm leading-relaxed text-delux-secondary">
              Acesse diretamente pelo navegador. Você poderá instalar o aplicativo depois.
            </span>
            <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-delux-light">
              Continuar na web
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </div>

        {help && (
          <div role="status" className="mt-5 rounded-2xl border border-delux-light/10 bg-delux-surface p-5 text-sm text-delux-secondary">
            <div className="mb-2 flex items-center gap-2 font-semibold text-delux-light">
              <Smartphone className="h-4 w-4 text-delux-accent" />
              Como instalar o DELUX
            </div>
            <p>
              No Android, abra o menu do navegador (⋮) e escolha “Instalar app” ou “Adicionar à tela inicial”.
              No iPhone/iPad, toque em “Compartilhar” e depois em “Adicionar à Tela de Início”.
            </p>
            <button type="button" onClick={() => continueWith("browser")} className="mt-4 inline-flex items-center gap-2 font-semibold text-delux-accent hover:underline">
              Continuar pelo navegador <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-delux-muted">
          <Check className="h-3.5 w-3.5" />
          A mesma experiência DELUX, com ou sem instalação.
        </p>
      </section>
    </main>
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
