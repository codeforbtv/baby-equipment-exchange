export type DonationCardProps = {
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    active: boolean | null | undefined;
    images: Array<string>;
};
