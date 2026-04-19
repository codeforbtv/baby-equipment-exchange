'use server';

import 'server-only';
import {
    EventType,
    ScheduledEvent,
    ScheduledEventsResponse,
    Invitee,
    InviteesResponse,
    ScheduledEventWithInvitees,
    CalendlyTimeRange,
    CalendlyEventCategory,
    BookingMatchResult,
    BookingMatchConfidence,
    BookingStatusResult
} from '@/types/CalendlyTypes';
import { addErrorEvent } from './firebase';
import { Donation } from '@/models/donation';

const API_KEY = process.env.CALENDLY_API_KEY;
const CALENDLY_ORG_ID = process.env.CALENDLY_ORGANIZATION ?? '48b74e58-cecf-4fd6-9594-63401556c5c9';
const organizationUri = `https://api.calendly.com/organizations/${CALENDLY_ORG_ID}`;

const headers = {
    'Content-Type': 'application/json',
    authorization: `Bearer ${API_KEY}`
};

// Time Range Helpers

function getTimeRangeDays(timeRange: CalendlyTimeRange): number {
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

function getMaxStartTime(timeRange: CalendlyTimeRange): string {
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
export async function getScheduledEvents(timeRange: CalendlyTimeRange): Promise<ScheduledEvent[]> {
    const allEvents: ScheduledEvent[] = [];
    const minStartTime = getStartOfDay();
    const maxStartTime = getMaxStartTime(timeRange);

    let nextPageToken: string | null = null;

    try {
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
    } catch (error) {
        addErrorEvent('getScheduledEvents', error);
        throw error;
    }
}

// Event Invitees

/**
 * Fetch all invitees for a specific scheduled event.
 */
export async function getEventInvitees(eventUri: string): Promise<Invitee[]> {
    const allInvitees: Invitee[] = [];
    let nextPageToken: string | null = null;

    try {
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
    } catch (error) {
        addErrorEvent('getEventInvitees', error);
        throw error;
    }
}

// Composite: Events + Invitees

/**
 * Fetch all scheduled events within a time range and enrich each with its invitees.
 */
export async function getAllScheduledEventsWithInvitees(timeRange: CalendlyTimeRange): Promise<ScheduledEventWithInvitees[]> {
    try {
        const events = await getScheduledEvents(timeRange);
        const enrichedEvents: ScheduledEventWithInvitees[] = await Promise.all(
            events.map(async (event) => {
                const invitees = await getEventInvitees(event.uri);
                return { ...event, invitees };
            })
        );
        return enrichedEvents;
    } catch (error) {
        addErrorEvent('getAllScheduledEventsWithInvitees', error);
        throw error;
    }
}

// Event Types

/**
 * Get scheduling links from Calendly.
 * @returns Array of event types.
 */
export async function getSchedulingPageLink(): Promise<EventType[]> {
    const collection: EventType[] = [];
    let nextPageToken: string | null = null;

    try {
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
    } catch (error) {
        addErrorEvent('getSchedulingPageLink', error);
        throw error;
    }
    return collection;
}

// Event Type Classification

/** Known event type URI patterns — populated at runtime from Calendly event types */
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
export async function classifyEventType(event: ScheduledEvent): Promise<CalendlyEventCategory> {
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
 * Normalize a string for fuzzy comparison (lowercase, trim, collapse whitespace).
 */
function normalize(str: string): string {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if two names are a fuzzy match.
 * Handles: exact match, first-name-only match, last-name-only match, reversed order.
 */
function fuzzyNameMatch(firebaseName: string, calendlyName: string): boolean {
    const a = normalize(firebaseName);
    const b = normalize(calendlyName);

    if (a === b) return true;

    const aParts = a.split(' ');
    const bParts = b.split(' ');

    // Check if any parts overlap (first name or last name match)
    for (const ap of aParts) {
        for (const bp of bParts) {
            if (ap.length > 1 && bp.length > 1 && ap === bp) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Match donations against Calendly bookings.
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
    const confirmed: BookingMatchResult[] = [];
    const possibleMatches: BookingMatchResult[] = [];
    const unconfirmed: BookingMatchResult[] = [];
    const byDonationId: Record<string, BookingMatchResult> = {};

    // Build a flat list of all invitees across events
    const inviteeIndex: { invitee: Invitee; event: ScheduledEventWithInvitees }[] = [];
    for (const event of events) {
        for (const invitee of event.invitees) {
            inviteeIndex.push({ invitee, event });
        }
    }

    for (const donation of donations) {
        const lookupEmail = mode === 'dropoff' ? donation.donorEmail : (donation.requestor?.email ?? '');
        const lookupName = mode === 'dropoff' ? donation.donorName : (donation.requestor?.name ?? '');

        let result: BookingMatchResult = {
            donationId: donation.id,
            lookupEmail,
            lookupName,
            confidence: 'unconfirmed' as BookingMatchConfidence,
            matchReason: 'No matching Calendly booking found'
        };

        // Check for exact email match first
        const emailMatch = inviteeIndex.find((entry) => normalize(entry.invitee.email) === normalize(lookupEmail));

        if (emailMatch) {
            result = {
                ...result,
                confidence: 'confirmed',
                matchedEvent: emailMatch.event,
                matchedInvitee: emailMatch.invitee,
                matchReason: `Email match: ${emailMatch.invitee.email}`
            };
        } else if (lookupName) {
            // Check for name-based fuzzy match
            const nameMatch = inviteeIndex.find((entry) => fuzzyNameMatch(lookupName, entry.invitee.name));

            if (nameMatch) {
                result = {
                    ...result,
                    confidence: 'possible-match',
                    matchedEvent: nameMatch.event,
                    matchedInvitee: nameMatch.invitee,
                    matchReason: `Name match: "${nameMatch.invitee.name}" (email: ${nameMatch.invitee.email}) — Firebase email: ${lookupEmail}`
                };
            }
        }

        byDonationId[donation.id] = result;

        if (result.confidence === 'confirmed') {
            confirmed.push(result);
        } else if (result.confidence === 'possible-match') {
            possibleMatches.push(result);
        } else {
            unconfirmed.push(result);
        }
    }

    return { confirmed, possibleMatches, unconfirmed, byDonationId };
}

// High-level Booking Status Methods

/**
 * Get booking status for donations awaiting pickup (status: 'reserved').
 * Matches requestor emails/names against Calendly invitees.
 */
export async function getPickupBookingStatus(donations: Donation[], timeRange: CalendlyTimeRange): Promise<BookingStatusResult> {
    try {
        const allEvents = await getAllScheduledEventsWithInvitees(timeRange);

        // Filter to pickup events (or unknown — since we can't be sure)
        const classifiedEvents: ScheduledEventWithInvitees[] = [];
        for (const event of allEvents) {
            const category = await classifyEventType(event);
            if (category === 'pickup' || category === 'unknown') {
                classifiedEvents.push(event);
            }
        }

        const reservedDonations = donations.filter((d) => d.status === 'reserved');
        return matchDonationsToBookings(reservedDonations, classifiedEvents, 'pickup');
    } catch (error) {
        addErrorEvent('getPickupBookingStatus', error);
        return { confirmed: [], possibleMatches: [], unconfirmed: [], byDonationId: {} };
    }
}

/**
 * Get booking status for donations awaiting drop-off (status: 'pending delivery').
 * Matches donor emails/names against Calendly invitees.
 */
export async function getDropOffBookingStatus(donations: Donation[], timeRange: CalendlyTimeRange): Promise<BookingStatusResult> {
    try {
        const allEvents = await getAllScheduledEventsWithInvitees(timeRange);

        // Filter to drop-off events (or unknown)
        const classifiedEvents: ScheduledEventWithInvitees[] = [];
        for (const event of allEvents) {
            const category = await classifyEventType(event);
            if (category === 'dropoff' || category === 'unknown') {
                classifiedEvents.push(event);
            }
        }

        const pendingDeliveryDonations = donations.filter((d) => d.status === 'pending delivery');
        return matchDonationsToBookings(pendingDeliveryDonations, classifiedEvents, 'dropoff');
    } catch (error) {
        addErrorEvent('getDropOffBookingStatus', error);
        return { confirmed: [], possibleMatches: [], unconfirmed: [], byDonationId: {} };
    }
}
