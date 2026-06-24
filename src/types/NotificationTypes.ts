import { Donation } from '@/models/donation';
import { IUser } from '@/models/user';
import { Timestamp } from 'firebase/firestore';
import { Order } from './OrdersTypes';

export type ReservedOrderLink = {
    donationId: string;
    orderId: string;
    orderCreatedAt: Timestamp | null;
};

export type Notification = {
    donations: Donation[];
    users: IUser[];
    orders: Order[];
    reservedOrderLinks: ReservedOrderLink[];
};
