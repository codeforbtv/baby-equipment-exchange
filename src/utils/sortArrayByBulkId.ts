import { Donation } from '@/models/donation';

/**
 * Groups donations by bulkCollection ID.
 * Treats donations with no bulkCollection ID as their own group key.
 * Returns an array of objects with the bulkCollection ID as the key and the array of donations with that bulkCollection ID as the value.
 */
export const sortArrayByBulkId = (array: Donation[]): { key: string; donations: Donation[] }[] => {
    const grouped = array.reduce(
        (acc, item) => {
            const key = item.bulkCollection ?? item.id;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        },
        {} as Record<string, Donation[]>
    );
    return Object.entries(grouped).map(([key, donations]) => ({
        key,
        donations
    }));
};
