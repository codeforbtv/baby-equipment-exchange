'use server';

import 'server-only';
import { EventType } from '@/types/CalendlyTypes';
import { addErrorEvent } from './firebase';

const API_KEY = process.env.CALENDLY_API_KEY;
const organization = encodeURIComponent(`https://api.calendly.com/organizations/${process.env.CALENDLY_ORGANIZATION}`);
const url = `https://api.calendly.com/event_types?active=true&organization=${organization}`;
const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${API_KEY}`
    }
};

export async function getSchedulingPageLink(): Promise<EventType[]> {
    const response = await fetch(url, options);
    const responseJson = await response.json();
    const collection = responseJson.collection;
    return collection;
}
