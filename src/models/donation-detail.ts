//Firebase types
import { Timestamp } from 'firebase/firestore';
//Plain Javascript objects
import { Address } from './address';
import { Contact } from './contact';

export interface IDonationDetail {
    donation: string;
    availability: string;
    donor: string;
    tagNumber: string | null | undefined;
    tagNumberForItemDelivered: string | null | undefined;
    sku: string | null | undefined;
    recipientOrganization: string | null | undefined;
    images: string[];
    recipientContact: Contact | null | undefined;
    recipientAddress: Address | null | undefined;
    requestor: Contact | null | undefined;
    storage: string[] | null | undefined;
    dateReceived: Timestamp | null | undefined;
    dateDistributed: Timestamp | null | undefined;
    scheduledPickupDate: Timestamp | null | undefined;
    dateOrderFulfilled: Timestamp | null | undefined;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class DonationDetail implements IDonationDetail {
    donation: string;
    availability: string;
    donor: string;
    tagNumber: string | null | undefined;
    tagNumberForItemDelivered: string | null | undefined;
    sku: string | null | undefined;
    recipientOrganization: string | null | undefined;
    images: string[];
    recipientContact: Contact | null | undefined;
    recipientAddress: Address | null | undefined;
    requestor: Contact | null | undefined;
    storage: string[] | null | undefined;
    dateReceived: Timestamp | null | undefined;
    dateDistributed: Timestamp | null | undefined;
    scheduledPickupDate: Timestamp | null | undefined;
    dateOrderFulfilled: Timestamp | null | undefined;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IDonationDetail) {
        this.donation = args.donation;
        this.availability = args.availability;
        this.donor = args.donor;
        this.tagNumber = args.tagNumber;
        this.tagNumberForItemDelivered = args.tagNumberForItemDelivered;
        this.sku = args.sku;
        this.recipientOrganization = args.recipientOrganization;
        this.images = args.images;
        this.recipientContact = args.recipientContact;
        this.recipientAddress = args.recipientAddress;
        this.requestor = args.requestor;
        this.storage = args.storage;
        this.dateReceived = args.dateReceived;
        this.dateDistributed = args.dateDistributed;
        this.scheduledPickupDate = args.scheduledPickupDate;
        this.dateOrderFulfilled = args.dateOrderFulfilled;
        this.createdAt = args.createdAt;
        this.modifiedAt = args.modifiedAt;
    }

    getDonation(): string {
        return this.donation;
    }

    getAvailability(): string {
        return this.availability;
    }

    getDonor(): string {
        return this.donor;
    }

    getTagNumber(): string | null | undefined {
        return this.tagNumber;
    }

    getTagNumberForItemDelivered(): string | null | undefined {
        return this.tagNumberForItemDelivered;
    }

    getSku(): string | null | undefined {
        return this.sku;
    }

    getRecipientOrganization(): string | null | undefined {
        return this.recipientOrganization;
    }

    getImages(): string[] {
        return this.images;
    }

    getDaysInStorage(): number | undefined {
        if (this.dateReceived === undefined) {
            return undefined;
        }
        const dateReceived = this.dateReceived!.toDate().getUTCMilliseconds();
        const currentTime = Date.now();
        const daysInStorage = Math.floor((currentTime - dateReceived) / 86400000);
        return daysInStorage;
    }

    getRecipientContact(): Contact | null | undefined {
        return this.recipientContact;
    }

    getRecipientAddress(): Address | null | undefined {
        return this.recipientAddress;
    }

    getRequestor(): Contact | null | undefined {
        return this.requestor;
    }

    getStorage(): string[] | null | undefined {
        return this.storage;
    }

    getDateReceived(): Timestamp | null | undefined {
        return this.dateReceived;
    }

    getDateDistributed(): Timestamp | null | undefined {
        return this.dateDistributed;
    }

    getScheduledPickupDate(): Timestamp | null | undefined {
        return this.scheduledPickupDate;
    }

    getDateOrderFulfilled(): Timestamp | null | undefined {
        return this.dateOrderFulfilled;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
