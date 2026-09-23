import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Fotos enviadas pelo painel admin vao para o Storage do Supabase.
        // Sem isto o next/image recusa a URL e a foto nao aparece.
        protocol: 'https',
        hostname: '**.supabase.co',
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

  // As fotos do catalogo nunca mudam de conteudo (nome novo = arquivo novo),
  // entao o navegador e a CDN podem guardar por 1 ano. Cada visita repetida
  // deixa de baixar tudo de novo.
  // A home virou estatica; filtros e busca vivem em /colecoes. Links antigos
  // (anuncios, favoritos) com ?filter= / ?cat= / ?q= na home vao para la.
  async redirects() {
    return ['filter', 'cat', 'q'].map((key) => ({
      source: '/',
      has: [{ type: 'query' as const, key }],
      destination: '/colecoes',
      permanent: false,
    }));
  },

  async headers() {
    return [
      {
        source: '/novas-pecas/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
