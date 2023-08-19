# baby-equipment-exchange

<div align='center'>

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/NathanWEdwards/baby-equipment-exchange/tree/test.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/gh/NathanWEdwards/baby-equipment-exchange/tree/test)

</div>

## Running tests

Install dependencies and build the project.

```
npm install
npm run build
```

Integration tests and end-to-end tests make use of the Firebase Local Emulator Suite.

The emulator suite requires Java JDK version 11 or higher and the [Firebase CLI](https://github.com/firebase/firebase-tools) must be installed. The Firebase CLI, firebase-tools, is included as a development dependency.

Set environment variables. Add a file `.env.local` to the project root. Ensure the `FIREBASE_EMULATORS_IMPORT_DIRECTORY` matches an emulators data directory.
Data to import into the emulator is available [here](https://drive.google.com/file/d/1TuBIQXPpqc1Ugmqr2SEcRY1vvqqzw1Qe/view?usp=drive_link).

```
NODE_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY=firebase-data
```

Add a `.firebaserc` file to the root directory with the following contents:

```
{
  "projects": {
    "default": "demo-baby-equipment-exchange"
  }
}
```

A `firebase.json` configuration must be present in the project's root directory. The following `firebase.json` file can be used for running tests. The default Firebase emulator ports are used in this example for use with the emulator suite:

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

Ensure `storage.rules` is present in the root directory. The following configuration can be used when using the Firebase Emulator Suite:

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

Add `firestore.rules` to the root directory. The following example permits reading and writing to any document in an collection:

```
rules_version = '2';
service cloud.firestore {
    match /databases/{databases}/documents {
        match/{document=**} {
            allow read, write: if request.auth != null;
        }
    }
}
```

Develop and test with the emulator suite by calling the following command(s) in the root directory:
`npm run dev` or `npm run test:unit`.
