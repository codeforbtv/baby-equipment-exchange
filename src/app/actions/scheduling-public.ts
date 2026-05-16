'use server';

import type { EventType } from 'scheduling';
import type { DocumentData, DocumentReference } from 'firebase-admin/firestore';
import { auth, addErrorEvent, db, DONATIONS_COLLECTION, ORDERS_COLLECTION } from '@/api/firebaseAdmin';
import { getSchedulingPageLink } from './scheduling';
import sendMail from '@/api/nodemailer';
import accept from '@/email-templates/accept';
import reject from '@/email-templates/reject';
import schedulePickup from '@/email-templates/schedulePickup';
import cancelOrder from '@/email-templates/cancelOrder';

export type SchedulingPageLinkOption = Pick<EventType, 'uri' | 'name' | 'scheduling_url'>;

type AdminSchedulingRequest = {
    idToken: string;
};

type AdminSchedulingEmailRequest = AdminSchedulingRequest & {
    eventTypeUri?: string;
    notes?: string;
};

type PickupSchedulingEmailRequest = AdminSchedulingEmailRequest & {
    orderId: string;
};

type DropOffSchedulingEmailRequest = AdminSchedulingEmailRequest & {
    acceptedDonationIds: string[];
    rejectedDonationIds: string[];
};

type CancelOrderSchedulingEmailRequest = AdminSchedulingEmailRequest & {
    orderId: string;
};

type DonationEmailSummary = {
    id: string;
    donorEmail: string;
    donorName: string;
    brand: string;
    model: string;
    tagNumber?: string | null;
};

type OrderEmailSummary = {
    requestor: { email: string; name: string };
    items: DonationEmailSummary[];
    rejectedItems: DonationEmailSummary[];
};

const GENERIC_SCHEDULING_ERROR = 'Unable to load scheduling links.';
const GENERIC_SCHEDULING_EMAIL_ERROR = 'Unable to send scheduling email.';
const MAX_NOTES_LENGTH = 2000;

function assertAdminSchedulingRequest(request: AdminSchedulingRequest): void {
    if (!request || typeof request.idToken !== 'string' || request.idToken.trim().length === 0) {
        throw new Error('Invalid scheduling request.');
    }
}

function assertSafeId(value: string, fieldName: string): void {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
        throw new Error(`Invalid ${fieldName}.`);
    }
}

function assertSafeNotes(notes: string | undefined): void {
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > MAX_NOTES_LENGTH)) {
        throw new Error('Invalid scheduling notes.');
    }
}

async function verifyAdminToken(idToken: string): Promise<void> {
    const decoded = await auth.verifyIdToken(idToken, true);
    if (decoded.admin !== true) {
        throw new Error('permission-denied');
    }
}

function toSchedulingPageLinkOption(eventType: EventType): SchedulingPageLinkOption | null {
    if (eventType.active !== true || !eventType.uri || !eventType.name || !eventType.scheduling_url) {
        return null;
    }

    return {
        uri: eventType.uri,
        name: eventType.name,
        scheduling_url: eventType.scheduling_url
    };
}

function escapeHtml(value: string | null | undefined): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function donationListHtml(donations: DonationEmailSummary[]): string {
    if (donations.length === 0) return '';
    return `<ul>${donations.map((donation) => {
        const tag = donation.tagNumber ? ` (${escapeHtml(donation.tagNumber)})` : '';
        return `<li>${escapeHtml(donation.brand)} ${escapeHtml(donation.model)}${tag}</li>`;
    }).join('')}</ul>`;
}

function donationSummary(id: string, data: DocumentData): DonationEmailSummary {
    return {
        id,
        donorEmail: String(data.donorEmail ?? ''),
        donorName: String(data.donorName ?? ''),
        brand: String(data.brand ?? ''),
        model: String(data.model ?? ''),
        tagNumber: data.tagNumber ? String(data.tagNumber) : null
    };
}

async function getDonationSummary(id: string): Promise<DonationEmailSummary> {
    assertSafeId(id, 'donation id');
    const snapshot = await db.collection(DONATIONS_COLLECTION).doc(id).get();
    if (!snapshot.exists) {
        throw new Error('Donation not found.');
    }
    return donationSummary(snapshot.id, snapshot.data() ?? {});
}

async function getDonationSummaries(ids: string[]): Promise<DonationEmailSummary[]> {
    if (!Array.isArray(ids)) {
        throw new Error('Invalid donation ids.');
    }
    return Promise.all(ids.map((id) => getDonationSummary(id)));
}

async function getOrderSummary(orderId: string): Promise<OrderEmailSummary> {
    assertSafeId(orderId, 'order id');
    const snapshot = await db.collection(ORDERS_COLLECTION).doc(orderId).get();
    if (!snapshot.exists) {
        throw new Error('Order not found.');
    }

    const data = snapshot.data() ?? {};
    const requestor = data.requestor;
    if (!requestor || typeof requestor.email !== 'string' || typeof requestor.name !== 'string') {
        throw new Error('Invalid order requestor.');
    }

    const getReferencedDonation = async (reference: DocumentReference): Promise<DonationEmailSummary> => {
        const donationSnapshot = await reference.get();
        if (!donationSnapshot.exists) {
            throw new Error('Referenced donation not found.');
        }
        return donationSummary(donationSnapshot.id, donationSnapshot.data() ?? {});
    };

    const itemRefs = Array.isArray(data.items) ? data.items : [];
    const rejectedItemRefs = Array.isArray(data.rejectedItems) ? data.rejectedItems : [];
    const [items, rejectedItems] = await Promise.all([
        Promise.all(itemRefs.map((reference) => getReferencedDonation(reference))),
        Promise.all(rejectedItemRefs.map((reference) => getReferencedDonation(reference)))
    ]);

    return {
        requestor: {
            email: requestor.email,
            name: requestor.name
        },
        items,
        rejectedItems
    };
}

async function getSchedulingUrl(eventTypeUri?: string): Promise<string> {
    if (!eventTypeUri) return '';
    const eventTypes = await getSchedulingPageLink();
    const eventType = eventTypes.find((candidate) => candidate.active === true && candidate.uri === eventTypeUri);
    if (!eventType?.scheduling_url) {
        throw new Error('Invalid scheduling link.');
    }
    return eventType.scheduling_url;
}

async function verifyAdminSchedulingEmailRequest(request: AdminSchedulingEmailRequest): Promise<string> {
    assertAdminSchedulingRequest(request);
    assertSafeNotes(request.notes);
    await verifyAdminToken(request.idToken);
    return getSchedulingUrl(request.eventTypeUri);
}

function assertSameDonor(donations: DonationEmailSummary[]): void {
    const [firstDonation] = donations;
    if (!firstDonation) return;
    const donorEmail = firstDonation.donorEmail;
    if (!donations.every((donation) => donation.donorEmail === donorEmail)) {
        throw new Error('Donations must belong to the same donor.');
    }
}

export async function getAdminSchedulingPageLinks(request: AdminSchedulingRequest): Promise<SchedulingPageLinkOption[]> {
    try {
        assertAdminSchedulingRequest(request);
        await verifyAdminToken(request.idToken);

        const eventTypes = await getSchedulingPageLink();
        return eventTypes.flatMap((eventType) => {
            const option = toSchedulingPageLinkOption(eventType);
            return option ? [option] : [];
        });
    } catch (error) {
        addErrorEvent('getAdminSchedulingPageLinks', error);
        throw new Error(GENERIC_SCHEDULING_ERROR);
    }
}

export async function sendPickupSchedulingEmail(request: PickupSchedulingEmailRequest): Promise<void> {
    try {
        const schedulingUrl = await verifyAdminSchedulingEmailRequest(request);
        assertSafeId(request.orderId, 'order id');

        const order = await getOrderSummary(request.orderId);
        const tagNumbers = order.items.flatMap((item) => (item.tagNumber ? [item.tagNumber] : []));
        const message = [
            `<p>Hello ${escapeHtml(order.requestor.name)}</p>`,
            '<p>Your request for the following items has been fulfilled:</p>',
            donationListHtml(order.items),
            order.rejectedItems.length > 0 ? '<p>Unfortunately, the following items you requested are no longer available:</p>' : '',
            donationListHtml(order.rejectedItems)
        ].join('');

        await sendMail(schedulePickup(order.requestor.email, schedulingUrl, message, tagNumbers, request.notes));
    } catch (error) {
        addErrorEvent('sendPickupSchedulingEmail', error);
        throw new Error(GENERIC_SCHEDULING_EMAIL_ERROR);
    }
}

export async function sendDropOffSchedulingEmail(request: DropOffSchedulingEmailRequest): Promise<void> {
    try {
        const schedulingUrl = await verifyAdminSchedulingEmailRequest(request);
        const [acceptedDonations, rejectedDonations] = await Promise.all([
            getDonationSummaries(request.acceptedDonationIds),
            getDonationSummaries(request.rejectedDonationIds)
        ]);
        const allDonations = [...acceptedDonations, ...rejectedDonations];
        assertSameDonor(allDonations);

        const donorEmail = allDonations[0]?.donorEmail;
        const donorName = allDonations[0]?.donorName;
        if (!donorEmail || !donorName) {
            throw new Error('No donor found for scheduling email.');
        }

        const message = [
            `<p>Hello ${escapeHtml(donorName)},</p>`,
            '<p>Thank you for submitting your donation to the Baby Product Exchange.</p>',
            acceptedDonations.length > 0 ? '<p>The following items have been accepted:</p>' : '',
            donationListHtml(acceptedDonations),
            rejectedDonations.length > 0 ? '<p>Unfortunately, the following items could not be accepted:</p>' : '',
            donationListHtml(rejectedDonations)
        ].join('');

        if (acceptedDonations.length > 0) {
            const tagNumbers = acceptedDonations.flatMap((donation) => (donation.tagNumber ? [donation.tagNumber] : []));
            await sendMail(accept(donorEmail, schedulingUrl, message, tagNumbers, request.notes));
            return;
        }

        await sendMail(reject(donorEmail, message, request.notes));
    } catch (error) {
        addErrorEvent('sendDropOffSchedulingEmail', error);
        throw new Error(GENERIC_SCHEDULING_EMAIL_ERROR);
    }
}

export async function sendCancelOrderSchedulingEmail(request: CancelOrderSchedulingEmailRequest): Promise<void> {
    try {
        const schedulingUrl = await verifyAdminSchedulingEmailRequest(request);
        assertSafeId(request.orderId, 'order id');

        const order = await getOrderSummary(request.orderId);
        const allItems = [...order.items, ...order.rejectedItems];
        const tagNumbers = allItems.flatMap((item) => (item.tagNumber ? [item.tagNumber] : []));
        const message = [
            `<p>Hello ${escapeHtml(order.requestor.name)},</p>`,
            order.items.length > 0
                ? '<p>Your request for the following items has been cancelled. These items will be returned to available inventory.</p>'
                : '',
            donationListHtml(order.items),
            order.rejectedItems.length > 0 ? '<p>Unfortunately, the following requested items are no longer available:</p>' : '',
            donationListHtml(order.rejectedItems)
        ].join('');

        await sendMail(cancelOrder(order.requestor.email, message, tagNumbers, request.notes, schedulingUrl || undefined));
    } catch (error) {
        addErrorEvent('sendCancelOrderSchedulingEmail', error);
        throw new Error(GENERIC_SCHEDULING_EMAIL_ERROR);
    }
}
