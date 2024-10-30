//Firebase types
import { DocumentReference, Timestamp } from 'firebase/firestore';
//Plain Javascript objects
import { Address } from './address';
import { Contact } from './contact';
import { Donation } from './donation';

export interface IDonationDetail {
    [key: string]: any;
    donation: DocumentReference;
    availability: string | null | undefined;
    donor: DocumentReference;
    tagNumber: string | null | undefined;
    tagNumberForItemDelivered: string | null | undefined;
    sku: string | null | undefined;
    recipientOrganization: DocumentReference | null | undefined;
    images: DocumentReference[];
    recipientContact: Contact | null | undefined;
    recipientAddress: Address | null | undefined;
    requestor: Contact | null | undefined;
    storage: DocumentReference[] | null | undefined;
    dateReceived: number | null | undefined;
    dateDistributed: number | null | undefined;
    scheduledPickupDate: number | null | undefined;
    dateOrderFulfilled: number | null | undefined;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class DonationDetail implements IDonationDetail {
    [key: string]: any;
    donation: DocumentReference;
    availability: string | null | undefined;
    donor: DocumentReference;
    tagNumber: string | null | undefined;
    tagNumberForItemDelivered: string | null | undefined;
    sku: string | null | undefined;
    recipientOrganization: DocumentReference | null | undefined;
    images: DocumentReference[];
    recipientContact: Contact | null | undefined;
    recipientAddress: Address | null | undefined;
    requestor: Contact | null | undefined;
    storage: DocumentReference[] | null | undefined;
    dateReceived: number | null | undefined;
    dateDistributed: number | null | undefined;
    scheduledPickupDate: number | null | undefined;
    dateOrderFulfilled: number | null | undefined;
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

    getDonation(): DocumentReference {
        return this.donation;
    }

    getAvailability(): string | null | undefined {
        return this.availability;
    }

    getDonor(): DocumentReference {
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

    getRecipientOrganization(): DocumentReference | null | undefined {
        return this.recipientOrganization;
    }

    getImages(): DocumentReference[] {
        return this.images;
    }

    getDaysInStorage(): number | undefined {
        if (this.dateReceived === undefined) {
            return undefined;
        }
        const dateReceived = this.dateReceived!;
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

    getStorage(): DocumentReference[] | null | undefined {
        return this.storage;
    }

    getDateReceived(): number | null | undefined {
        return this.dateReceived;
    }

    getDateDistributed(): number | null | undefined {
        return this.dateDistributed;
    }

    getScheduledPickupDate(): number | null | undefined {
        return this.scheduledPickupDate;
    }

    getDateOrderFulfilled(): number | null | undefined {
        return this.dateOrderFulfilled;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }

    setDonation(donation: DocumentReference) {
        this.donation = donation;
    }
}

export class DonationDetailNoRefs implements Omit<DonationDetail, 'donation'> {
    donation!: Donation;
}
