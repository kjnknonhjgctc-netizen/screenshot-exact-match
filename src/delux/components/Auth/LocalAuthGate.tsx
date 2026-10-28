import React, { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sun } from "lucide-react";

type LocalAccount = { email: string; salt: string; passwordHash: string; createdAt: string };
const ACCOUNT_KEY = "delux_local_account_v1";
const SESSION_KEY = "delux_local_session_v1";

async function hashPassword(password: string, salt: string) {
  if (!globalThis.crypto?.subtle) throw new Error("Este navegador não oferece o recurso de segurança necessário. Atualize o navegador e tente novamente.");
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readAccount(): LocalAccount | null {
  try {
    const value = localStorage.getItem(ACCOUNT_KEY);
    return value ? JSON.parse(value) as LocalAccount : null;
  } catch { return null; }
}

export const LocalAuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
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
          setError("Já existe um perfil local neste navegador. Entre com ele ou use outro navegador para um perfil separado.");
          setMode("login");
          return;
        }
        const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
        const passwordHash = await hashPassword(password, salt);
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ email: normalizedEmail, salt, passwordHash, createdAt: new Date().toISOString() } satisfies LocalAccount));
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

  if (!ready) return <div className="min-h-screen bg-[#090B12]" />;
  if (hasSession) return <>{children}</>;

  return (
    <main className="delux-auth min-h-[100dvh] bg-[#090B12] text-white flex items-center justify-center px-4 py-8 sm:px-6">
      <button type="button" aria-label="Alternar aparência" className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-amber-300 shadow-lg shadow-black/20 transition hover:bg-white/10">
        <Sun className="h-5 w-5" />
      </button>
      <section className="relative w-full max-w-[560px] overflow-hidden rounded-[30px] border border-white/[0.11] bg-[#121622]/90 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-10">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="mx-auto mb-8 flex items-center justify-center gap-3">
          <div className="grid h-[60px] w-[60px] place-items-center rounded-[20px] bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/30">
            <svg viewBox="0 0 32 32" fill="none" className="h-9 w-9" aria-hidden="true">
              <path d="M8 22L16 10L24 22" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 18L16 13L19 18" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity=".78" />
              <circle cx="16" cy="6" r="2.2" fill="white" />
            </svg>
          </div>
          <span className="text-4xl font-extrabold tracking-tight">Delux</span>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[34px]">{mode === "signup" ? "Comece no Delux" : "Bom ter você de volta"}</h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-400 sm:text-lg">
            {mode === "signup" ? "Crie seu perfil e organize seus objetivos em um só lugar." : "Entre no perfil salvo neste navegador para continuar sua jornada."}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 rounded-2xl bg-[#202B40] p-1.5">
          <button type="button" onClick={() => { setMode("signup"); setError(""); setNotice(""); }} className={`min-h-12 rounded-xl px-2 text-sm font-bold transition-all sm:text-base ${mode === "signup" ? "bg-[#34445D] text-white shadow-md" : "text-slate-400 hover:text-white"}`}>Criar Conta</button>
          <button type="button" onClick={() => { setMode("login"); setError(""); setNotice(""); }} className={`min-h-12 rounded-xl px-2 text-sm font-bold transition-all sm:text-base ${mode === "login" ? "bg-[#34445D] text-white shadow-md" : "text-slate-400 hover:text-white"}`}>Já tenho conta</button>
        </div>

        <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] p-4 text-sm leading-relaxed text-emerald-300 sm:text-base">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Perfil local: seus dados ficam neste navegador. Não há sincronização entre aparelhos nem recuperação de senha por e-mail.</p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="delux-auth-email" className="mb-2 block text-sm font-semibold text-slate-200 sm:text-base">E-mail</label>
            <input id="delux-auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="min-h-[60px] w-full rounded-2xl border border-slate-600/70 bg-[#1C293D] px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15 sm:px-5 sm:text-lg" />
          </div>
          <div>
            <label htmlFor="delux-auth-password" className="mb-2 block text-sm font-semibold text-slate-200 sm:text-base">Senha</label>
            <div className="relative">
              <input id="delux-auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" minLength={8} required className="min-h-[60px] w-full rounded-2xl border border-slate-600/70 bg-[#1C293D] px-4 pr-14 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15 sm:px-5 sm:text-lg" />
              <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-2 grid w-11 place-items-center text-slate-400 hover:text-white">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{notice}</p>}
          <button type="submit" disabled={busy} className="group flex min-h-[60px] w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 px-5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/30 disabled:cursor-wait disabled:opacity-60 sm:text-lg">
            {busy ? "Aguarde..." : mode === "signup" ? "Criar e Acessar Agora" : "Entrar no Delux"}
            {!busy && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>
        <p className="mt-6 text-center text-sm leading-relaxed text-slate-400 sm:text-base">
          {mode === "signup" ? <>Já possui um perfil salvo? <button type="button" onClick={() => { setMode("login"); setError(""); }} className="font-bold text-blue-400 hover:text-blue-300">Entrar com e-mail e senha</button></> : <>Ainda não tem perfil? <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="font-bold text-blue-400 hover:text-blue-300">Criar uma conta local</button></>}
        </p>
      </section>
    </main>
  );
};
