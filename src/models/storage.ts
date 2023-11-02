//Firebase types
import { Timestamp, serverTimestamp } from 'firebase/firestore'
//Plain JavaScript objects
import { IAddress } from './address'
import { IContact } from './contact'
import { StorageForm } from '@/types/post-data'

export interface IStorage {
    [key: string]: boolean | string | IAddress | IContact | Timestamp | (() => boolean) | (() => IAddress) | (() => IContact) | (() => string) | (() => Timestamp)
    active: boolean
    name: string
    address: IAddress
    pointOfContact: IContact
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class Storage implements IStorage {
    [key: string]: boolean | string | IAddress | IContact | Timestamp | (() => boolean) | (() => IAddress) | (() => IContact) | (() => string) | (() => Timestamp)
    active: boolean
    name: string
    address: IAddress
    pointOfContact: IContact
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

    getAddress(): IAddress {
        return this.address
    }

    getPointOfContact(): IContact {
        return this.pointOfContact
    }

    getCreatedAt(): Timestamp {
        return this.createdAt
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt
    }
}