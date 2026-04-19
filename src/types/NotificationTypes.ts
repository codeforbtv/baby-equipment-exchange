import { Donation } from '@/models/donation';
import { IUser } from '@/models/user';
import { Order } from './OrdersTypes';
import { BookingStatusResult, CalendlyTimeRange } from './CalendlyTypes';

export type Notification = {
    donations: Donation[];
    users: IUser[];
    orders: Order[];
};

// Extended notification data with Calendly booking status

export type NotificationData = Notification & {
    pickupBookingStatus: BookingStatusResult | null;
    dropOffBookingStatus: BookingStatusResult | null;
    calendlyTimeRange: CalendlyTimeRange;
};

// Notification Feed Types

export type NotificationFilterType =
    | 'all'
    | 'pending-donations'
    | 'pending-deliveries'
    | 'pending-users'
    | 'requested-equipment'
    | 'reserved'
    | 'unconfirmed-bookings';

export interface NotificationItem {
    /** Unique identifier for this notification item */
    id: string;
    /** Notification category */
    type: NotificationFilterType;
    /** Computed priority (lower = more urgent) */
    priority: number;
    /** Primary display text */
    title: string;
    /** Secondary display text */
    subtitle: string;
    /** When this item was last updated */
    timestamp: Date;
    /** The ID of the entity (donation, user, order) this refers to */
    entityId: string;
    /** Type of entity for navigation */
    entityType: 'donation' | 'user' | 'order';
    /** Dashboard sub-tab name to navigate to */
    tab: string;
    /** Dashboard Notifications sub-tab index to switch to */
    tabIndex: number;
    /** Whether this is a new/unviewed item */
    isNew: boolean;
    /** Calendly booking status, if applicable */
    calendlyStatus?: 'confirmed' | 'possible-match' | 'unconfirmed';
}
