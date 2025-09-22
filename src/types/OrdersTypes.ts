import { Donation } from '@/models/donation';

export type Order = {
    id: string;
    status: string;
    requestor: { email: string; id: string; name: string };
    items: Donation[];
};
