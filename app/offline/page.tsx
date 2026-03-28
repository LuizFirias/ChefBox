export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-4xl bg-white p-8 text-center shadow-[0_24px_100px_rgba(31,26,23,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
          Offline
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-stone-950">
          Sem conexao no momento.
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          O app continua instalavel, mas as geracoes dependem da API. Assim que a internet voltar, tente novamente.
        </p>
      </div>
    </main>
  );
}