FROM node:18-bullseye

RUN apt-get update && \
    apt-get install -y default-jdk && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV FIREBASE_TOOLS_VERSION=13.5.1

RUN npm install -g firebase-tools@${FIREBASE_TOOLS_VERSION} && \
    firebase experiments:enable webframeworks

WORKDIR /usr/src/app

COPY .firebase_config .