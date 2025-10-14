import { Donation } from '@/models/donation';
import { Timestamp } from 'firebase/firestore';

export type Order = {
    id: string;
    status: string;
    requestor: { email: string; id: string; name: string };
    items: Donation[];
    createdAt?: Timestamp;
    modfiedAt?: Timestamp;
};
