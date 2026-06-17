import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    // O lojista cola URLs de fotos de qualquer host no painel — libera https geral
    // (o ProductImage já tem fallback de emoji se a imagem falhar).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
