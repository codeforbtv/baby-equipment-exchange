/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
        serverActionsBodySizeLimit: '2mb'
    },
    webpack(config, options) {
        config.resolve.fallback = {
            ...config.resolve.fallback
        };

        return config;
    }
};

module.exports = nextConfig;
