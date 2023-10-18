import { IAddress } from '@/models/address'
import { IContact } from '@/models/contact'

export type AccountInformation = {
    name: string
    contact: IContact | null | undefined
    location: IAddress | null | undefined
    photo: string | null | undefined
}

export type DonationForm = {
    user: string
    category: string
    brand: string
    model: string
    description: string
    images: string[]
}

export type NewUser = {
    user: string | undefined | null // The Firebase auth id of the new user.
    name: string | undefined | null
    email: string | undefined | null
    photo: string | undefined | null // The Images document id of the user's profile photo.
}

export type OrganizationForm = {
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

export type StorageForm = {
    active: boolean,
    name: string,
    address: IAddress,
    pointOfContact: IContact
}

export type Note = {
    text: string,
    destinationId: string,
    destinationCollection: string
}