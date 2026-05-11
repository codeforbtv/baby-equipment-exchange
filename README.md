# The Baby Product Exchange

## Introduction...

This project assists the collection and distribution of unused and gently used baby and child equipment. Over twenty different organizations are served by this exchange.

## Setup

[Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) and [clone](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo#cloning-your-forked-repository) the repository to your local machine.

This app requires [Node.js](https://nodejs.org/en) and [Java](https://www.java.com/en/download/) (for the Firestore emulator) to be installed on your machine.

Navigate to the cloned repository on your computer, open a terminal and run:

```
npm install
```

Note: this may hang or take a while due to the large number of dependencies.

Next, copy the sample environment file:

```
cp .env.sample .env.local
```

That's it, no Firebase credentials or secrets are needed for local development. Everything runs against local emulators.

## Running the app

You'll need two terminals open:

**Terminal 1** — start the Firebase emulators (leave this running):

```
npm run emulators
```

**Terminal 2** — start the dev server:

```
npm run dev
```

The app can be accessed at [http://localhost:3000/](http://localhost:3000/). The emulator UI is at [http://localhost:4080/](http://localhost:4080/).

**Seed data** — run this once after starting emulators (or after restarting them) to populate test data:

```
npm run seed
```

This creates test users, categories, organizations, and sample donations.

## Logging In

Navigate to [http://localhost:3000/login](http://localhost:3000/login) and use one of the test accounts below:

| Account    | Email                | Password   |
| ---------- | -------------------- | ---------- |
| Admin      | `admin1@email.com`   | `password` |
| Donor      | `donor1@email.com`   | `password` |
| Donor      | `donor2@email.com`   | `password` |
| Aid worker | `aid1@email.com`     | `password` |
| Aid worker | `aid2@email.com`     | `password` |
| Pending    | `pending1@email.com` | `password` |

Note: Creating a new account via the join page won't give you immediate access, as new accounts go through an approval process.

If you have questions or need help, reach out in the [baby-equipment-exchange Slack channel](https://codeforbtv.slack.com/archives/C04HA6P9Z2R).
