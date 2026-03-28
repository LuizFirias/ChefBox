"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function handleInstall() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (!installEvent) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="inline-flex items-center justify-center rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-stone-900/10 transition hover:bg-stone-700"
    >
      Instalar app
    </button>
  );
}