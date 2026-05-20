'use server';

import 'server-only';

const API_KEY = process.env.CALENDLY_API_KEY ?? '';
const CALENDLY_ORG_ID = process.env.CALENDLY_ORGANIZATION ?? '';
const organization = encodeURIComponent(`https://api.calendly.com/organizations/${CALENDLY_ORG_ID}`);
const url =
    `https://api.calendly.com/event_types?active=true&organization=${organization}`;
import { EventType } from '@/types/CalendlyTypes';
import { addErrorEvent } from './firebase';

const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${API_KEY}`
    }
};

export async function getSchedulingPageLink(): Promise<EventType[]> {
    return fetch(url, options)
        .then((result) => result.json())
        .then((data) => data.collection)
        .catch((error) => addErrorEvent('Get Calendly scheduling links', error));
}
