import { Contact } from './contact'
import { Donation } from './donation'
import { Name } from './name'

interface IUser {
    type: string
    name: Name
    gender: string
    dob: Date
    pendingDonations: Array<Donation>
    photo: string
    createdAt: Date
    modifiedAt: Date
}

export class User implements IUser {
    type: string
    name: Name
    gender: string
    dob: Date
    pendingDonations: Donation[]
    photo: string
    createdAt: Date
    modifiedAt: Date

    constructor(type: string, name: Name, gender: string, dob: Date, pendingDonations: Donation[], photo: string, createdAt: Date, modifiedAt: Date) {
        this.type = type
        this.name = name
        this.gender = gender
        this.dob = dob
        this.pendingDonations = pendingDonations
        this.photo = photo
        this.createdAt = createdAt
        this.modifiedAt = modifiedAt
    }

    getType(): string {
        return this.type
    }

    getName(): Name {
        return this.name
    }

    getGender(): string {
        return this.gender
    }

    getDob(): Date {
        return this.dob
    }

    getPendingDonations(): Array<Donation> {
        return this.pendingDonations
    }

    getPhoto(): string {
        return this.photo
    }

    getCreatedAt(): Date {
        return this.createdAt
    }

    getModifiedAt(): Date {
        return this.modifiedAt
    }
}
