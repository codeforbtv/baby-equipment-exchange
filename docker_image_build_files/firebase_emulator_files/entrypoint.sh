#!/bin/sh
export FIREBASE_CONFIG="$(cat /home/user/projects/baby-equipment-exchange/firebaseConfig.json)" 
# Execute the Docker CMD
exec "$@"
# Then open a new shell
/bin/sh