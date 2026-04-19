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
      <button
        type="button"
        onClick={() => {
          if (window.location.pathname !== "/") {
            window.location.href = "/?tab=account";
          } else {
            window.dispatchEvent(new CustomEvent("navigateToAccount"));
          }
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#E05A2B] to-[#FF8C42] text-white shadow-md transition hover:shadow-lg"
        title="Minha conta"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
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