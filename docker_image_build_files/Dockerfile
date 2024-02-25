# a Node.js base image that includes Node v18
FROM node:18-bullseye

# Install Git and Java JDK and jq
RUN apt-get update && \
    apt-get install -y git default-jdk jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# RUN nvm install 18.19.0
# RUN nvm use 18.19.0
RUN mkdir -p /home/user/projects/
WORKDIR /home/user/projects/


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
# COPY firebase_emulator_files/entrypoint.sh /home/user/projects/baby-equipment-exchange/ 
WORKDIR ${REPO_DIR}
# Set default environment variables (these will be overwritten before build with terraform)
ARG FIREBASE_CONFIG
ARG NEXT_PUBLIC_FIREBASE_CONFIG
ENV FIREBASE_CONFIG=$FIREBASE_CONFIG
ENV NEXT_PUBLIC_FIREBASE_CONFIG=$NEXT_PUBLIC_FIREBASE_CONFIG
RUN chmod +x /home/user/projects/baby-equipment-exchange/
ENTRYPOINT ["/home/user/projects/baby-equipment-exchange/entrypoint.sh"]

RUN npm install -g firebase-tools
RUN touch /home/user/projects/baby-equipment-exchange/.env.local
# the below envinroment variables should be passed through terraform
RUN echo 'GOOGLE_APPLICATION_CREDENTIALS="/home/user/projects/baby-equipment-exchange/serviceAccount.json"' >> /home/user/projects/baby-equipment-exchange/.env.local
RUN echo 'FIREBASE_EMULATORS_IMPORT_DIRECTORY="./data_directory"' >> /home/user/projects/baby-equipment-exchange/.env.local
RUN echo FIREBASE_CONFIG=\"$(jq -c . < firebaseConfig.json)\" >> .env.local && \
    echo NEXT_PUBLIC_FIREBASE_CONFIG=\"$(jq -c . < firebaseConfig.json)\" >> .env.local
ENV FIREBASE_EMULATORS_IMPORT_DIRECTORY="./data_directory"
ENV GOOGLE_APPLICATION_CREDENTIALS="/home/user/projects/baby-equipment-exchange/serviceAccount.json"
ENV CYPRESS_INSTALL_BINARY=0

# Use a RUN command to export the environment variables
RUN export FIREBASE_CONFIG="$(cat /home/user/projects/baby-equipment-exchange/firebaseConfig.json | jq -c .)" && \
    export NEXT_PUBLIC_FIREBASE_CONFIG="$(cat /home/user/projects/baby-equipment-exchange/firebaseConfig.json | jq -c .)" && \
    npm install && \
    cd /home/user/projects/baby-equipment-exchange/functions && \
    npm install && \
    npm run build && \
    cd /home/user/projects/baby-equipment-exchange && \
    npm run build && \
    firebase experiments:enable webframeworks


# RUN npm install
# WORKDIR /home/user/projects/baby-equipment-exchange/functions
# # RUN npm install
# # RUN npm run build
# # WORKDIR /home/user/projects/baby-equipment-exchange
# # RUN npm run build
# # RUN firebase experiments:enable webframeworks

# # Define a volume in the image, this is to be passed from terraform
# VOLUME ["/home/user/projects/baby-equipment-exchange"]
# # docker run -v E:\Babyequipment\docker_volume:/home/user/projects/baby-equipment-exchange -w /home/user/projects/baby-equipment-exchange -d --name your_container_name your_image_name


# Expose the ports your application uses
EXPOSE 4400 4000 4500 9099 8080 9150 5000 9199 3000 4000

# CMD ["npm", "run", "dev"]


# # docker build -t babyequipments:1.01 .
# # if you want to run docker container with disk volume presisted on your host machine us this
# # docker run -dit -dp 3000:3000 -dp 4000:4000 -dp 5000:5000 --name baby-equipment-app -v E:\Babyequipment\docker_volume:/home/user/projects/baby-equipment-exchange babyequipments:1.01
# # else use the below and save your code changes to git
# # docker run -dit -dp 3000:3000 -dp 4000:4000 -dp 5000:5000 --name baby-equipment-app babyequipments:1.01 

# # for debugging
# # docker run -dit -p 3000:3000 -p 4000:4000 -p 5000:5000 -p 4400:4400 -p 4500:4500 -p 9099:9099 -p 8080:8080 -p 9150:9150 -p 9199:9199 --name baby-equipment-app babyequipments:1.01
# # docker exec -it baby-equipment-app /bin/bash 
