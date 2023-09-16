//Firebase types
import { Timestamp } from 'firebase/firestore'
//Plain JavaScript objects
import { IAddress } from './address'

export interface IUserDetail {
    [key: string]:
        | string
        | number
        | Timestamp
        | IAddress
        | IAddress[]
        | string[]
        | null
        | undefined
        | (() => string)
        | (() => IAddress[])
        | (() => string[])
        | (() => Timestamp)
        | (() => IAddress | null | undefined)
        | (() => number | null | undefined)
        | (() => string | null | undefined)
    user: string
    email: string | null | undefined
    address: IAddress | null | undefined
    phone: string | null | undefined
    website: string | null | undefined
    emails: string[]
    phones: string[]
    addresses: IAddress[]
    websites: string[]
    notes: string
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class UserDetail implements IUserDetail {
    [key: string]:
        | string
        | number
        | Timestamp
        | IAddress
        | IAddress[]
        | string[]
        | null
        | undefined
        | (() => string)
        | (() => IAddress[])
        | (() => string[])
        | (() => Timestamp)
        | (() => IAddress | null | undefined)
        | (() => number | null | undefined)
        | (() => string | null | undefined)
    user: string
    emails: string[]
    phones: string[]
    addresses: IAddress[]
    websites: string[]
    address: IAddress | null | undefined
    email: string | null | undefined
    phone: string | null | undefined
    website: string | null | undefined
    notes: string
    createdAt: Timestamp
    modifiedAt: Timestamp

    constructor(args: IUserDetail) {
        this.user = args.user
        this.emails = args.emails
        this.phones = args.phones
        this.addresses = args.addresses
        this.websites = args.websites
        this.notes = args.notes
        this.createdAt = args.createdAt
        this.modifiedAt = args.modifiedAt
        this.address = args.address
        this.email = args.email
        this.phone = args.phone
        this.website = args.website
    }

    getUser(): string {
        return this.user
    }

    getEmails(): string[] {
        return this.emails
    }

    getPhones(): string[] {
        return this.phones
    }

    getPrimaryAddress(): IAddress | null | undefined {
        return this.address
    }

    getPrimaryEmail(): string | null | undefined {
        return this.email
    }

    getPrimaryPhone(): string | null | undefined {
        return this.phone
    }

    getPrimaryWebsite(): string | null | undefined {
        return this.website
    }

    getAddresses(): IAddress[] {
        return this.addresses
    }

    getWebsites(): string[] {
        return this.websites
    }

    getNotes(): string {
        return this.notes
    }

    getCreatedAt(): Timestamp {
        return this.createdAt
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt
    }
}
