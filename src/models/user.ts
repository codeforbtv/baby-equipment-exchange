//Firebase types
import { FieldValue, Timestamp } from 'firebase/firestore'
//Plain JavaScript objects
import { IDonation } from './donation'

export interface IUser {
    [key: string]:
        | string
        | IDonation[]
        | FieldValue
        | Timestamp
        | null
        | undefined
        | (() => string)
        | (() => IDonation[])
        | (() => string | null | undefined)
        | (() => FieldValue)

    name: string
    pendingDonations: IDonation[]
    photo: string | null | undefined
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class User implements IUser {
    [key: string]:
        | string
        | IDonation[]
        | Timestamp
        | null
        | undefined
        | (() => string)
        | (() => IDonation[])
        | (() => string | null | undefined)
        | (() => Timestamp)
    name: string
    pendingDonations: IDonation[]
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

    getPendingDonations(): IDonation[] {
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
