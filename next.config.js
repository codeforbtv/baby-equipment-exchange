/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const config = process.env.FIREBASE_CONFIG ?? 'firebase-config.json';
let emulatorEnv = {};

try {
    const firebaseJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'firebase.json'), 'utf-8'));
    const emu = firebaseJSON.emulators ?? {};
    emulatorEnv = {
        NEXT_PUBLIC_EMULATOR_FIRESTORE_PORT: String(emu.firestore?.port ?? 8080),
        NEXT_PUBLIC_EMULATOR_AUTH_PORT: String(emu.auth?.port ?? 9099),
        NEXT_PUBLIC_EMULATOR_STORAGE_PORT: String(emu.storage?.port ?? 9199),
        NEXT_PUBLIC_EMULATOR_FUNCTIONS_PORT: String(emu.functions?.port ?? 5001)
    };

    if (process.env.NODE_ENV !== 'production') {
        emulatorEnv.FIRESTORE_EMULATOR_HOST = `localhost:${emu.firestore?.port ?? 8080}`;
        emulatorEnv.FIREBASE_AUTH_EMULATOR_HOST = `localhost:${emu.auth?.port ?? 9099}`;
        emulatorEnv.FIREBASE_STORAGE_EMULATOR_HOST = `localhost:${emu.storage?.port ?? 9199}`;
        process.env.FIRESTORE_EMULATOR_HOST ??= emulatorEnv.FIRESTORE_EMULATOR_HOST;
        process.env.FIREBASE_AUTH_EMULATOR_HOST ??= emulatorEnv.FIREBASE_AUTH_EMULATOR_HOST;
        process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= emulatorEnv.FIREBASE_STORAGE_EMULATOR_HOST;
    }
} catch {
    // firebase.json missing or malformed; emulator ports will not be injected.
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_FIREBASE_CONFIG: config,
        ...emulatorEnv
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                port: '',
                pathname: '/v0/b/baby-equipment-exchange.appspot.com/**'
            },
            {
                protocol: 'https',
                hostname: 'placehold.co'
            }
        ]
    }
};

module.exports = nextConfig;
