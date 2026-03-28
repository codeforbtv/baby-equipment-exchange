//Firebase types
import { Timestamp, serverTimestamp } from 'firebase/firestore';
//Plain JavaScript objects
import { IAddress } from './address';
import { IContact } from './contact';


export interface IStorage {
    [key: string]:
        | boolean
        | string
        | IAddress
        | IContact
        | Timestamp
        | (() => boolean)
        | (() => IAddress)
        | (() => IContact)
        | (() => string)
        | (() => Timestamp);
    id: string;
    active: boolean;
    name: string;
    address: IAddress;
    pointOfContact: IContact;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class Storage implements IStorage {
    [key: string]:
        | boolean
        | string
        | IAddress
        | IContact
        | Timestamp
        | (() => boolean)
        | (() => IAddress)
        | (() => IContact)
        | (() => string)
        | (() => Timestamp);
    id: string;
    active: boolean;
    name: string;
    address: IAddress;
    pointOfContact: IContact;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IStorage) {
        this.id = args.id;
        this.active = args.active;
        this.name = args.name;
        this.address = args.address;
        this.pointOfContact = args.pointOfContact;
        this.createdAt = args.createdAt;
        this.modifiedAt = args.modifiedAt;
    }

    getId(): string {
        return this.id;
    }

    getActive(): boolean {
        return this.active;
    }

    getName(): string {
        return this.name;
    }

    getAddress(): IAddress {
        return this.address;
    }

    getPointOfContact(): IContact {
        return this.pointOfContact;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
