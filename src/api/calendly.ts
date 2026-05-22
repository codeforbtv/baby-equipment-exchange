'use server';

import 'server-only';

const API_KEY = process.env.CALENDLY_API_KEY ?? '';
const CALENDLY_ORG_ID = process.env.CALENDLY_ORGANIZATION ?? '';
const organization = encodeURIComponent(`https://api.calendly.com/organizations/${CALENDLY_ORG_ID}`);
const url = `https://api.calendly.com/event_types?active=true&organization=${organization}`;
import { EventType } from '@/types/CalendlyTypes';

const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${API_KEY}`
    }
};

export async function getSchedulingPageLink(): Promise<EventType[]> {
    const result = await fetch(url, options);
    if (!result.ok) {
        throw new Error(`Calendly event types request failed with status ${result.status}`);
    }
    const data = await result.json();
    return data.collection;
}
