import { Donation } from '@/models/donation';
import { IUser } from '@/models/user';
import { Order } from './OrdersTypes';

export type Notification = {
    donations: Donation[];
    users: IUser[];
    orders: Order[];
};
