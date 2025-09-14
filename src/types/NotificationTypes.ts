import { Donation } from '@/models/donation';
import { UserCollection } from '@/models/user';

export type Notification = {
    donations: Donation[];
    users: UserCollection[];
};
