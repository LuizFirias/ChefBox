"use client";

import { useEffect, useState } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [mounted, setMounted] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSupabase(createSupabaseBrowserClient());
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      setMessage(null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!mounted) {
    return (
      <div className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-500">
        Entrar
      </div>
    );
  }

  async function handleLogin() {
    if (!supabase) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setMessage("Digite seu e-mail para receber o link.");
      return;
    }

    setBusy(true);
    setMessage(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setMessage("Nao foi possivel enviar o link agora.");
      setBusy(false);
      return;
    }

    setMessage("Link enviado. Confira sua caixa de entrada.");
    setEmail("");

    setBusy(false);
  }

  if (userEmail) {
    return (
      <div className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-900">
        {userEmail}
      </div>
    );
  }

  return (
    <div className="flex min-w-[280px] flex-col gap-2 md:min-w-[320px]">
      <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-white/80 p-1.5 shadow-sm">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Seu e-mail"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-stone-900 outline-none placeholder:text-stone-400"
          disabled={busy || !supabase}
        />
        <button
          type="button"
          onClick={handleLogin}
          disabled={busy || !supabase}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Enviando..." : "Entrar"}
        </button>
      </div>
      <p className="px-2 text-xs text-stone-500">
        {message ?? "Receba um link magico para entrar sem senha."}
      </p>
    </div>
  );
}