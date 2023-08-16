/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, options) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false
        };

        return config;
    }
};

module.exports = nextConfig;
