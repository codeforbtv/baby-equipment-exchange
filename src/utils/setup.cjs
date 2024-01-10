// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({
    path: '.env.local' // Suppress the @typescript-eslint/no-var-requires rule.
});
(() => {
    let cmd = process.argv.splice(2).join(' ').slice(6);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const execSync = require('child_process').execSync; // Suppress the @typescript-eslint/no-var-requires rule.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs'); // Suppress the @typescript-eslint/no-var-requires rule.
    const firebaseJSON = fs.existsSync('firebase.json') ? JSON.parse(fs.readFileSync('firebase.json', 'utf8')) : undefined;
    if (firebaseJSON === undefined || process.env.FIREBASE_EMULATORS_IMPORT_DIRECTORY === undefined) {
        execSync(`${cmd}`, { stdio: 'inherit' });
    } else {
        const FIREBASE_EMULATORS_FIRESTORE_PORT = firebaseJSON.emulators?.firestore?.port ?? 8080;
        const FIREBASE_EMULATORS_FUNCTIONS_PORT = firebaseJSON.emulators?.functions?.port ?? 5001;
        const FIREBASE_EMULATORS_AUTH_PORT = firebaseJSON.emulators?.auth?.port ?? 9099;
        const FIREBASE_EMULATORS_STORAGE_PORT = firebaseJSON.emulators?.storage?.port ?? 9199;
        const TIMESTAMP = Date.now();
        const DATA_DIRECTORY_CMD = fs.existsSync(process.env.FIREBASE_EMULATORS_IMPORT_DIRECTORY)
            ? `--export-on-exit="${process.env.FIREBASE_EMULATORS_IMPORT_DIRECTORY}-${TIMESTAMP}" --import="${process.env.FIREBASE_EMULATORS_IMPORT_DIRECTORY}"`
            : `--export-on-exit=${process.env.FIREBASE_EMULATORS_IMPORT_DIRECTORY}`;
        execSync(
            `node ./node_modules/dotenv-cli/cli.js -v NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY=${process.env.FIREBASE_EMULATORS_IMPORT_DIRECTORY} -v NEXT_PUBLIC_FIREBASE_EMULATORS_FIRESTORE_PORT=${FIREBASE_EMULATORS_FIRESTORE_PORT} -v NEXT_PUBLIC_FIREBASE_EMULATORS_FUNCTIONS_PORT=${FIREBASE_EMULATORS_FUNCTIONS_PORT} -v NEXT_PUBLIC_FIREBASE_EMULATORS_AUTH_PORT=${FIREBASE_EMULATORS_AUTH_PORT} -v NEXT_PUBLIC_FIREBASE_EMULATORS_STORAGE_PORT=${FIREBASE_EMULATORS_STORAGE_PORT}  -- firebase --ui ${DATA_DIRECTORY_CMD} emulators:exec "${cmd}"`,
            { stdio: 'inherit' }
        );
    }
})();
