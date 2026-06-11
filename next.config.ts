import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Mídia dos criativos (vídeos/thumbnails) vem de storage externo (Supabase
    // Storage, CDNs do pipeline de produção). Apenas https.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
