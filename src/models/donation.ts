//Firebase types
import { DocumentReference, Timestamp } from 'firebase/firestore';

export interface IDonationCache {
    [key: string]: string | number;
    id: string;
    modifiedAt: number;
}

export interface IDonation {
    [key: string]:
        | boolean
        | string[]
        | DocumentReference[]
        | Timestamp
        | string
        | null
        | undefined
        | (() => string)
        | (() => string[] | DocumentReference[])
        | (() => boolean | null | undefined)
        | (() => string | null | undefined)
        | (() => Timestamp);
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    active: boolean | null | undefined;
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
        | Timestamp
        | null
        | undefined
        | (() => string)
        | (() => string[] | DocumentReference[])
        | (() => boolean | null | undefined)
        | (() => string | null | undefined)
        | (() => Timestamp);
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    active: boolean | null | undefined;
    images: string[] | DocumentReference[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IDonation) {
        this.id = args.id;
        this.category = args.category;
        this.brand = args.brand;
        this.model = args.model;
        this.description = args.description;
        this.active = args.active;
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

    getActive(): boolean | null | undefined {
        return this.active;
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
