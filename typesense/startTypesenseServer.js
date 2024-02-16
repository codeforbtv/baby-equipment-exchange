// eslint-disable-next-line
const { exec } = require('child_process');

const TYPESENSE_API_KEY = 'xyz';

const startServer = `docker run -p 8108:8108 -v$(pwd)/typesense/typesense-data:/data typesense/typesense:0.25.2 \
--data-dir /data --api-key=${TYPESENSE_API_KEY} --enable-cors`;

exec(startServer, (err, stdout, stderr) => {
    if (!err && !stderr) {
        console.log('Typesense server is runing');
    }
    if (err) {
        console.log('Error running server', err);
    }
    if (stderr) {
        console.log('Error running server', stderr);
    }
    if (stdout) {
        console.log('Server output:', stdout);
    }
});
