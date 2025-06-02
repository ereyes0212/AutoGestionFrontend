
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
};

export default nextConfig;
