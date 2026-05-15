'use server';

import 'server-only';
import { NotificationData, NotificationItem, NotificationFilterType } from '@/types/NotificationTypes';
import { BookingStatusResult, BookingMatchConfidence } from '@/types/CalendlyTypes';

// Priority Computation

/**
 * Priority tiers (lower = more urgent):
 * 0-9:   Critical — unconfirmed bookings past scheduled date
 * 10-19: High — unconfirmed bookings, new user requests
 * 20-29: Medium — pending donations, requested equipment
 * 30-39: Standard — reserved, pending deliveries with confirmed bookings
 * 40-49: Low — informational
 */

function daysSince(timestamp: Date): number {
    return Math.floor((Date.now() - timestamp.getTime()) / 86400000);
}

type DateLike = string | Date | { toDate?: () => Date; toMillis?: () => number } | null | undefined;

function toDateValue(timestamp: DateLike): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp);
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    if (timestamp.toMillis) return new Date(timestamp.toMillis());
    if (timestamp.toDate) return timestamp.toDate();
    return new Date();
}

function getCalendlyStatusForDonation(
    donationId: string,
    pickupStatus: BookingStatusResult | null,
    dropOffStatus: BookingStatusResult | null,
    donationStatusType: 'pickup' | 'dropoff'
): BookingMatchConfidence {
    const statusResult = donationStatusType === 'pickup' ? pickupStatus : dropOffStatus;
    if (!statusResult) return 'unconfirmed';
    return statusResult.byDonationId[donationId]?.confidence ?? 'unconfirmed';
}

// Compute Notification Items

/**
 * Transforms raw notification data into a prioritized, flat list of NotificationItems.
 * Used by both the Dashboard Notifications tab and the Notification Feed.
 */
export async function computeNotificationItems(data: NotificationData): Promise<NotificationItem[]> {
    const items: NotificationItem[] = [];

    // Pending donations (in processing)
    const pendingDonations = data.donations.filter((d) => d.status === 'in processing');
    for (const donation of pendingDonations) {
        const createdAt = toDateValue(donation.createdAt);
        const age = daysSince(createdAt);
        items.push({
            id: `pending-donation-${donation.id}`,
            type: 'pending-donations',
            priority: 20 - Math.min(age, 10), // Older = more urgent
            title: `${donation.brand} - ${donation.model}`,
            subtitle: `Donated by ${donation.donorName} — awaiting approval`,
            timestamp: createdAt,
            entityId: donation.id,
            entityType: 'donation',
            tab: 'Pending Approval',
            tabIndex: 0,
            isNew: age <= 1
        });
    }

    // Pending deliveries (pending delivery)
    const pendingDeliveries = data.donations.filter((d) => d.status === 'pending delivery');
    for (const donation of pendingDeliveries) {
        const calendlyStatus = getCalendlyStatusForDonation(donation.id, data.pickupBookingStatus, data.dropOffBookingStatus, 'dropoff');
        const basePriority = calendlyStatus === 'unconfirmed' ? 10 : calendlyStatus === 'possible-match' ? 15 : 30;
        const dateAccepted = toDateValue(donation.dateAccepted);
        const age = daysSince(dateAccepted);

        items.push({
            id: `pending-delivery-${donation.id}`,
            type: 'pending-deliveries',
            priority: basePriority - Math.min(age, 5),
            title: `${donation.brand} - ${donation.model}`,
            subtitle: `From ${donation.donorName}${calendlyStatus === 'unconfirmed' ? ' — ⚠ NO booking scheduled' : ''}`,
            timestamp: dateAccepted,
            entityId: donation.id,
            entityType: 'donation',
            tab: 'Pending Deliveries',
            tabIndex: 1,
            isNew: false,
            calendlyStatus
        });
    }

    // Reserved donations (pickup)
    const reservedDonations = data.donations.filter((d) => d.status === 'reserved');
    for (const donation of reservedDonations) {
        const calendlyStatus = getCalendlyStatusForDonation(donation.id, data.pickupBookingStatus, data.dropOffBookingStatus, 'pickup');
        const basePriority = calendlyStatus === 'unconfirmed' ? 10 : calendlyStatus === 'possible-match' ? 15 : 30;
        const dateRequested = toDateValue(donation.dateRequested);
        const age = daysSince(dateRequested);

        items.push({
            id: `reserved-${donation.id}`,
            type: 'reserved',
            priority: basePriority - Math.min(age, 5),
            title: `${donation.brand} - ${donation.model}`,
            subtitle: `Reserved by ${donation.requestor?.name ?? 'Unknown'}${calendlyStatus === 'unconfirmed' ? ' — ⚠ NO pickup scheduled' : ''}`,
            timestamp: dateRequested,
            entityId: donation.id,
            entityType: 'donation',
            tab: 'Reserved',
            tabIndex: 3,
            isNew: false,
            calendlyStatus
        });
    }

    // Requested equipment (orders)
    for (const order of data.orders) {
        const createdAt = toDateValue(order.createdAt);
        items.push({
            id: `order-${order.id}`,
            type: 'requested-equipment',
            priority: 20,
            title: `${order.requestor.name} — ${order.items.length} items`,
            subtitle: `Equipment request pending review`,
            timestamp: createdAt,
            entityId: order.id,
            entityType: 'order',
            tab: 'Requested',
            tabIndex: 2,
            isNew: false
        });
    }

    // Pending users
    const pendingUsers = data.users.filter((u) => !u.isDeleted);
    for (const user of pendingUsers) {
        const created = toDateValue(user.createdAt as DateLike);
        const age = daysSince(created);

        items.push({
            id: `user-${user.uid}`,
            type: 'pending-users',
            priority: 12 - Math.min(age, 5), // New users are high priority
            title: user.displayName,
            subtitle: `${user.email} — awaiting approval`,
            timestamp: created,
            entityId: user.uid,
            entityType: 'user',
            tab: 'Pending Users',
            tabIndex: 4,
            isNew: age <= 1
        });
    }

    // Sort by priority (ascending — lower number = higher urgency), then by timestamp (newest first)
    items.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.timestamp.getTime() - a.timestamp.getTime();
    });

    return items;
}

//  Filter Helpers

/**
 * Filter notification items by type.
 */
export async function filterNotificationItems(items: NotificationItem[], filter: NotificationFilterType): Promise<NotificationItem[]> {
    if (filter === 'all') return items;
    if (filter === 'unconfirmed-bookings') {
        return items.filter((item) => item.calendlyStatus === 'unconfirmed' || item.calendlyStatus === 'possible-match');
    }
    return items.filter((item) => item.type === filter);
}
