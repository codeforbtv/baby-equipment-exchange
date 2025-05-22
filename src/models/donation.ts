//Firebase types
import { DocumentReference, Timestamp } from 'firebase/firestore';

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
        | (() => Timestamp)
        | (() => Timestamp | null | undefined)
        | (() => number | undefined);
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    tagNumber: string | null | undefined;
    notes: string | null | undefined;
    status: donationStatus;
    bulkCollection: DocumentReference | null;
    images: DocumentReference[] | string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;
    dateReceived: Timestamp | null | undefined;
    dateDistributed: Timestamp | null | undefined;
    requestor: DocumentReference | null;
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
        | (() => Timestamp)
        | (() => Timestamp | null | undefined)
        | (() => number | undefined);
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    tagNumber: string | null | undefined;
    notes: string | null | undefined;
    status: donationStatus;
    bulkCollection: DocumentReference | null;
    images: DocumentReference[] | string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;
    dateReceived: Timestamp | null | undefined;
    dateDistributed: Timestamp | null | undefined;
    requestor: DocumentReference | null;

    constructor(args: IDonation) {
        this.id = args.id;
        this.category = args.category;
        this.brand = args.brand;
        this.model = args.model;
        this.description = args.description;
        this.tagNumber = args.tagNumber;
        this.notes = args.notes;
        this.status = args.status;
        this.bulkCollection = args.bulkCollection;
        this.images = args.images;
        this.createdAt = args.createdAt as Timestamp;
        this.modifiedAt = args.modifiedAt as Timestamp;
        this.dateReceived = args.dateReceived as Timestamp;
        this.dateDistributed = args.dateDistributed as Timestamp;
        this.requestor = args.requestor;
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

    getTagNumber(): string | null | undefined {
        return this.tagNumber;
    }

    getNotes(): string | null | undefined {
        return this.notes;
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

    getDateReceived(): Timestamp | null | undefined {
        return this.dateReceived;
    }

    getDateDistributed(): Timestamp | null | undefined {
        return this.dateDistributed;
    }

    getRequestor(): DocumentReference | null {
        return this.requestor;
    }

    getDaysInStorage(): number | undefined {
        if (this.dateReceived === undefined) {
            return undefined;
        }
        const dateReceived = this.dateReceived!;
        const currentTime = Date.now();
        const daysInStorage = Math.floor((currentTime - dateReceived.toMillis()) / 86400000);
        return daysInStorage;
    }
}
