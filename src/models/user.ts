//Firebase types
import { Timestamp } from 'firebase/firestore'
//Plain JavaScript objects
import { Donation } from './donation'

export interface IUser {
    name: string
    gender: string
    dob: number
    pendingDonations: Donation[]
    photo: string
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class User implements IUser {
    name: string
    gender: string
    dob: number
    pendingDonations: Donation[]
    photo: string
    createdAt: Timestamp
    modifiedAt: Timestamp

    constructor(args: IUser) {
        this.name = args.name
        this.gender = args.gender
        this.dob = args.dob
        this.pendingDonations = args.pendingDonations
        this.photo = args.photo
        this.createdAt = args.createdAt
        this.modifiedAt = args.modifiedAt
    }

    getName(): string {
        return this.name
    }

    getGender(): string {
        return this.gender
    }

    getDob(): number {
        return this.dob
    }

    getPendingDonations(): Donation[] {
        return this.pendingDonations
    }

    getPhoto(): string {
        return this.photo
    }

    getCreatedAt(): Timestamp {
        return this.createdAt
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt
    }
}
