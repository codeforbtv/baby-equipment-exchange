import { Donation } from '@/models/donation';
import { Timestamp } from 'firebase/firestore';

export type RejectionRecord = {
    action: 'available' | 'unavailable' | 'requested';
    reservedFor?: { id: string; name: string; email: string };
    rejectedAt?: Timestamp;
};

export type OrderRequestor = {
    email: string;
    id: string;
    name: string;
    organization?: { id: string; name: string } | null;
};

export type Order = {
    id: string;
    status: string;
    requestor: OrderRequestor;
    items: Donation[];
    rejectedItems?: Donation[];
    rejections?: Record<string, RejectionRecord>;
    createdAt?: Timestamp;
    modfiedAt?: Timestamp;
};
