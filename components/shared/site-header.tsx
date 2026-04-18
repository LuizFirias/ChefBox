"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  
  // Hide header on login page
  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="hidden h-15 border-b border-slate-200/80 bg-white shadow-sm md:sticky md:top-0 md:z-40 md:flex">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/letreiro 1600x480 (1).png"
            alt={APP_NAME}
            width={160}
            height={48}
            className="h-10 object-contain"
            style={{ width: 'auto' }}
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}