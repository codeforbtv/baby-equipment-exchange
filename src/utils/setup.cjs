// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({
    path: '.env.local' // Suppress the @typescript-eslint/no-var-requires rule.
});
(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const execSync = require('child_process').execSync; // Suppress the @typescript-eslint/no-var-requires rule.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs'); // Suppress the @typescript-eslint/no-var-requires rule.
        const firebaseJSON = fs.existsSync('firebase.json') ? JSON.parse(fs.readFileSync('firebase.json', 'utf8')) : undefined;
        const FIREBASE_EMULATORS_FIRESTORE_PORT = firebaseJSON.emulators?.firestore?.port || 8080;
        const FIREBASE_EMULATORS_AUTH_PORT = firebaseJSON.emulators?.auth?.port || 8099;
        const FIREBASE_EMULATORS_STORAGE_PORT = firebaseJSON.emulators?.auth?.port || 9199;
    let cmd = process.argv.splice(2).join(' ').slice(6);
    if (process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY !== undefined) {
        execSync(
            `node ./node_modules/dotenv-cli/cli.js -v NEXT_PUBLIC_FIREBASE_EMULATORS_FIRESTORE_PORT=${FIREBASE_EMULATORS_FIRESTORE_PORT} -v NEXT_PUBLIC_FIREBASE_EMULATORS_AUTH_PORT=${FIREBASE_EMULATORS_AUTH_PORT} -v NEXT_PUBLIC_FIREBASE_EMULATORS_STORAGE_PORT=${FIREBASE_EMULATORS_STORAGE_PORT}  -- node ./node_modules/firebase-tools/lib/bin/firebase.js --ui --import=${process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY} emulators:exec "${cmd}"`,
            { stdio: 'inherit' }
        );
    } else {
        execSync(`${cmd}`, { stdio: 'inherit' });
    }
})();