import { IAddress } from '@/models/address'
import { IContact } from '@/models/contact'
import { DocumentReference } from 'firebase/firestore'

export type AccountInformation = {
    name: string
    contact: IContact | null | undefined
    location: IAddress | null | undefined
    photo: string | null | undefined
}

export type DonationBody = {
    user: DocumentReference
    category: string
    brand: string
    model: string
    description: string
    images: DocumentReference[]
}

export type UserBody = {
    user: DocumentReference | undefined | null // The Firebase auth id of the new user.
    name: string | undefined | null
    email: string | undefined | null
    photo: string | undefined | null // The Images document id of the user's profile photo.
}

export type OrganizationBody = {
    name: string,
    diaperBank: boolean,
    babyProductExchange: boolean
    lowIncome: boolean,
    criminalJusticeInvolved: boolean,
    adoptionAndFosterFamilies: boolean,
    refugeeAndImmigration: boolean,
    substanceAbuseDisorders: boolean,
    address: IAddress,
    pointOfContact: IContact,
    notes: string,
}

export type StorageBody = {
    active: boolean,
    name: string,
    address: IAddress,
    pointOfContact: IContact
}

export type NoteBody = {
    text: string,
    destinationId: string,
    destinationCollection: string
}