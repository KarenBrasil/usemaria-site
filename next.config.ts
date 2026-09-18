import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Cache de 31 dias na imagem otimizada: evita reprocessar/retransferir
    // a mesma imagem a cada poucas horas (origin transfer).
    minimumCacheTTL: 2678400,
    // Sem 2048/3840: as fontes tem no maximo 1200px, variantes maiores so gastam.
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
    formats: ['image/webp'],
    qualities: [75],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
