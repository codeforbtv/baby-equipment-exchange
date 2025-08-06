const fs = require('fs');
const path = require('path');

//let firebaseJSONConfig = '';

//try {
//   const firebaseConfigFilePath = process.env.FIREBASE_CONFIG ?? 'firebase-config.json';
//    firebaseJSONConfig = fs.readFileSync(path.resolve(__dirname, firebaseConfigFilePath), 'utf-8');
//} catch (error) {
//    console.error('Error loading Firebase config file:', error);
//}

const config = process.env.FIREBASE_CONFIG ?? 'firebase-config.json';

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_FIREBASE_CONFIG: config
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                port: '',
                pathname: '/v0/b/baby-equipment-exchange.appspot.com/**'
            }
        ]
    }
};

module.exports = nextConfig;
