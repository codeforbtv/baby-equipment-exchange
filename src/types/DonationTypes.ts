import { SetStateAction, Dispatch } from 'react';

import { Timestamp, DocumentReference } from 'firebase/firestore';

export type donationStatus = 'in processing' | 'pending delivery' | 'available' | 'requested' | 'reserved' | 'distributed';

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
    status: donationStatus;
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

export type DonationFormProps = {
    setShowForm: Dispatch<SetStateAction<boolean>>;
};

export type InventoryItemCardProps = {
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    status: donationStatus;
    images: Array<string>;
    modifiedAt: Timestamp;
    requestor: DocumentReference | null;
};
