//Firebase types
import { Timestamp } from 'firebase/firestore'
//Plain JavaScript objects
import { Donation } from './donation'

export interface IUser {
    [key: string]:
        | string
        | Donation[]
        | Timestamp
        | null
        | undefined
        | (() => string)
        | (() => Donation[])
        | (() => string | null | undefined)
        | (() => Timestamp)

    name: string
    pendingDonations: Donation[]
    photo: string | null | undefined
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class User implements IUser {
    [key: string]:
        | string
        | Donation[]
        | Timestamp
        | null
        | undefined
        | (() => string)
        | (() => Donation[])
        | (() => string | null | undefined)
        | (() => Timestamp)
    name: string
    pendingDonations: Donation[]
    photo: string | null | undefined
    createdAt: Timestamp
    modifiedAt: Timestamp

    constructor(args: IUser) {
        this.name = args.name
        this.pendingDonations = args.pendingDonations
        this.photo = args.photo
        this.createdAt = args.createdAt
        this.modifiedAt = args.modifiedAt
    }

    getName(): string {
        return this.name
    }

    getPendingDonations(): Donation[] {
        return this.pendingDonations
    }

    getPhoto(): string | null | undefined {
        return this.photo
    }

    getCreatedAt(): Timestamp {
        return this.createdAt
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt
    }
}
