"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Image from "next/image";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/config";

type FormState = "idle" | "loading" | "success" | "error";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password || password.length < 6) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres");
      setState("error");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        if (!supabase) {
          throw new Error("Supabase não está configurado");
        }

        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          throw error;
        }

        setState("success");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (error) {
        console.error("Reset password error:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível redefinir a senha. Tente novamente.",
        );
        setState("error");
      }
    });
  }

  if (state === "success") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
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
                Senha redefinida com sucesso
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-green-700">
                Você será redirecionado para a página inicial...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <Image
              src="/icone-mestre-1024x1024.png"
              alt={APP_NAME}
              width={96}
              height={96}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </div>

        {/* Reset Password Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Nova senha</h2>
            <p className="mt-2 text-sm text-slate-600">
              Digite sua nova senha abaixo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Confirmar nova senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (state === "error") {
                    setState("idle");
                    setErrorMessage(null);
                  }
                }}
                placeholder="Digite a senha novamente"
                disabled={state === "loading"}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {state === "error" && errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={state === "loading" || !password || !confirmPassword}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-6 text-base font-semibold text-white shadow-lg transition hover:bg-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 disabled:cursor-not-allowed disabled:opacity-60"
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
                  Redefinindo...
                </>
              ) : (
                <>
                  Redefinir senha
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
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-600">
          Ao continuar, você concorda com nossos{" "}
          <a href="/termos" className="font-medium text-[#FF6B35] hover:underline">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="/privacidade" className="font-medium text-[#FF6B35] hover:underline">
            Política de Privacidade
          </a>
        </p>
      </div>
    </main>
  );
}
