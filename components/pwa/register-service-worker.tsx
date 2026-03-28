"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });

      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            void caches.delete(key);
          });
        });
      }

      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignore registration errors in local setup.
    });
  }, []);

  return null;
}