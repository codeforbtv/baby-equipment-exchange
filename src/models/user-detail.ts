import { Address } from './address';
import { Name } from './name';
import { Phone } from './phone';

interface IUserDetail {
    user: string;
    emails: Array<string>;
    phones: Array<Phone>;
    addresses: Array<Address>;
    websites: Array<string>;
    notes: string;
    createdAt: Date;
    modifiedAt: Date;
}

export class UserDetail implements IUserDetail {
    user: string;
    emails: string[];
    phones: Phone[];
    addresses: Address[];
    websites: string[];
    notes: string;
    createdAt: Date;
    modifiedAt: Date;

    constructor(user: string, emails: string[], phones: Phone[], addresses: Address[], websites: string[], notes: string, createdAt: Date, modifiedAt: Date) {
        this.user = user;
        this.emails = emails;
        this.phones = phones;
        this.addresses = addresses;
        this.websites = websites;
        this.notes = notes;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
    }

    getUser(): string {
        return this.user;
    }

    getEmails(): string[] {
        return this.emails;
    }

    getPhones(): Phone[] {
        return this.phones;
    }

    getAddresses(): Address[] {
        return this.addresses;
    }

    getWebsites(): string[] {
        return this.websites;
    }

    getNotes(): string {
        return this.notes;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getModifiedAt(): Date {
        return this.modifiedAt;
    }
}
