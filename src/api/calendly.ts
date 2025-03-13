const API_KEY = process.env.NEXT_PUBLIC_CALENDLY_API_KEY;
const organization_uri = 'https://api.calendly.com/organizations/48b74e58-cecf-4fd6-9594-63401556c5c9';
import { EventType } from '@/types/CalendlyTypes';

const options = {
    method: 'GET',
    headers: { authorization: `Bearer ${API_KEY}` }
};

export async function getSchedulingPageLink(): Promise<EventType[]> {
    try {
        const response = await fetch(`https://api.calendly.com/event_types?organization=${organization_uri}`, options);
        const data = await response.json();
        const collection = data.collection;
        return collection;
    } catch (error) {
        console.log(error);
    }
    return Promise.reject();
}
