//Firebase types
import { Timestamp } from 'firebase/firestore';
//Plain Javascript objects
import { Address } from './address';
import { Contact } from './contact';

interface IDonationDetail {
    donation: string;
    availability: string;
    donor: string;
    tagNumber: string | null | undefined;
    tagNumberForItemDelivered: string | null | undefined;
    sku: string | null | undefined;
    recipientOrganization: string | null | undefined;
    images: Array<string>;
    daysInStorage: number;
    recipientContact: Contact | null | undefined;
    recipientAddress: Address | null | undefined;
    requestor: Contact | null | undefined;
    storage: Array<string> | null | undefined;
    dateRecieved: Timestamp | null | undefined;
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
    images: Array<string>;
    daysInStorage: number;
    recipientContact: Contact | null | undefined;
    recipientAddress: Address | null | undefined;
    requestor: Contact | null | undefined;
    storage: string[] | null | undefined;
    dateRecieved: Timestamp | null | undefined;
    dateDistributed: Timestamp | null | undefined;
    scheduledPickupDate: Timestamp | null | undefined;
    dateOrderFulfilled: Timestamp | null | undefined;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(
        donation: string,
        availability: string,
        donor: string,
        tagNumber: string | null | undefined,
        tagNumberForItemDelivered: string | null | undefined,
        sku: string | null | undefined,
        recipientOrganization: string | null | undefined,
        images: Array<string>,
        daysInStorage: number,
        recipientContact: Contact | null | undefined,
        recipientAddress: Address | null | undefined,
        requestor: Contact | null | undefined,
        storage: string[] | null | undefined,
        dateRecieved: Timestamp | null | undefined,
        dateDistributed: Timestamp | null | undefined,
        scheduledPickupDate: Timestamp | null | undefined,
        dateOrderFulfilled: Timestamp | null | undefined,
        createdAt: Timestamp,
        modifiedAt: Timestamp
    ) {
        this.donation = donation;
        this.availability = availability;
        this.donor = donor;
        this.tagNumber = tagNumber;
        this.tagNumberForItemDelivered = tagNumberForItemDelivered;
        this.sku = sku;
        this.recipientOrganization = recipientOrganization;
        this.images = images;
        this.daysInStorage = daysInStorage;
        this.recipientContact = recipientContact;
        this.recipientAddress = recipientAddress;
        this.requestor = requestor;
        this.storage = storage;
        this.dateRecieved = dateRecieved;
        this.dateDistributed = dateDistributed;
        this.scheduledPickupDate = scheduledPickupDate;
        this.dateOrderFulfilled = dateOrderFulfilled;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
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

    getImages(): Array<string> {
        return this.images;
    }

    getDaysInStorage(): number {
        return this.daysInStorage;
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

    getStorage(): Array<string> | null | undefined {
        return this.storage;
    }

    getDateRecieved(): Timestamp | null | undefined {
        return this.dateRecieved;
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
