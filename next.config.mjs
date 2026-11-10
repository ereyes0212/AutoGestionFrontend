import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  images: {
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    preloadEntriesOnStart: false,
    optimizePackageImports: ['lucide-react', 'date-fns'],
    cpus: 2,
    // instrumentation.ts: retoma la cola de conversión de videos al arrancar
    instrumentationHook: true,
    // ffmpeg-static / ffprobe-static resuelven la ruta del binario con __dirname: no se deben empaquetar
    serverComponentsExternalPackages: ['ffmpeg-static', 'ffprobe-static'],
    // Incluir los binarios en el build standalone (en producción también se puede usar FFMPEG_PATH/FFPROBE_PATH)
    outputFileTracingIncludes: {
      '/**/*': [
        './node_modules/ffmpeg-static/ffmpeg',
        './node_modules/ffprobe-static/bin/linux/x64/ffprobe',
      ],
    },
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
