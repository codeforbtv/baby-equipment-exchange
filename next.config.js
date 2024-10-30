const fs = require('fs');
const path = require('path');

let firebaseJSONConfig = '';

try {
    const firebaseConfigFilePath = process.env.FIREBASE_CONFIG ?? 'firebase-config.json';
    firebaseJSONConfig = fs.readFileSync(path.resolve(__dirname, firebaseConfigFilePath), 'utf-8');
} catch (error) {
    console.error('Error loading Firebase config file:', error);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_FIREBASE_CONFIG: firebaseJSONConfig 
    },
};

module.exports = nextConfig;