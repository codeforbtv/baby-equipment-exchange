import { setConfig } from 'next/config';

const config = {
    experimental: {
        serverActions: true,
        serverActionsBodySizeLimit: '2mb'
    }
};

setConfig(config);
