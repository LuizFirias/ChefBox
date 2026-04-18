"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type FormState = "idle" | "loading" | "success" | "error";
type AuthMode = "signin" | "signup" | "reset";

function LoginFormContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !isValidEmail(email)) {
      setErrorMessage("Digite um e-mail válido");
      setState("error");
      return;
    }

    if (mode !== "reset" && (!password || password.length < 6)) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        
        if (!supabase) {
          throw new Error("Erro ao conectar ao serviço de autenticação");
        }

        if (mode === "reset") {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
          });

          if (error) {
            throw error;
          }

          setState("success");
        } else if (mode === "signup") {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;

          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) throw signInError;

          await new Promise(resolve => setTimeout(resolve, 1500));
          router.refresh();
          router.push(redirectTo);
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          await new Promise(resolve => setTimeout(resolve, 1500));
          router.refresh();
          router.push(redirectTo);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível autenticar. Tente novamente.",
        );
        setState("error");
      }
    });
  }

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 fill-none stroke-green-600"
            strokeWidth="2"
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-900">
          Verifique seu e-mail
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-green-700">
          Enviamos um link de recuperação para <strong>{email}</strong>. Clique no link
          para redefinir sua senha.
        </p>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setEmail("");
            setMode("signin");
          }}
          className="mt-4 text-sm font-medium text-green-600 hover:text-green-700"
        >
          Voltar ao login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mode !== "reset" && (
        <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setState("idle");
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              mode === "signin"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setState("idle");
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cadastrar
          </button>
        </div>
      )}

      {mode === "reset" && (
        <div className="rounded-2xl bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Redefinir senha</h3>
          <p className="mt-1 text-sm text-slate-600">Digite seu e-mail para receber o link de recuperação</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") {
                setState("idle");
                setErrorMessage(null);
              }
            }}
            placeholder="seu@email.com"
            disabled={state === "loading"}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        {mode !== "reset" && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (state === "error") {
                  setState("idle");
                  setErrorMessage(null);
                }
              }}
              placeholder="Mínimo 6 caracteres"
              disabled={state === "loading"}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
        )}

        {state === "error" && errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={state === "loading"}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-6 text-base font-semibold text-white shadow-lg transition hover:bg-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-60 disabled:hover:bg-slate-300"
        >
          {state === "loading" ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {mode === "reset" ? "Enviando..." : "Entrando..."}
            </>
          ) : (
            <>
              {mode === "signin" && "Entrar"}
              {mode === "signup" && "Criar conta"}
              {mode === "reset" && "Enviar link de recuperação"}
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-none stroke-current"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => {
              setMode("reset");
              setState("idle");
              setErrorMessage(null);
              setPassword("");
            }}
            className="text-sm text-slate-600 hover:text-[#FF6B35] transition"
          >
            Esqueci minha senha
          </button>
        )}

        {mode === "reset" && (
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setState("idle");
              setErrorMessage(null);
            }}
            className="text-sm text-slate-600 hover:text-[#FF6B35] transition"
          >
            Voltar ao login
          </button>
        )}
      </form>
    </div>
  );
}

// Export wrapped version with Suspense to handle useSearchParams
export function LoginForm() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#FF6B35]" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
