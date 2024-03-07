# a Node.js base image that includes Node v18
FROM node:18-bullseye

# Install Git and Java JDK and jq
RUN apt-get update && \
    apt-get install -y git default-jdk jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user/projects/
WORKDIR /home/user/projects/

# Define a build argument for the timestamp to force fresh git clone
ARG BUILD_TIMESTAMP
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}"
# # Clone GitHub repository
ARG GITHUB_REPO="https://github.com/codeforbtv/baby-equipment-exchange.git"
ARG REPO_DIR="/home/user/projects/baby-equipment-exchange"
RUN git clone ${GITHUB_REPO}
WORKDIR ${REPO_DIR}
RUN git checkout main


RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome-stable_current_amd64.deb || true && \
    apt-get install -f -y && \
    rm -f google-chrome-stable_current_amd64.deb
# the below envinroment variables should be passed through terraform
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
RUN wget https://chromedriver.storage.googleapis.com/94.0.4606.61/chromedriver_linux64.zip && \
    unzip chromedriver_linux64.zip && \
    mv chromedriver /usr/bin/chromedriver && \
    chmod +x /usr/bin/chromedriver && \
    rm -f chromedriver_linux64.zip
# in the future the below files need to be passed through terraform
# at the moment the json files must be in the same directory as the dockerfile
# Copy all JSON files from the Dockerfile's directory to the specified working directory in the Docker image
COPY firebase_emulator_files/ ${REPO_DIR}/
WORKDIR ${REPO_DIR}
# Set default environment variables (these will be overwritten before build with terraform)
ARG FIREBASE_CONFIG
ENV FIREBASE_CONFIG=$FIREBASE_CONFIG
RUN chmod +x /home/user/projects/baby-equipment-exchange/


RUN npm install -g firebase-tools
RUN touch /home/user/projects/baby-equipment-exchange/.env.local
# the below envinroment variables should be passed through terraform
RUN echo 'GOOGLE_APPLICATION_CREDENTIALS="/home/user/projects/baby-equipment-exchange/serviceAccount.json"' >> /home/user/projects/baby-equipment-exchange/.env.local
RUN echo 'FIREBASE_EMULATORS_IMPORT_DIRECTORY="./data_directory"' >> /home/user/projects/baby-equipment-exchange/.env.local
RUN echo FIREBASE_CONFIG=\"$(jq -c . < firebaseConfig.json)\" >> .env.local
ENV FIREBASE_EMULATORS_IMPORT_DIRECTORY="./data_directory"
ENV GOOGLE_APPLICATION_CREDENTIALS="/home/user/projects/baby-equipment-exchange/serviceAccount.json"
ENV CYPRESS_INSTALL_BINARY=0

# Use a RUN command to export the environment variables
RUN export FIREBASE_CONFIG="$(cat /home/user/projects/baby-equipment-exchange/firebaseConfig.json | jq -c .)" 
RUN npm install

RUN cd /home/user/projects/baby-equipment-exchange/functions && \
    npm install && \
    npm run build

RUN cd /home/user/projects/baby-equipment-exchange
RUN npm run build
RUN firebase experiments:enable webframeworks


# Define a volume in the image, this is to be passed from terraform
VOLUME ["/home/user/projects/baby-equipment-exchange"]


# Expose the ports your application uses
EXPOSE 4400 4000 4500 9099 8080 9150 5000 9199 3000 4000

