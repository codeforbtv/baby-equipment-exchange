import { Donation } from '@/models/donation';
import { AuthUserRecord } from './UserTypes';

export type Notification = {
    donations: Donation[];
    users: AuthUserRecord[];
};
