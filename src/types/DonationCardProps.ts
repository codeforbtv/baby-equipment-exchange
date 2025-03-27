import { donationStatus } from '@/models/donation';

export type DonationCardProps = {
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    status: donationStatus;
    images: Array<string>;
};
