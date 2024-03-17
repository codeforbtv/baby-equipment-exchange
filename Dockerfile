# a Node.js base image that includes Node v18
FROM node:18-bullseye

RUN apt-get update && \
    apt-get install -y jq

RUN wget https://chromedriver.storage.googleapis.com/94.0.4606.61/chromedriver_linux64.zip && \
    unzip chromedriver_linux64.zip && \
    mv chromedriver /usr/bin/chromedriver && \
    chmod +x /usr/bin/chromedriver && \
    rm -f chromedriver_linux64.zip
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome-stable_current_amd64.deb || true && \
    apt-get install -f -y && \
    rm -f google-chrome-stable_current_amd64.deb

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

WORKDIR /usr/src/app

# Copy the package definitions first to bust the cache if they change.
COPY package*.json .

RUN npm install

# Copy the source code
COPY . .

RUN jq -c . < .firebase_config/firebase.json >> .env.local

ENV FIREBASE_CONFIG=/usr/src/app/.env.local

# TODO: Uncomment when we want to start supporting building images
# RUN npm run build
