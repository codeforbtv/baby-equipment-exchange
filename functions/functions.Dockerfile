# Docker compose build context is set to the root of the project, so we need to target the functions/ directory.

FROM node:18-bullseye

WORKDIR /usr/src/app

# Copy the package definitions first to bust the cache if they change.
COPY functions/package*.json .

RUN npm install

# Copy firebase config in
COPY .firebase_config .

# Copy the source code
COPY functions/ .