# The Baby Equipment Exchange

## Introduction

This project assists the collection and distribution of unused and gently used baby and child equipment. Over twenty different organizations are served by this exchange.

## Dev remote Setup (Recommended for consistency, you can dev local if you don't want to work with docker)

1. install Docker desktop (or equivalent in Mac and Linux)
2. download folder "docker_image_build_files" from the repo, it's better not to clone the entire repo because you will not develop on this cloned repo 
3. you still need 2 additional files to authernticate locally contact the repo admin to get them, you need "firebaseConfig.json" and "serviceAccount.json", after you acquire them put those 2 files inside the  "/docker_image_build_files/firebase_emulator_files/"
4. install visual studio code.
5. run visual studio code and install Visual Studio Code Dev Containers extension, for documentation on this extension (https://code.visualstudio.com/docs/devcontainers/containers)
6. open a terminal, navigate to "/docker_image_build_files/" and run the below lines to build a docker image (if we find a way to secure some of the json files we can just share the docker image)
```
docker build -t babyequipments:1.01 .
```
7. run the below to run a docker container  
```
docker run -dit -p 3000:3000 -p 4000:4000 -p 5000:5000 -p 4400:4400 -p 4500:4500 -p 9099:9099 -p 8080:8080 -p 9150:9150 -p 9199:9199 --name baby-equipment-app babyequipments:1.01
```
8. Download VScode extension called "Remote Development"
9. in visual studio code press ctrl+shit+p to open command palette and select Dev Containers: Attach to Running Container (https://code.visualstudio.com/docs/devcontainers/attach-container)
10. select the Attach to Container inline action on the container you want to connect to
11. verify your connection by going to the remote tab in VScode
12. open folder and navigate to /home/user/projects/baby-equipment-exchange/
13. open a new terminal in VScode (verify that it's connected to the container not your host machine) the following command should start the emulators and the app:
```
export FIREBASE_CONFIG="$(cat /home/user/projects/baby-equipment-exchange/firebaseConfig.json)"
export NEXT_PUBLIC_FIREBASE_CONFIG="$(cat /home/user/projects/baby-equipment-exchange/firebaseConfig.json)"
npm run dev
```
13. see the output you can run in your host machine browser http://localhost:3000


## Dev Local Setup
Below are linux command used to setup the environment 

1. Install required packages
```
sudo apt install default-jdk
sudo apt update
sudo apt install git
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 18.19.0
nvm use 18.19.0
sudo mkdir -p /home/user/projects/
sudo chown -R $(whoami) /home/user/projects/

cd /home/user/projects/
sudo git clone https://github.com/codeforbtv/baby-equipment-exchange.git

cd /home/user/projects/baby-equipment-exchange
sudo wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f
echo 'export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome' >> ~/.bashrc
source ~/.bashrc
sudo wget https://chromedriver.storage.googleapis.com/94.0.4606.61/chromedriver_linux64.zip
sudo unzip chromedriver_linux64.zip
sudo mv chromedriver /usr/bin/chromedriver
sudo chown root:root /usr/bin/chromedriver
sudo chmod +x /usr/bin/chromedriver
sudo chown -R $(whoami) /home/user/projects/
cd /home/user/projects/baby-equipment-exchange/
npm install -g firebase-tools
```

2. Setup environment variables
```
sudo touch /home/user/projects/baby-equipment-exchange/.env.local
sudo echo 'GOOGLE_APPLICATION_CREDENTIALS="/home/user/projects/baby-equipment-exchange/serviceAccount.json"' >> /home/user/projects/baby-equipment-exchange/.env.local
sudo echo 'FIREBASE_EMULATORS_IMPORT_DIRECTORY="./data_directory"' >> /home/user/projects/baby-equipment-exchange/.env.local
sudo apt-get install jq
echo FIREBASE_CONFIG=\"$(jq -c . < firebaseConfig.json)\" >> .env.local
sudo echo NEXT_PUBLIC_FIREBASE_CONFIG=\"$(jq -c . < firebaseConfig.json)\" >> .env.local

export FIREBASE_EMULATORS_IMPORT_DIRECTORY="./data_directory"
export GOOGLE_APPLICATION_CREDENTIALS="/home/user/projects/baby-equipment-exchange/serviceAccount.json"
export FIREBASE_CONFIG="$(cat /home/user/projects/baby-equipment-exchange/firebaseConfig.json)" 
export NEXT_PUBLIC_FIREBASE_CONFIG="$(cat /home/user/projects/baby-equipment-exchange/firebaseConfig.json)" 
```

3. install npm requirments and build project
```
npm install

cd /home/user/projects/baby-equipment-exchange/functions
npm install
npm run build

cd /home/user/projects/baby-equipment-exchange

npm run build

firebase experiments:enable webframeworks
firebase use --add
npm run dev
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
