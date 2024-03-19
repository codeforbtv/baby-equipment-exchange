# a Node.js base image that includes Node v18
FROM node:18-bullseye as base

RUN apt-get update && \
    apt-get install -y jq default-jdk && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

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
ENV FIREBASE_TOOLS_VERSION=13.5.1

RUN npm install -g firebase-tools@${FIREBASE_TOOLS_VERSION} && \
    firebase experiments:enable webframeworks

FROM base as firebase

WORKDIR /usr/src/app

FROM base as functions

WORKDIR /usr/src/app

COPY functions/package*.json functions/

RUN cd functions && npm install

FROM base as app

WORKDIR /usr/src/app

ENV CYPRESS_INSTALL_BINARY=0

COPY package*.json .

RUN npm install