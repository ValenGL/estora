import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Estora",
    short_name: "Estora",
    description: "Auto generative CRM",
    start_url: "/",
    display: "standalone",
    background_color: "#214338",
    theme_color: "#ffffff",
    scope: "/",
    orientation: "portrait", //
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    prefer_related_applications: false,
    lang: "es-AR",
  };
}
