import { Image } from './image';

interface IDonation {
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    active: boolean | null | undefined;
    images: Array<string>;
    createdAt: Date;
    modifiedAt: Date;
}

export class Donation implements IDonation {
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    active: boolean | null | undefined;
    images: Array<string>;
    createdAt: Date;
    modifiedAt: Date;

    constructor(
        category: string | null | undefined,
        brand: string | null | undefined,
        model: string | null | undefined,
        description: string | null | undefined,
        active: boolean | null | undefined,
        images: Array<string>,
        createdAt: Date,
        modifiedAt: Date
    ) {
        this.category = category;
        this.brand = brand;
        this.model = model;
        this.description = description;
        this.active = active;
        this.images = images;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
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

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getModifiedAt(): Date {
        return this.modifiedAt;
    }
}
