# baby-equipment-exchange

## Running tests

Install dependencies and build the project.

```
npm run build
```

Integration tests and end-to-end tests make use of the Firebase Local Emulator Suite.


The emulator suite requires Java JDK version 11 or higher and the [Firebase CLI](https://github.com/firebase/firebase-tools) to be installed.

Log-in to Firebase.

```
firebase login
```

Set environment variables. Add a file `.env.local` to the project root. Ensure the `FIREBASE_EMULATOR_FIRESTORE_PORT` matches its port assignment in `firebase.json`.

```
FIREBASE_EMULATOR_FIRESTORE_PORT=8080
```

A `firebase.json` configuration must be present in the project's root directory. The following `firebase.json` file can be used for running tests. The default Firebase emulator ports are used.

```
{
    "emulators": {
        "auth": {
            "port": 9099
        },
        "firestore": {
            "port": 8080
        },
        "ui": {
            "enabled": true
        },
        "singleProjectMode": true,
        "storage": {
            "port": 9199
        }
    },
    "storage": {
        "rules": "storage.rules"
    }
}
```

Ensure `storage.rules` is present in the root directory. The following configuration can be used when using the Firebase Emulator Suite.

```
rules_version = "2";
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Test with the emulator suite by calling the following command in the root directory. The data directory is specified with the `--import` flag.

`firebase emulators:exec "npm run test" --import=<emulator-data-directory>`.