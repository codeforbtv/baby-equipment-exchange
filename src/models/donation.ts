//Firebase types
import { Timestamp } from 'firebase/firestore';

export interface IDonation {
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    active: boolean | null | undefined;
    images: string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class Donation implements IDonation {
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    active: boolean | null | undefined;
    images: string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IDonation) {
        this.category = args.category;
        this.brand = args.brand;
        this.model = args.model;
        this.description = args.description;
        this.active = args.active;
        this.images = args.images;
        this.createdAt = args.createdAt;
        this.modifiedAt = args.modifiedAt;
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

    getImages(): string[] {
        return this.images;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
