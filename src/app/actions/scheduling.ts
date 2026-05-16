'use server';

import 'server-only';
import type {
    EventType,
    ScheduledEvent,
    ScheduledEventsResponse,
    Invitee,
    InviteesResponse,
    ScheduledEventWithInvitees,
    TimeRange,
    EventCategory,
    BookingMatchResult,
    BookingStatusResult
} from 'scheduling';
import type { Donation } from '@/models/donation';
import { matchDonationBookings } from './scheduling-core';

const API_KEY = process.env.CALENDLY_API_KEY;
const CALENDLY_ORG_ID = process.env.CALENDLY_ORGANIZATION ?? '48b74e58-cecf-4fd6-9594-63401556c5c9';
const organizationUri = `https://api.calendly.com/organizations/${CALENDLY_ORG_ID}`;

const headers = {
    'Content-Type': 'application/json',
    authorization: `Bearer ${API_KEY}`
};

// Time Range Helpers

function getTimeRangeDays(timeRange: TimeRange): number {
    switch (timeRange) {
        case '1week':
            return 7;
        case '2weeks':
            return 14;
        case '30days':
            return 30;
        case '60days':
            return 60;
        case '90days':
            return 90;
    }
}

function getStartOfDay(): string {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
}

function getMaxStartTime(timeRange: TimeRange): string {
    const days = getTimeRangeDays(timeRange);
    const future = new Date();
    future.setDate(future.getDate() + days);
    future.setHours(23, 59, 59, 999);
    return future.toISOString();
}

// Scheduled Events

/**
 * Fetch scheduled events from Calendly within a time range.
 * Handles pagination automatically.
 */
export async function getScheduledEvents(timeRange: TimeRange): Promise<ScheduledEvent[]> {
    const allEvents: ScheduledEvent[] = [];
    const minStartTime = getStartOfDay();
    const maxStartTime = getMaxStartTime(timeRange);

    let nextPageToken: string | null = null;

    do {
        const params = new URLSearchParams({
            organization: organizationUri,
            min_start_time: minStartTime,
            max_start_time: maxStartTime,
            status: 'active',
            sort: 'start_time:asc',
            count: '100'
        });

        if (nextPageToken) {
            params.set('page_token', nextPageToken);
        }

        const url = `https://api.calendly.com/scheduled_events?${params.toString()}`;
        const response = await fetch(url, { method: 'GET', headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Calendly API error ${response.status}: ${errorText}`);
        }

        const data: ScheduledEventsResponse = await response.json();
        allEvents.push(...data.collection);
        nextPageToken = data.pagination.next_page_token;
    } while (nextPageToken);

    return allEvents;
}

// Event Invitees

/**
 * Fetch all invitees for a specific scheduled event.
 */
export async function getEventInvitees(eventUri: string): Promise<Invitee[]> {
    const allInvitees: Invitee[] = [];
    let nextPageToken: string | null = null;

    do {
        const params = new URLSearchParams({
            status: 'active',
            count: '100'
        });

        if (nextPageToken) {
            params.set('page_token', nextPageToken);
        }

        const url = `${eventUri}/invitees?${params.toString()}`;
        const response = await fetch(url, { method: 'GET', headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Calendly invitees API error ${response.status}: ${errorText}`);
        }

        const data: InviteesResponse = await response.json();
        allInvitees.push(...data.collection);
        nextPageToken = data.pagination.next_page_token;
    } while (nextPageToken);

    return allInvitees;
}

// Composite: Events + Invitees

/**
 * Fetch all scheduled events within a time range and enrich each with its invitees.
 */
export async function getAllScheduledEventsWithInvitees(timeRange: TimeRange): Promise<ScheduledEventWithInvitees[]> {
    const events = await getScheduledEvents(timeRange);
    const enrichedEvents: ScheduledEventWithInvitees[] = await Promise.all(
        events.map(async (event) => {
            const invitees = await getEventInvitees(event.uri);
            return { ...event, invitees };
        })
    );
    return enrichedEvents;
}

// Event Types

/**
 * Get scheduling links from Calendly.
 * @returns Array of event types.
 */
export async function getSchedulingPageLink(): Promise<EventType[]> {
    const collection: EventType[] = [];
    let nextPageToken: string | null = null;

    do {
        const params = new URLSearchParams({
            active: 'true',
            organization: organizationUri
        });

        if (nextPageToken) {
            params.set('page_token', nextPageToken);
        }

        const url = `https://api.calendly.com/event_types?${params.toString()}`;
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Calendly API error ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        collection.push(...data.collection);
        nextPageToken = data.pagination.next_page_token;
    } while (nextPageToken);

    return collection;
}

// Event Type Classification

/** Known event type URI patterns populated at runtime from Calendly event types. */
let cachedEventTypes: EventType[] | null = null;

async function getEventTypesCache(): Promise<EventType[]> {
    if (!cachedEventTypes) {
        cachedEventTypes = await getSchedulingPageLink();
    }
    return cachedEventTypes;
}

/**
 * Classify a scheduled event as pickup, dropoff, or unknown.
 * Strategy:
 * 1. Match event_type URI against known event types and check their names
 * 2. Fall back to event name heuristics
 */
export async function classifyEventType(event: ScheduledEvent): Promise<EventCategory> {
    // Try URI-based matching first
    try {
        const eventTypes = await getEventTypesCache();
        const matchingType = eventTypes.find((et) => event.event_type === et.uri);

        if (matchingType) {
            const typeName = matchingType.name.toLowerCase();
            if (typeName.includes('pick up') || typeName.includes('pickup') || typeName.includes('pick-up')) {
                return 'pickup';
            }
            if (typeName.includes('drop off') || typeName.includes('dropoff') || typeName.includes('drop-off') || typeName.includes('delivery')) {
                return 'dropoff';
            }
        }
    } catch {
        // Fall through to heuristic matching
    }

    // Heuristic: match on the event name itself
    const eventName = event.name.toLowerCase();
    if (eventName.includes('pick up') || eventName.includes('pickup') || eventName.includes('pick-up')) {
        return 'pickup';
    }
    if (eventName.includes('drop off') || eventName.includes('dropoff') || eventName.includes('drop-off') || eventName.includes('delivery')) {
        return 'dropoff';
    }

    return 'unknown';
}

// Booking Matching

/**
 * Match donations against bookings.
 * For each donation, checks if the relevant person (donor for drop-off, requestor for pickup)
 * has an invitee entry in any of the scheduled events.
 *
 * Match tiers:
 * - confirmed: exact email match
 * - possible-match: name-only match (different email)
 * - unconfirmed: no match found
 */
export async function matchDonationsToBookings(
    donations: Donation[],
    events: ScheduledEventWithInvitees[],
    mode: 'pickup' | 'dropoff'
): Promise<BookingStatusResult> {
    const byId: Record<string, BookingMatchResult> = {};
    const results = matchDonationBookings(donations, events, mode);
    const confirmed = results.filter((result) => result.confidence === 'confirmed');
    const possibleMatches = results.filter((result) => result.confidence === 'possible-match');
    const unconfirmed = results.filter((result) => result.confidence === 'unconfirmed');

    for (const result of results) {
        byId[result.id] = result;
    }

    return { confirmed, possibleMatches, unconfirmed, byId };
}

// High-level Booking Status Methods

/**
 * Get booking status for donations awaiting pickup (status: 'reserved').
 * Matches requestor emails/names against invitees.
 */
export async function getPickupBookingStatus(donations: Donation[], timeRange: TimeRange): Promise<BookingStatusResult> {
    return (await getBookingStatuses(donations, timeRange)).pickupBookingStatus;
}

/**
 * Get booking status for donations awaiting drop-off (status: 'pending delivery').
 * Matches donor emails/names against invitees.
 */
export async function getDropOffBookingStatus(donations: Donation[], timeRange: TimeRange): Promise<BookingStatusResult> {
    return (await getBookingStatuses(donations, timeRange)).dropOffBookingStatus;
}

export async function getBookingStatuses(
    donations: Donation[],
    timeRange: TimeRange
): Promise<{ pickupBookingStatus: BookingStatusResult; dropOffBookingStatus: BookingStatusResult }> {
    const emptyStatus: BookingStatusResult = { confirmed: [], possibleMatches: [], unconfirmed: [], byId: {} };

    try {
        const allEvents = await getAllScheduledEventsWithInvitees(timeRange);
        const pickupEvents: ScheduledEventWithInvitees[] = [];
        const dropOffEvents: ScheduledEventWithInvitees[] = [];

        for (const event of allEvents) {
            const category = await classifyEventType(event);
            if (category === 'pickup' || category === 'unknown') {
                pickupEvents.push(event);
            }
            if (category === 'dropoff' || category === 'unknown') {
                dropOffEvents.push(event);
            }
        }

        const reservedDonations = donations.filter((donation) => donation.status === 'reserved');
        const pendingDeliveryDonations = donations.filter((donation) => donation.status === 'pending delivery');
        const [pickupBookingStatus, dropOffBookingStatus] = await Promise.all([
            matchDonationsToBookings(reservedDonations, pickupEvents, 'pickup'),
            matchDonationsToBookings(pendingDeliveryDonations, dropOffEvents, 'dropoff')
        ]);

        return { pickupBookingStatus, dropOffBookingStatus };
    } catch (error) {
        return {
            pickupBookingStatus: emptyStatus,
            dropOffBookingStatus: emptyStatus
        };
    }
}
