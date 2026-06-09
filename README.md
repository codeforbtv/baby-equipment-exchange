# The Baby Product Exchange

## Introduction...

This project assists the collection and distribution of unused and gently used baby and child equipment. Over twenty different organizations are served by this exchange.

## Setup

[Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) and [clone](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo#cloning-your-forked-repository) the repository to your local machine.

This app requires [Node.js](https://nodejs.org/en) to be installed on your machine.

Navigate to the cloned repository on your computer, open a terminal and the run command

```
npm install
```

to install the project dependencies.

Running the app requires an '.env.local' file in the root of the project folder to access the project's environment variables. You can request this file in the [baby-equipment-exchange Slack channel](https://codeforbtv.slack.com/archives/C04HA6P9Z2R).

Once this file is in place, you can launch the app by running the command

```
npm run dev
```

in your terminal. The app can be accessed at [http://localhost:3000/](http://localhost:3000/).

## Account Creation

Navigate to [http://localhost:3000/join](http://localhost:3000/join) and create a new user.

![Join page](https://raw.githubusercontent.com/codeforbtv/baby-equipment-exchange/main/docs/images/account_creation_1.png)

The landing page should display upon successful account creation.

![Landing Page as standard user](https://raw.githubusercontent.com/codeforbtv/baby-equipment-exchange/main/docs/images/account_creation_1_5.png)

## Environment Configuration

When working locally, update the variable and its value to your local `.env.local` file so it is available during local development. Production Environment variables are managed through Google Cloud Secret Manager and referenced in `apphosting.yaml`. When adding or updating a configuration value, follow these steps:

### 1. Add the variable to `apphosting.yaml`

```yaml
- variable: MY_VAR
  secret: MY_VAR
  availability:
      - BUILD
      - RUNTIME
```

### 2. Create the secret using Firebase CLI

```
firebase apphosting:secrets:set MY_VAR
```

This creates the secret in Google Cloud Secret Manager and grants your Firebase App Hosting backend access to it. You will be prompted to enter the secret value.

If access was not granted automatically, run:

```
firebase apphosting:secrets:grantaccess -b <backend-name> MY_VAR
```

### 3. Redeploy

Secrets are pinned to the version available at build time. A redeploy is required for changes to take effect.

### Notes

- Both `BUILD` and `RUNTIME` availability are required. `BUILD` ensures the Next.js build can resolve the variable at compile time. `RUNTIME` makes it available to the running application.
- Secret names are case-sensitive.
- Values set in the Firebase console override values in `apphosting.yaml`.
- To verify a secret value: `firebase apphosting:secrets:access MY_VAR`
- Do not use the `NEXT_PUBLIC_` prefix for sensitive credentials, as these are exposed to the browser.
