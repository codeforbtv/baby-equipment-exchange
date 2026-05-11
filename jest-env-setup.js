const fs = require('fs');
const path = require('path');

// Mirror the emulator port logic from next.config.js so Jest has the same env vars.
// next/jest already loads .env.local — this file only handles firebase.json ports.
try {
    const firebaseJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'firebase.json'), 'utf-8'));
    const emu = firebaseJSON.emulators ?? {};
    process.env.NEXT_PUBLIC_EMULATOR_FIRESTORE_PORT ??= String(emu.firestore?.port ?? 8080);
    process.env.NEXT_PUBLIC_EMULATOR_AUTH_PORT ??= String(emu.auth?.port ?? 9099);
    process.env.NEXT_PUBLIC_EMULATOR_STORAGE_PORT ??= String(emu.storage?.port ?? 9199);
    process.env.NEXT_PUBLIC_EMULATOR_FUNCTIONS_PORT ??= String(emu.functions?.port ?? 5001);
    if (process.env.NODE_ENV !== 'production') {
        process.env.FIRESTORE_EMULATOR_HOST ??= `localhost:${emu.firestore?.port ?? 8080}`;
        process.env.FIREBASE_AUTH_EMULATOR_HOST ??= `localhost:${emu.auth?.port ?? 9099}`;
        process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= `localhost:${emu.storage?.port ?? 9199}`;
    }
} catch {
    // firebase.json missing or malformed — emulator ports won't be set.
}
