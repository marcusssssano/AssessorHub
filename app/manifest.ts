import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vantage",
    short_name: "Vantage",
    description: "Searchable directory of county assessor links and note templates",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6fa",
    theme_color: "#0b1f3f",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
