# The Baby Product Exchange

## Introduction...

This project assists the collection and distribution of unused and gently used baby and child equipment. Over twenty different organizations are served by this exchange.

## Setup

[Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) and [clone](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo#cloning-your-forked-repository) the repository to your local machine.

This app requires [Node.js](https://nodejs.org/en) and [Java](https://www.java.com/en/download/) for the Firestore emulator to be installed on your machine.

Navigate to the cloned repository on your computer, open a terminal and run:

```
npm install
```

to install the project dependencies.

Next, copy the sample environment file:

```
cp .env.sample .env.local
```

No Firebase credentials or secrets are needed for local development. Everything runs against local emulators.

## Running the app

Use two terminals:

Terminal 1 - start the Firebase emulators and leave them running:

```
npm run emulators
```

Terminal 2 - start the dev server:

```
npm run dev
```

The app can be accessed at [http://localhost:3000/](http://localhost:3000/). The emulator UI is at [http://localhost:4080/](http://localhost:4080/).

Run this once after starting emulators, or after restarting them, to populate test data:

```
npm run seed
```

This creates test users, categories, organizations, orders, and sample donations.

## Logging In

Navigate to [http://localhost:3000/login](http://localhost:3000/login) and use one of the local test accounts below:

| Account    | Email                | Password   |
| ---------- | -------------------- | ---------- |
| Admin      | `admin1@email.com`   | `password` |
| Donor      | `donor1@email.com`   | `password` |
| Donor      | `donor2@email.com`   | `password` |
| Aid worker | `aid1@email.com`     | `password` |
| Aid worker | `aid2@email.com`     | `password` |
| Pending    | `pending1@email.com` | `password` |
| Pending    | `pending2@email.com` | `password` |

## Account Creation

Navigate to [http://localhost:3000/join](http://localhost:3000/join) and create a new user.

![Join page](https://raw.githubusercontent.com/codeforbtv/baby-equipment-exchange/main/docs/images/account_creation_1.png)

The landing page should display upon successful account creation.

![Landing Page as standard user](https://raw.githubusercontent.com/codeforbtv/baby-equipment-exchange/main/docs/images/account_creation_1_5.png)
