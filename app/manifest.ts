import type { MetadataRoute } from "next";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fbf6ef",
    theme_color: "#1f1a17",
    orientation: "portrait",
    icons: [
      {
        src: "/PWA-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/PWA-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}