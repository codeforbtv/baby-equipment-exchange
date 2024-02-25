# The Baby Equipment Exchange

## Introduction

This project assists the collection and distribution of unused and gently used baby and child equipment. Over twenty different organizations are served by this exchange.

### Set up

### Dependencies

#### Java dependency

The emulator suite requires Java JDK version 11 or higher and the [Firebase CLI](https://github.com/firebase/firebase-tools) must be installed.

[https://docs.oracle.com/en/java/javase/21/install/installation-jdk-macos.html#GUID-2FE451B0-9572-4E38-A1A5-568B77B146DE](https://docs.oracle.com/en/java/javase/21/install/installation-jdk-macos.html#GUID-2FE451B0-9572-4E38-A1A5-568B77B146DE)

#### Node v18 dependency

This project uses Google Cloud Functions.

Google Cloud Functions only support the Long Term Support (LTS) versions of the Node.js runtime. LTS version of Node.js are denoted by even numbers (16.0., 18.0, 20.0). Cloud Function’s support for Node.js 20 is still in preview.

This is why `./functions/src/package.json` targets Node v18:

```
...
"engines": {
"node": "18"
}
...
```

nvm can be installed with Homebrew:

```
brew install nvm
nvm install 18.19.0 # The latest version of Node v18 as of December 12th, 2023
nvm use 18.9.0
node -v # -> v.18.19.0
```

`nvm use system` can be used to switch back to the default version of Node.

#### **The Firebase Emulator Suite**

Globally install the Firebase CLI [firebase-tools - npm (npmjs.com)](https://www.npmjs.com/package/firebase-tools):

```
npm install -g firebase-tools
```

#### Having Account Access to the Google Cloud Project or Application Default Credentials Dependency

Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable with the path to the Service Account Credentials (see the next section, Configuration File Dependencies serviceAccount.json) [How Application Default Credentials works  |  Authentication  |  Google Cloud](https://cloud.google.com/docs/authentication/application-default-credentials):

```
export GOOGLE_APPLICATION_CREDENTIALS="/home/user/projects/baby-equipment-exchange/serviceAccount.json"
```

If you have performed the above step, the following step should not be necessary:

```
firebase login
```

Set the `FIREBASE_CONFIG` environment variable. For more details about what is in a Firebase config, visit [Understand Firebase projects  |  Firebase Documentation (google.com)](https://firebase.google.com/docs/projects/learn-more#config-files-objects):


```
export FIREBASE_CONFIG="{ \
  \"apiKey\": \"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\", \
  \"authDomain\": \"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\", \
  \"projectId\": \"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\", \
  \"storageBucket\": \"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\", \
  \"messagingSenderId\": \"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\", \
  \"appId\": \"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\" \
}"
```

or, `export FIREBASE_CONFIG="$(cat <path_to_Firebace_JSON_configuration_file)"`.

#### Configuration File Dependencies

This is a list of all configuration files required for the Emulator Suite to run. All of these files go in the project root directory (e.g. `/home/user/projects/baby-equipment-exchange`), where `dotenv-config.js` and `package.json` and `next.config.js` are all found

-   `.env.local` See [This Page](https://firebase.google.com/docs/functions/config-env?gen=2nd#emulator_support) for more details
-   `.firebaserc`
-   `firebase.json` [for deployment configuration](https://firebase.google.com/docs/cli#the_firebasejson_file) and [when configuring the emulator suite](https://firebase.google.com/docs/emulator-suite/install_and_configure#configure_emulator_suite)
-   `firestore.rules`
-   `firestore.indexes.json`
-   `storage.rules`
-   `serviceAccount.json`

The environment variable, `FIREBASE_EMULATORS_IMPORT_DIRECTORY` must be set. The directory should be a path exclusively for Firebase emulator data. If the directory exists, the emulator will attempt to import the data. If the directory does not exist, the emulator will export data to the directory on exit.

**.env.local** — (Same directory as `dotenv-config.js` and `package.json` and `next.config.js`) Stores all environment variables that are picked-up by an environment variable loader. This projects uses [dot-env - npm (npmjs.com)](https://www.npmjs.com/package/dot-env). Add the following line to this .env.local file:

```
FIREBASE_EMULATORS_IMPORT_DIRECTORY="./data_directory"
```

******\*\*\*\*******\*\*\*\*******\*\*\*\*******firebase.json******\*\*\*\*******\*\*\*\*******\*\*\*\******* — (Same directory as above) Contains configurations for deploying the app and the emulator suite:

```
{
    "emulators": {
      "auth": {
        "enabled": true
      },
      "firestore": {
        "enabled": true
      },
      "functions": {
        "enabled": true
      },
      "storage": {
        "enabled": true
      }
    },
    "firestore": {
      "rules": "firestore.rules",
      "indexes": "firestore.indexes.json"
    },
    "hosting": {
      "source": ".",
      "ignore": [
        "firebase.json",
        "*/.",
        "*/node_modules/*"
      ],
      "frameworksBackend": {
        "region": "us-east1",
        "maxInstances":10
      }
    },
    "storage": {
      "rules": "storage.rules"
    },
    "functions": [
      {
        "source": "functions",
        "codebase": "default",
        "ignore": [
          "node_modules",
          ".git",
          "firebase-debug.log",
          "firebase-debug.*.log"
        ],
        "predeploy": [
          "npm --prefix \"$RESOURCE_DIR\" run build"
        ]
      }
    ]
}
```

**.firebaserc** — (Same directory as above) Google Firebase site/project information is described in this file:

```
{
  "projects": {
    "default": "demo-bee"
  }
}
```

******\*\*******\*\*******\*\*******firestore.rules******\*\*******\*\*******\*\******* — (Same directory as above) The Firestore Security Rules the emulator should enforce [Get started with Cloud Firestore Security Rules  |  Firebase (google.com)](https://firebase.google.com/docs/firestore/security/get-started)

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
      // Administrator role
      match /Events/{document=**} {
        allow read: if request.auth != null && request.auth.token.admin == true;
      }
      match /Donations/{document=**} {
        allow read: if request.auth != null && request.auth.token.admin == true;
      }
      match /DonationDetails/{document=**} {
        allow read: if request.auth != null && request.auth.token.admin == true;
      }
      match /Images/{document=**} {
        allow read: if request.auth != null && request.auth.token.admin == true;
        }
        match /ImageDetails/{document=**} {
        allow read: if request.auth != null && request.auth.token.admin == true;
        }
      match /Organizations/{document=**} {
        allow create, read, update, write: if request.auth != null && request.auth.token.admin == true;
        }
      match /Storage/{document=**} {
        allow create, read, update, write: if request.auth != null && request.auth.token.admin == true;
        }
      match /Users/{document=**} {
        allow read: if request.auth != null && request.auth.token.admin == true;
      }
      match /UserDetails/{document=**} {
        allow read, update: if request.auth != null  && request.auth.token.admin == true;
        }
      // Standard user role
        match /Donations/{document=**} {
        allow create, read, update, write: if request.auth != null;
        }
        match /DonationDetails/{document=**} {
        allow create, read, update, write: if request.auth != null;
        }
      match /Images/{document=**} {
        allow create, read: if request.auth != null;
        }
        match /ImageDetails/{document=**} {
        allow create, read: if request.auth != null;
        }
        match /Users/{userId} {
        allow create, read, update, write: if request.auth != null && request.auth.uid == userId;
        }
        match /UserDetails/{userId} {
        allow create, read, update, write: if request.auth != null && request.auth.uid == userId;
        }
  }
}
```

**********\*\*\*\***********\*\***********\*\*\*\***********firestore.indexes.json**********\*\*\*\***********\*\***********\*\*\*\*********** — (Same directory as above) Database index definitions the emulator should have set [Manage indexes in Cloud Firestore  |  Firebase (google.com)](https://firebase.google.com/docs/firestore/query-data/indexing)

```
{
    "indexes": [],
    "fieldOverrides": []
}
```

********\*\*\*\*********\*\*********\*\*\*\*********serviceAccount.json********\*\*\*\*********\*\*********\*\*\*\********* — (Same directory as above) The credentials for a Service Account that is authorized to carry-out work in Google Cloud on behalf of the Firebase project [Service accounts overview  |  IAM Documentation  |  Google Cloud](https://cloud.google.com/iam/docs/service-account-overview)

```
{
    "type": "service_account",
    "project_id": "project,
    "private_key_id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "private_key": "-----BEGIN PRIVATE KEY-----
    \\?????????????????????x?x????????????????????????????xx??xx????+??\???????xx+?x??x???????????????????????????????x??/??x?x????+????x\???x??????/x??????x????xx??/????????x?????????????x?x????xx?/???x\???x????????????????????????xxx?????????x???????x?x?+????????????\???x????????/xx???x????+???x??x??x?????x??x??????x?x????x????????\?????????????x???????????????x???????x????x??????????????????????\???x?????????????????????????????x?xx???x?????????/?/???????????x\?x???????x???/???????xx??????x????????????????x???????x????x??/??\?????????x??x?????????xx??x???/????xx?x????????x????????x?????x??\?x????x?x??????x?/????x??????????????xx??x?????x?????????xx??x???\??????????????????x???x???x???????x????x?x???x?x???+?xx?x?????x??\????x???+x?x?????x?????x?x+???+??????????????????????x??xx???????\?????/???????????x??x?????xx??/???????????x??x????x????+?????????\???x?????x?????x?x?????x?????????????x???x??x????????x???x???+?x?\?x???????x?xx?xx????xx????????????????????x????xx??????xx?????x??\?????x????????????x???x?x???xx???x???xx?x?????/?x??x?????????+???\????x?x/??xx???x??x?x??x???x?????x??x???????????x????????/????x?x\???/+????x??????xx?+??x\n-----END PRIVATE KEY-----\n",
    "client_email": "client@serviceaccount.com",
    "client_id": "xxxxxxxxxxxxxxxxxxxxx",
    "auth_uri": "https:/example.com/o/oauth2/auth",
    "token_uri": "https://example.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.example.com",
    "universe_domain": "domain"
  }
```

****\*\*\*\*****\*\*****\*\*\*\*****storage.rules****\*\*\*\*****\*\*****\*\*\*\***** — (Same directory as above) The Storage Security Rules the emulator should enforce [Understand Firebase Security Rules for Cloud Storage  |  Cloud Storage for Firebase (google.com)](https://firebase.google.com/docs/storage/security/)

```
rules_version = '2';

// Craft rules based on data in your Firestore database
// allow write: if firestore.get(
//    /databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin;
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### Installation and Setup

#### npm install

Both the directory defining the Cloud Functions and the main app must be installed and built.

The package.json in the `home/user/projects/baby-equipment-exchange/**functions**` directory may rely on dependencies present in the node_modules directory of `/home/user/projects/baby-equipment-exchange`, so perform an `npm install` in the project root directory first:

```
cd "/home/user/projects/baby-equipment-exchange"
npm install
```

Then, install the dependencies necessary for this app’s Cloud Functions:

```
cd "/home/user/projects/baby-equipment-exchange/**functions/**"
npm install
```

#### npm run build

From `/home/user/projects/baby-equipment-exchange`, build the cloud functions with:

```
**cd ./functions** && npm run build
```

From the project root, `/home/user/projects/baby-equipment-exchange/`:

```
npm run build
```

#### Set the Firebase project for the current directory (the cloned baby-equipment-exchange directory)

To set the active Firebase project for the current directory, run:

```
firebase use --add
```

when prompted, provide the name of the project and an alias for it:

```
**?** Which project do you want to add? **baby-equipment-exchange**
**?** What alias do you want to use for this project? (e.g. staging) **c4btv**
```

#### Automatically compiling Firebase Functions changes

If one intends to make changes to cloud functions located in `/home/user/projects/baby-equipment-exchange**/functions**/src/index.ts` while using the Emulator Suite, `npm run build` would need to be called in the `/home/user/projects/baby-equipment-exchange**/functions**` directory each time a change is made.

To automatically watch for changes:

```
# Open a new terminal
cd /home/user/projects/baby-equipment-exchange**/functions**
npm run build:watch
```

#### npm run dev

Given that,

-   `firebase.json` exists and is valid in `/home/user/projects/baby-equipment-exchange/`
-   `FIREBASE_EMULATORS_IMPORT_DIRECTORY` environment variable is set

the following command should start the emulators and the app:

```
npm run dev
```

[package.json](https://github.com/codeforbtv/baby-equipment-exchange/blob/main/package.json#L6) → [src/utils/setup.cjs](https://github.com/codeforbtv/baby-equipment-exchange/blob/main/src/utils/setup.cjs#L3) → [the emulator is initialized](https://github.com/codeforbtv/baby-equipment-exchange/blob/main/src/utils/setup.cjs#L14)

The command line should display the following lines:

```
...
i  emulators: Starting emulators: auth, functions, firestore, hosting, storage
...
✔  firestore: Firestore Emulator UI websocket is running on <PORT>.
...
✔  hosting[ab-test-with]: Local server: <HOST_PORT>
...
✔  functions: Using node@18 from host.
Serving at port <PORT>
...
✔  functions: Loaded functions definitions from source ...
...
✓ Ready in 11.11s
...
```

#### Account Creation

Navigate to [http://localhost:3000/join](http://localhost:3000/join) and create a new user”

![Join page](https://raw.githubusercontent.com/codeforbtv/baby-equipment-exchange/main/docs/images/account_creation_1.png)

The landing page should display upon successful account creation.

![Landing Page as standard user](https://raw.githubusercontent.com/codeforbtv/baby-equipment-exchange/main/docs/images/account_creation_1_5.png)

Navigate to [http://localhost:4000/auth](http://localhost:4000/auth), select the ellipses next to the newly created user, and select Edit user:

![Firebase Emulator Auth](https://raw.githubusercontent.com/codeforbtv/baby-equipment-exchange/main/docs/images/account_creation_2.png)

Scroll to Custom claims. Claims should already be present. If the text field is empty and if claims are already present, provide the following claims:

```
{ "admin" : true, "can-read-donations" : true, "donor" : true, "unverified" : true }
```

![Firebase Emulator Auth edit existing user](https://raw.githubusercontent.com/codeforbtv/baby-equipment-exchange/main/docs/images/account_creation_3.png)

(Clicking outside the Edit user pop-up closes it) Scroll the slider down and select the **\*\*\*\***Save**\*\*\*\*** button:

![Firebase Emulator Auth save button](https://raw.githubusercontent.com/codeforbtv/baby-equipment-exchange/main/docs/images/account_creation_3_5.png)

Refresh the landing page [http://localhost:3000](http://localhost:3000). The Users tab should be visible:

![Landing pages](https://raw.githubusercontent.com/codeforbtv/baby-equipment-exchange/main/docs/images/account_creation_4.png)

#### Viewing the application with a web browser

The application should have compiled and deployed to an emulated Firebase hosting environment on:

```
http://localhost:5000
```

The Next dev environment (when changes are made to the app’ code during runtime they reflect here) should be available at:

```
http://localhost:3000
```

The Firebase Emulator UI Dashboard should be accessible when navigating to:

```
https://localhost:4000
```
