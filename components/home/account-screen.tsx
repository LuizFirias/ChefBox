"use client";

import { useEffect, useState } from "react";

import { getAccountProfile, saveAccountProfile } from "@/lib/app-storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountScreenProps = {
  isPremium: boolean;
};

export function AccountScreen({ isPremium }: AccountScreenProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase?.auth.getUser().then(({ data }) => {
      const nextProfile = getAccountProfile({
        email: data.user?.email ?? "",
        fullName:
          typeof data.user?.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : "",
        plan: isPremium ? "Premium" : "Free",
      });

      setEmail(nextProfile.email);
      setFullName(nextProfile.fullName);
      setWeight(nextProfile.weight);
      setHeight(nextProfile.height);
    });
  }, [isPremium]);

  function handleSaveProfile() {
    saveAccountProfile({
      email,
      fullName,
      weight,
      height,
      plan: isPremium ? "Premium" : "Free",
    });

    setMessage("Dados salvos neste dispositivo.");
  }

  return (
    <section className="mt-6 space-y-4">
      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Conta
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#2D3142]">Seu perfil</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use esta área para revisar o e-mail, ajustar dados pessoais e acompanhar o plano atual.
        </p>
      </article>

      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Acesso
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-[#2D3142]">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#F7F9FB] px-4 py-3 text-sm text-[#2D3142] outline-none"
              placeholder="seu@email.com"
            />
          </label>
          <label className="block text-sm font-medium text-[#2D3142]">
            Nome
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#F7F9FB] px-4 py-3 text-sm text-[#2D3142] outline-none"
              placeholder="Como você quer aparecer"
            />
          </label>
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Informações pessoais
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#2D3142]">Peso e altura</h3>
          </div>
          <span className="rounded-full bg-[#EEF5EE] px-3 py-1 text-xs font-semibold text-[#4D7C4F]">
            {isPremium ? "Premium" : "Free"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-[#2D3142]">
            Peso
            <input
              type="text"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#F7F9FB] px-4 py-3 text-sm text-[#2D3142] outline-none"
              placeholder="72 kg"
            />
          </label>
          <label className="block text-sm font-medium text-[#2D3142]">
            Altura
            <input
              type="text"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#F7F9FB] px-4 py-3 text-sm text-[#2D3142] outline-none"
              placeholder="1,75 m"
            />
          </label>
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Plano atual
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-[#2D3142]">
              {isPremium ? "Premium" : "Free"}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Planejamento semanal e custos completos ficam conectados a este plano.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2D3142] px-4 text-sm font-semibold text-white"
          >
            Salvar
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-[#4D7C4F]">{message}</p> : null}
      </article>
    </section>
  );
}