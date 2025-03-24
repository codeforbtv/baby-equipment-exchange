//Firebase types
import { DocumentData, DocumentReference, Timestamp } from 'firebase/firestore';

export interface IDonationCache {
    [key: string]: string | number;
    id: string;
    modifiedAt: number;
}
export type donationStatus = 'pending review' | 'pending delivery' | 'in processing' | 'available' | 'designated for distribution' | 'distributed';

export interface IDonation {
    [key: string]:
        | boolean
        | string[]
        | DocumentReference[]
        | DocumentReference
        | Timestamp
        | string
        | null
        | undefined
        | (() => string)
        | (() => string[] | DocumentReference[])
        | (() => DocumentReference | null)
        | (() => boolean | null | undefined)
        | (() => string | null | undefined)
        | (() => Timestamp);
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    status: donationStatus;
    bulkCollection: DocumentReference | null;
    images: DocumentReference[] | string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class Donation implements IDonation {
    [key: string]:
        | string
        | boolean
        | string[]
        | DocumentReference[]
        | DocumentReference
        | Timestamp
        | null
        | undefined
        | (() => string)
        | (() => string[] | DocumentReference[])
        | (() => DocumentReference | null)
        | (() => boolean | null | undefined)
        | (() => string | null | undefined)
        | (() => Timestamp);
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    status: donationStatus;
    bulkCollection: DocumentReference | null;
    images: string[] | DocumentReference[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IDonation) {
        this.id = args.id;
        this.category = args.category;
        this.brand = args.brand;
        this.model = args.model;
        this.description = args.description;
        this.status = args.status;
        this.bulkCollection = args.bulkCollection;
        this.images = args.images;
        this.createdAt = args.createdAt as Timestamp;
        this.modifiedAt = args.modifiedAt as Timestamp;
    }

    getId(): string {
        return this.id;
    }

    getCategory(): string | null | undefined {
        return this.category;
    }

    getBrand(): string | null | undefined {
        return this.brand;
    }

    getModel(): string | null | undefined {
        return this.model;
    }

    getDescription(): string | null | undefined {
        return this.description;
    }

    getStatus(): donationStatus {
        return this.status;
    }

    getBulkCollection(): DocumentReference | null {
        return this.bulkCollection;
    }

    getImages(): string[] | DocumentReference[] {
        return this.images;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
