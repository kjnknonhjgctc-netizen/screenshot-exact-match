import { Button } from "@/components/ui/button";
import React, { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sun } from "lucide-react";
import { WelcomeChoice } from "./WelcomeChoice";

type LocalAccount = { email: string; salt: string; passwordHash: string; createdAt: string };
const ACCOUNT_KEY = "delux_local_account_v1";
const SESSION_KEY = "delux_local_session_v1";

async function hashPassword(password: string, salt: string) {
  if (!globalThis.crypto?.subtle)
    throw new Error(
      "Este navegador não oferece o recurso de segurança necessário. Atualize o navegador e tente novamente.",
    );
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readAccount(): LocalAccount | null {
  try {
    const value = localStorage.getItem(ACCOUNT_KEY);
    return value ? (JSON.parse(value) as LocalAccount) : null;
  } catch {
    return null;
  }
}

export const LocalAuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [hasChosenEntry, setHasChosenEntry] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      setHasSession(localStorage.getItem(SESSION_KEY) === "active");
      setHasChosenEntry(localStorage.getItem("delux_entry_choice_v1") !== null);
      const account = readAccount();
      if (account) setMode("login");
    } finally {
      setReady(true);
    }
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Digite um e-mail válido.");
      return;
    }
    if (password.length < 8) {
      setError("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const account = readAccount();
      if (mode === "signup") {
        if (account) {
          setError(
            "Já existe um perfil local neste navegador. Entre com ele ou use outro navegador para um perfil separado.",
          );
          setMode("login");
          return;
        }
        const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join("");
        const passwordHash = await hashPassword(password, salt);
        localStorage.setItem(
          ACCOUNT_KEY,
          JSON.stringify({
            email: normalizedEmail,
            salt,
            passwordHash,
            createdAt: new Date().toISOString(),
          } satisfies LocalAccount),
        );
        localStorage.setItem(SESSION_KEY, "active");
        setHasSession(true);
      } else {
        if (!account || account.email !== normalizedEmail) {
          setError("Não encontrei um perfil local com esse e-mail neste navegador.");
          return;
        }
        const candidate = await hashPassword(password, account.salt);
        if (candidate !== account.passwordHash) {
          setError("Senha incorreta. Confira os dados e tente novamente.");
          return;
        }
        localStorage.setItem(SESSION_KEY, "active");
        setHasSession(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <div className="min-h-screen bg-delux-canvas" />;
  if (hasSession) return <>{children}</>;
  if (!hasChosenEntry) return <WelcomeChoice onContinue={() => setHasChosenEntry(true)} />;

  return (
    <main className="delux-app delux-auth min-h-[100dvh] bg-delux-canvas text-delux-light flex items-center justify-center px-4 py-8 sm:px-6">
      <Button
        variant="delux"
        size="delux"
        type="button"
        aria-label="Alternar aparência"
        className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-lg border border-delux-light/10 bg-delux-light/[0.06] text-delux-attention shadow-lg shadow-delux-ink/20 transition hover:bg-delux-light/10"
      >
        <Sun className="h-5 w-5" />
      </Button>
      <section className="relative w-full max-w-[560px] overflow-hidden rounded-lg border border-delux-light/[0.11] bg-delux-surface/90 p-6 shadow-delux-panel backdrop-blur-2xl sm:p-10">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-delux-light/30 to-transparent" />
        <div className="mx-auto mb-8 flex items-center justify-center gap-3">
          <div className="grid h-[60px] w-[60px] place-items-center rounded-lg bg-gradient-to-br from-delux-elevated via-delux-elevated to-delux-elevated shadow-lg shadow-delux-elevated/30">
            <svg viewBox="0 0 32 32" fill="none" className="h-9 w-9" aria-hidden="true">
              <path
                d="M8 22L16 10L24 22"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 18L16 13L19 18"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity=".78"
              />
              <circle cx="16" cy="6" r="2.2" fill="currentColor" />
            </svg>
          </div>
          <span className="text-4xl font-semibold tracking-tight">Delux</span>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">
            {mode === "signup" ? "Comece no Delux" : "Bom ter você de volta"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-delux-secondary sm:text-lg">
            {mode === "signup"
              ? "Crie seu perfil e organize seus objetivos em um só lugar."
              : "Entre no perfil salvo neste navegador para continuar sua jornada."}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 rounded-lg bg-delux-surface p-1.5">
          <Button
            variant="delux"
            size="delux"
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setNotice("");
            }}
            className={`min-h-12 rounded-lg px-2 text-sm font-semibold transition-all sm:text-base ${mode === "signup" ? "bg-delux-elevated text-delux-light shadow-md" : "text-delux-secondary hover:text-delux-light"}`}
          >
            Criar Conta
          </Button>
          <Button
            variant="delux"
            size="delux"
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setNotice("");
            }}
            className={`min-h-12 rounded-lg px-2 text-sm font-semibold transition-all sm:text-base ${mode === "login" ? "bg-delux-elevated text-delux-light shadow-md" : "text-delux-secondary hover:text-delux-light"}`}
          >
            Já tenho conta
          </Button>
        </div>

        <div className="mt-6 flex gap-3 rounded-lg border border-delux-success/20 bg-delux-success/[0.07] p-4 text-sm leading-relaxed text-delux-success sm:text-base">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Perfil local: seus dados ficam neste navegador. Não há sincronização entre aparelhos nem
            recuperação de senha por e-mail.
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="delux-auth-email"
              className="mb-2 block text-sm font-semibold text-delux-text sm:text-base"
            >
              E-mail
            </label>
            <input
              id="delux-auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="min-h-[60px] w-full rounded-lg border border-delux-secondary/70 bg-delux-elevated px-4 text-base text-delux-light outline-none transition placeholder:text-delux-secondary focus:border-delux-accent focus:ring-4 focus:ring-delux-accent/15 sm:px-5 sm:text-lg"
            />
          </div>
          <div>
            <label
              htmlFor="delux-auth-password"
              className="mb-2 block text-sm font-semibold text-delux-text sm:text-base"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="delux-auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
                minLength={8}
                required
                className="min-h-[60px] w-full rounded-lg border border-delux-secondary/70 bg-delux-elevated px-4 pr-14 text-base text-delux-light outline-none transition placeholder:text-delux-secondary focus:border-delux-accent focus:ring-4 focus:ring-delux-accent/15 sm:px-5 sm:text-lg"
              />
              <Button
                variant="delux"
                size="delux"
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-2 grid w-11 place-items-center text-delux-secondary hover:text-delux-light"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-delux-warning/20 bg-delux-warning/10 px-4 py-3 text-sm text-delux-warning"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="rounded-lg border border-delux-success/20 bg-delux-success/10 px-4 py-3 text-sm text-delux-success"
            >
              {notice}
            </p>
          )}
          <Button
            variant="delux"
            size="delux"
            type="submit"
            disabled={busy}
            className="group flex min-h-[60px] w-full items-center justify-center gap-2 rounded-lg border border-delux-light/20 bg-gradient-to-r from-delux-elevated via-delux-elevated to-delux-elevated px-5 text-base font-semibold text-delux-light shadow-lg shadow-delux-elevated/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-delux-accent/30 disabled:cursor-wait disabled:opacity-60 sm:text-lg"
          >
            {busy ? "Aguarde..." : mode === "signup" ? "Criar e Acessar Agora" : "Entrar no Delux"}
            {!busy && (
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm leading-relaxed text-delux-secondary sm:text-base">
          {mode === "signup" ? (
            <>
              Já possui um perfil salvo?{" "}
              <Button
                variant="delux"
                size="delux"
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="font-semibold text-delux-accent hover:text-delux-accent"
              >
                Entrar com e-mail e senha
              </Button>
            </>
          ) : (
            <>
              Ainda não tem perfil?{" "}
              <Button
                variant="delux"
                size="delux"
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="font-semibold text-delux-accent hover:text-delux-accent"
              >
                Criar uma conta local
              </Button>
            </>
          )}
        </p>
      </section>
    </main>
  );
};
