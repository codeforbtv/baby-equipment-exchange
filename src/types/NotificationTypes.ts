import { Donation } from '@/models/donation';
import { IUser } from '@/models/user';
import { Order } from './OrdersTypes';

/**
 * Individual notification data slices.
 *
 * Each slice is fetched independently and can be refreshed without touching
 * the other two.
 */
export type NotificationData = {
    donations: Donation[];
    users: IUser[];
    orders: Order[];
};

/**
 * Typed callbacks passed down through the notification component tree.
 *
 * When a mutation succeeds (e.g. "Mark as received", "Approve user") the item
 * is guaranteed to no longer belong in the notification feed. Instead of
 * triggering a Firebase re-fetch, the parent removes the specific item
 * from its local state — zero extra network calls.
 *
 * handleRefresh() on Dashboard remains the single path for a full re-fetch.
 */
export type NotificationCallbacks = {
    /** Remove a donation from the feed by its Firestore document id. */
    onDonationRemoved: (id: string) => void;
    /** Remove an order from the feed by its Firestore document id. */
    onOrderRemoved: (id: string) => void;
    /** Remove a user from the feed by their uid. */
    onUserRemoved: (uid: string) => void;
};
