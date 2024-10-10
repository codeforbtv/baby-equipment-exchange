require('dotenv').config();
const fs = require('fs');
const config = fs.readFileSync(process.env.FIREBASE_CONFIG ?? 'firebase-config.json', 'utf-8');

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_FIREBASE_CONFIG: config
    }//,
    // experimental: {
    //     serverActions: true
    // }
};

module.exports = nextConfig;
