import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    preloadEntriesOnStart: false,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (isServer) {
      config.plugins.push(new PrismaPlugin());
    }

    if (!dev) {
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
      };
    }

    return config;
  },
};

export default nextConfig;
