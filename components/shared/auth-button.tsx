"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthButton() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    setIsLoggingOut(true);
    await supabase.auth.signOut({ scope: "local" });
    setUserEmail(null);
    setIsLoggingOut(false);
    router.push("/login");
  }

  if (!mounted) {
    return (
      <div className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-500">
        Entrar
      </div>
    );
  }

  if (userEmail) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-medium text-stone-700 sm:inline">
          {userEmail}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white/80 px-6 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:border-stone-400"
    >
      Entrar
    </Link>
  );
}