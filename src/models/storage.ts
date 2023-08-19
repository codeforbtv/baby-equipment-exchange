//Firebase types
import { Timestamp } from 'firebase/firestore';
//Plain JavaScript objects
import { Address } from './address';
import { Contact } from './contact';
import { Name } from './name';

interface IStorage {
    active: boolean;
    name: string;
    address: Address;
    pointOfContact: Contact;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class Storage implements IStorage {
    active: boolean;
    name: string;
    address: Address;
    pointOfContact: Contact;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(active: boolean, name: string, address: Address, pointOfContact: Contact, createdAt: Timestamp, modifiedAt: Timestamp) {
        this.active = active;
        this.name = name;
        this.address = address;
        this.pointOfContact = pointOfContact;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
    }

    getActive(): boolean {
        return this.active;
    }

    getName(): string {
        return this.name;
    }

    getAddress(): Address {
        return this.address;
    }

    getPointOfContact(): Contact {
        return this.pointOfContact;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
