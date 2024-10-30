function _sanitize(text) {
    if (text == null) {
        return text;
    }
    return text.replace(/[^\d]/g, '');
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({
    path: '.env.local' // Suppress the @typescript-eslint/no-var-requires rule.
});
(() => {
    const CMD_RAW = parseInt(_sanitize(process.argv.splice(2).join(' ').slice(6)));
    let cmd = 'next dev';
    switch (CMD_RAW) {
        case 1:
            cmd = 'node ./node_modules/jest/bin/jest.js .*/.*.unit.test.ts.*';
            break;
        default:
            break;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const execSync = require('child_process').execSync; // Suppress the @typescript-eslint/no-var-requires rule.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs'); // Suppress the @typescript-eslint/no-var-requires rule.
    const firebaseJSON = fs.existsSync('firebase.json') ? JSON.parse(fs.readFileSync('firebase.json', 'utf8')) : undefined;
    if (firebaseJSON === undefined || process.env.FIREBASE_EMULATORS_IMPORT_DIRECTORY === undefined) {
        execSync(`${cmd}`, { stdio: 'inherit' });
    } else {
        const FIREBASE_EMULATORS_FIRESTORE_PORT = _sanitize(firebaseJSON.emulators?.firestore?.port) ?? 8080;
        const FIREBASE_EMULATORS_FUNCTIONS_PORT = _sanitize(firebaseJSON.emulators?.functions?.port) ?? 5001;
        const FIREBASE_EMULATORS_AUTH_PORT = _sanitize(firebaseJSON.emulators?.auth?.port) ?? 9099;
        const FIREBASE_EMULATORS_STORAGE_PORT = _sanitize(firebaseJSON.emulators?.storage?.port) ?? 9199;
        const TIMESTAMP = Date.now();
        const DATA_DIRECTORY_STATS = fs.lstatSync(process.env.FIREBASE_EMULATORS_IMPORT_DIRECTORY, { throwIfNoEntry: false });
        const SHOULD_IMPORT_DIRECTORY = DATA_DIRECTORY_STATS.isDirectory() ? 1 : null;
        const DATA_DIRECTORY = DATA_DIRECTORY_STATS.isDirectory() ? fs.realpathSync(process.env.FIREBASE_EMULATORS_IMPORT_DIRECTORY) : 'data';
        const DATA_DIRECTORY_CMD = fs.existsSync(process.env.FIREBASE_EMULATORS_IMPORT_DIRECTORY)
            ? `--export-on-exit="${DATA_DIRECTORY}-${TIMESTAMP}" --import="${DATA_DIRECTORY}"`
            : `--export-on-exit=${DATA_DIRECTORY}`;
        execSync(
            `node ./node_modules/dotenv-cli/cli.js -v NEXT_PUBLIC_IMPORT_DIRECTORY=${SHOULD_IMPORT_DIRECTORY} -v NEXT_PUBLIC_FIREBASE_EMULATORS_FIRESTORE_PORT=${FIREBASE_EMULATORS_FIRESTORE_PORT} -v NEXT_PUBLIC_FIREBASE_EMULATORS_FUNCTIONS_PORT=${FIREBASE_EMULATORS_FUNCTIONS_PORT} -v NEXT_PUBLIC_FIREBASE_EMULATORS_AUTH_PORT=${FIREBASE_EMULATORS_AUTH_PORT} -v NEXT_PUBLIC_FIREBASE_EMULATORS_STORAGE_PORT=${FIREBASE_EMULATORS_STORAGE_PORT}  -- firebase --ui ${DATA_DIRECTORY_CMD} emulators:exec "${cmd}"`,
            { stdio: 'inherit' }
        );
    }
})();
