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

to install the project dependencies. Note: this may hang or take a while due to the large number of dependencies.

Running the app requires an '.env.local' file in the root of the project folder to access the project's environment variables. You can request this file in the [baby-equipment-exchange Slack channel](https://codeforbtv.slack.com/archives/C04HA6P9Z2R).

Once this file is in place, you can launch the app by running the command

```
npm run dev
```

in your terminal. The app can be accessed at [http://localhost:3000/](http://localhost:3000/).

## Logging In

Navigate to [http://localhost:3000/login](http://localhost:3000/login) and log in with the following test credentials:

- **Email:** user@email.com
- **Password:** Password123

Note: Creating a new account via the join page won't give you immediate access, as new accounts go through an approval process.
