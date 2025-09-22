import { Donation } from '@/models/donation';
import { AuthUserRecord } from './UserTypes';
import { Order } from './OrdersTypes';

export type Notification = {
    donations: Donation[];
    users: AuthUserRecord[];
    orders: Order[];
};
