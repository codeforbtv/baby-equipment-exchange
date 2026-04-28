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

