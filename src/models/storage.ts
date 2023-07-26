import { Address } from './address'
import { Contact } from './contact'
import { Name } from './name'

interface IStorage {
    active: boolean
    name: Name
    address: Address
    pointOfContact: Contact
    createdAt: Date
    modifiedAt: Date
}

export class Storage implements IStorage {
    active: boolean
    name: Name
    address: Address
    pointOfContact: Contact
    createdAt: Date
    modifiedAt: Date

    constructor(active: boolean, name: Name, address: Address, pointOfContact: Contact, createdAt: Date, modifiedAt: Date) {
        this.active = active
        this.name = name
        this.address = address
        this.pointOfContact = pointOfContact
        this.createdAt = createdAt
        this.modifiedAt = modifiedAt
    }

    getActive(): boolean {
        return this.active
    }

    getName(): Name {
        return this.name
    }

    getAddress(): Address {
        return this.address
    }

    getPointOfContact(): Contact {
        return this.pointOfContact
    }

    getCreatedAt(): Date {
        return this.createdAt
    }

    getModifiedAt(): Date {
        return this.modifiedAt
    }
}
