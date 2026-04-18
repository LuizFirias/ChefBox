import type { Metadata } from "next";
import Image from "next/image";

import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesse sua conta ChefBox com email",
};

export default function LoginPage() {
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

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <p className="text-sm text-slate-600">
              Digite seu e-mail e senha para acessar sua conta
            </p>
          </div>

          <LoginForm />
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
