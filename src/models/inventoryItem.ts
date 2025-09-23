import { DocumentReference, Timestamp } from 'firebase/firestore';

import { DonationStatusValues } from './donation';

export interface IInventoryItem {
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
    category: string;
    brand: string;
    model: string;
    description: string | null | undefined;
    tagNumber: string | null | undefined;
    status: DonationStatusValues;
    images: DocumentReference[] | string[];
}

export class InventoryItem implements IInventoryItem {
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
    category: string;
    brand: string;
    model: string;
    description: string | null | undefined;
    tagNumber: string | null | undefined;
    status: DonationStatusValues;
    images: DocumentReference[] | string[];

    constructor(args: IInventoryItem) {
        this.id = args.id;

        this.category = args.category;
        this.brand = args.brand;
        this.model = args.model;
        this.description = args.description;
        this.tagNumber = args.tagNumber;
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

    getCategory(): string {
        return this.category;
    }

    getBrand(): string {
        return this.brand;
    }

    getModel(): string {
        return this.model;
    }

    getDescription(): string | null | undefined {
        return this.description;
    }

    getTagNumber(): string | null | undefined {
        return this.tagNumber;
    }

    getStatus(): DonationStatusValues {
        return this.status;
    }

    getImages(): string[] | DocumentReference[] {
        return this.images;
    }
}
