//Firebase types
import { Timestamp } from 'firebase/firestore'
//Plain JavaScript objects
import { Address } from './address'
import { Contact } from './contact'

export interface IStorage {
    [key: string]: boolean | string | Address | Contact | Timestamp | (() => boolean) | (() => Address) | (() => Contact) | (() => string) | (() => Timestamp)
    active: boolean
    name: string
    address: Address
    pointOfContact: Contact
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class Storage implements IStorage {
    [key: string]: boolean | string | Address | Contact | Timestamp | (() => boolean) | (() => Address) | (() => Contact) | (() => string) | (() => Timestamp)
    active: boolean
    name: string
    address: Address
    pointOfContact: Contact
    createdAt: Timestamp
    modifiedAt: Timestamp

    constructor(args: IStorage) {
        this.active = args.active
        this.name = args.name
        this.address = args.address
        this.pointOfContact = args.pointOfContact
        this.createdAt = args.createdAt
        this.modifiedAt = args.modifiedAt
    }

    getActive(): boolean {
        return this.active
    }

    getName(): string {
        return this.name
    }

    getAddress(): Address {
        return this.address
    }

    getPointOfContact(): Contact {
        return this.pointOfContact
    }

    getCreatedAt(): Timestamp {
        return this.createdAt
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt
    }
}
