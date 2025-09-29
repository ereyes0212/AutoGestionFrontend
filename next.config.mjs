
// next.config.js
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com'],
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.plugins.push(new PrismaPlugin());
        }
        return config;
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        preloadEntriesOnStart: false,
    },
    webpack: (
        config,
        { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
    ) => {
        if (config.cache && !dev) {
            config.cache = Object.freeze({
                type: 'memory',
            })
        }
        // Important: return the modified config
        return config
    },
};

export default nextConfig;
