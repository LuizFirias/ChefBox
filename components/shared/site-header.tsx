"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

import { APP_NAME } from "@/lib/config";

const AuthButton = dynamic(
  () => import("@/components/shared/auth-button").then((module) => module.AuthButton),
  {
    ssr: false,
    loading: () => (
      <div className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-500">
        Entrar
      </div>
    ),
  },
);

export function SiteHeader() {
  return (
    <header className="hidden border-b border-slate-200/80 bg-white/80 backdrop-blur md:sticky md:top-0 md:z-40 md:block">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(45,49,66,0.08)]">
            <Image
              src="/icone-mestre-1024x1024.png"
              alt={`${APP_NAME} icone`}
              width={56}
              height={56}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <Image
            src="/header%201200x400%20transparente.png"
            alt={APP_NAME}
            width={420}
            height={140}
            className="h-14 w-70 object-contain object-left lg:w-85"
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-[#2D3142] sm:inline-flex"
          >
            Abrir app
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}