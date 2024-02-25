
const FIREBASE_CONFIG = process.env.FIREBASE_CONFIG;

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        FIREBASE_CONFIG
    },
    experimental: {
        serverActions: true
    }
};

module.exports = nextConfig;
