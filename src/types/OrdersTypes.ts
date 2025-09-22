import { Donation } from '@/models/donation';

export type Order = {
    status: string;
    requestor: { email: string; id: string; name: string };
    items: Donation[];
};
