require('dotenv').config();
//const fs = require('fs');
//const config = fs.readFileSync(process.env.FIREBASE_CONFIG ?? 'firebase-config.json', 'utf-8');

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_FIREBASE_CONFIG: process.env.FIREBASE_CONFIG
    }//,
    // experimental: {
    //     serverActions: true
    // }
};

module.exports = nextConfig;
