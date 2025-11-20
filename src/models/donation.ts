//Firebase types
import { DocumentReference, Timestamp } from 'firebase/firestore';

export interface IDonationCache {
    [key: string]: string | number;
    id: string;
    modifiedAt: number;
}

export const donationStatuses = {
    'In Processing': 'in processing',
    'Pending Delivery': 'pending delivery',
    Available: 'available',
    Requested: 'requested',
    Reserved: 'reserved',
    Distributed: 'distributed',
    Rejected: 'rejected',
    Unavailable: 'unavailable'
};

export type DonationStatuses = typeof donationStatuses;
export type DonationStatusKeys = keyof DonationStatuses;
export type DonationStatusValues = DonationStatuses[keyof DonationStatuses];

export interface IDonation {
    [key: string]:
        | boolean
        | string[]
        | DocumentReference[]
        | DocumentReference
        | { id: string; name: string }
        | Timestamp
        | string
        | null
        | undefined
        | (() => string)
        | (() => string[] | DocumentReference[])
        | (() => string[] | null | undefined)
        | (() => DocumentReference | null)
        | (() => { id: string; name: string } | null)
        | ({ id: string; name: string; email: string; organization: string } | null)
        | (() => boolean | null | undefined)
        | (() => string | null | undefined)
        | (() => Timestamp)
        | (() => Timestamp | null | undefined)
        | (() => number | undefined);
    id: string;
    donorEmail: string;
    donorName: string;
    donorId: string;
    category: string;
    brand: string;
    model: string;
    description: string | null | undefined;
    tagNumber: string | null | undefined;
    notes: string[] | null | undefined;
    status: DonationStatusValues;
    bulkCollection: string;
    images: string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;
    dateAccepted: Timestamp | null | undefined;
    dateReceived: Timestamp | null | undefined;
    dateRequested: Timestamp | null | undefined;
    dateDistributed: Timestamp | null | undefined;
    requestor: { id: string; name: string; email: string } | null;
    distributor: { id: string; name: string; email: string; organization: string } | null;
}

export class Donation implements IDonation {
    [key: string]:
        | string
        | boolean
        | string[]
        | DocumentReference[]
        | DocumentReference
        | { id: string; name: string }
        | Timestamp
        | null
        | undefined
        | (() => string)
        | (() => string[] | DocumentReference[])
        | (() => string[] | null | undefined)
        | (() => DocumentReference | null)
        | (() => { id: string; name: string } | null)
        | ({ id: string; name: string; email: string; organization: string } | null)
        | (() => boolean | null | undefined)
        | (() => string | null | undefined)
        | (() => Timestamp)
        | (() => Timestamp | null | undefined)
        | (() => number | undefined);
    id: string;
    donorEmail: string;
    donorName: string;
    donorId: string;
    category: string;
    brand: string;
    model: string;
    description: string | null | undefined;
    tagNumber: string | null | undefined;
    notes: string[] | null | undefined;
    status: DonationStatusValues;
    bulkCollection: string;
    images: string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;
    dateAccepted: Timestamp | null | undefined;
    dateReceived: Timestamp | null | undefined;
    dateRequested: Timestamp | null | undefined;
    dateDistributed: Timestamp | null | undefined;
    requestor: { id: string; name: string; email: string } | null;
    distributor: { id: string; name: string; email: string; organization: string } | null;

    constructor(args: IDonation) {
        this.id = args.id;
        this.donorEmail = args.donorEmail;
        this.donorName = args.donorName;
        this.donorId = args.donorId;
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
        this.dateAccepted = args.dateAccepted as Timestamp;
        this.dateReceived = args.dateReceived as Timestamp;
        this.dateRequested = args.dateRequested as Timestamp;
        this.dateDistributed = args.dateDistributed as Timestamp;
        this.requestor = args.requestor;
        this.distributor = args.distributor;
    }

    getId(): string {
        return this.id;
    }

    getDonorEmail(): string {
        return this.donorEmail;
    }

    getDonorName(): string {
        return this.donorName;
    }

    getDonorId(): string {
        return this.donorId;
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

    getNotes(): string[] | null | undefined {
        return this.notes;
    }

    getStatus(): DonationStatusValues {
        return this.status;
    }

    getBulkCollection(): string {
        return this.bulkCollection;
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

    getDateAccepted(): Timestamp | null | undefined {
        return this.dateAccepted;
    }

    getDateReceived(): Timestamp | null | undefined {
        return this.dateReceived;
    }

    getDateRequested(): Timestamp | null | undefined {
        return this.dateRequested;
    }

    getDateDistributed(): Timestamp | null | undefined {
        return this.dateDistributed;
    }

    getRequestor(): { id: string; name: string; email: string } | null {
        return this.requestor;
    }

    getDistributor(): { id: string; name: string; email: string; organization: string } | null {
        return this.distributor;
    }

    getDaysInStorage(): number | undefined {
        if (this.dateReceived === undefined) {
            return undefined;
        }
        const dateReceived = this.dateReceived!;
        const dateDistributed = this.dateDistributed;
        const currentTime = Date.now();
        const daysInStorage = dateDistributed
            ? Math.floor((dateDistributed.toMillis() - dateReceived.toMillis()) / 86400000)
            : Math.floor((currentTime - dateReceived.toMillis()) / 86400000);
        return daysInStorage;
    }
}
