//Firebase types
import { Timestamp } from 'firebase/firestore';
//Plain JavaScript objects
import { Address } from './address';
import { Phone } from './phone';

export interface IUserDetail {
    user: string;
    emails: string[];
    phones: Phone[];
    addresses: Address[];
    websites: string[];
    notes: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class UserDetail implements IUserDetail {
    user: string;
    emails: string[];
    phones: Phone[];
    addresses: Address[];
    websites: string[];
    notes: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IUserDetail) {
        this.user = args.user;
        this.emails = args.emails;
        this.phones = args.phones;
        this.addresses = args.addresses;
        this.websites = args.websites;
        this.notes = args.notes;
        this.createdAt = args.createdAt;
        this.modifiedAt = args.modifiedAt;
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

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
