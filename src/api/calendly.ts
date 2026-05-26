'use server';

import 'server-only';

const API_KEY = process.env.CALENDLY_API_KEY ?? '';
const CALENDLY_ORG_ID = process.env.CALENDLY_ORGANIZATION ?? '';
const organization = encodeURIComponent(`https://api.calendly.com/organizations/${CALENDLY_ORG_ID}`);
const url = `https://api.calendly.com/event_types?active=true&organization=${organization}`;
import { EventType } from '@/types/CalendlyTypes';
import { addErrorEvent } from './firebase';

const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${API_KEY}`
    },
    cache: 'no-store' as RequestCache
};

function hasSchedulingUrl(event: EventType): boolean {
    return event.active === true && typeof event.scheduling_url === 'string' && event.scheduling_url.length > 0;
}

async function fetchSchedulingPageLinks(): Promise<EventType[]> {
    const result = await fetch(url, options);
    if (!result.ok) {
        throw new Error(`Calendly scheduling links request failed with status ${result.status}`);
    }

    const data = await result.json();
    if (!Array.isArray(data.collection)) {
        throw new Error('Calendly scheduling links response did not include a collection');
    }

    return data.collection.filter(hasSchedulingUrl);
}

export async function getSchedulingPageLink(): Promise<EventType[]> {
    try {
        return await fetchSchedulingPageLinks();
    } catch (error) {
        await addErrorEvent('Get Calendly scheduling links', error);
        return fetchSchedulingPageLinks();
    }
}
