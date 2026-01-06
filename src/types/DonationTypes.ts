import { SetStateAction, Dispatch } from 'react';

import { Timestamp, DocumentReference } from 'firebase/firestore';
import { InventoryItem } from '@/models/inventoryItem';

import { DonationStatusValues } from '@/models/donation';

export type base64ImageObj = {
    base64Image: string;
    base64ImageName: string;
    base64ImageType: string;
};

export type DonationCardProps = {
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    status: DonationStatusValues;
    images: Array<string>;
};

export type DonationFormData = {
    category: string | null;
    brand: string | null;
    model: string | null;
    description: string | null;
    images: File[] | null | undefined;
    base64Images?: base64ImageObj[];
};

export type DonationBody = {
    donorEmail: string;
    donorName: string;
    donorId: string;
    category: string;
    brand: string;
    model: string;
    description: string;
    images: string[];
};

export type AdminDonationBody = DonationBody & {
    tagNumber: string;
};
