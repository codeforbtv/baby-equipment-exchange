//Firebase types
import { Timestamp } from 'firebase/firestore'
//Plain JavaScript objects
import { Address } from './address'
import { Contact } from './contact'

export interface IOrganization {
    [key: string]: boolean | string | Address | Contact | Timestamp | (() => boolean) | (() => Address) | (() => Contact) | (() => string) | (() => Timestamp)
    diaperBank: boolean
    babyProductExchange: boolean
    lowIncome: boolean
    criminalJusticeInvolved: boolean
    adoptionAndFosterFamilies: boolean
    refugeeAndImmigration: boolean
    substanceAbuseDisorders: boolean
    address: Address
    pointOfContact: Contact
    notes: string
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class Organization implements IOrganization {
    [key: string]: boolean | string | Address | Contact | Timestamp | (() => boolean) | (() => Address) | (() => Contact) | (() => string) | (() => Timestamp)
    diaperBank: boolean
    babyProductExchange: boolean
    lowIncome: boolean
    criminalJusticeInvolved: boolean
    adoptionAndFosterFamilies: boolean
    refugeeAndImmigration: boolean
    substanceAbuseDisorders: boolean
    address: Address
    pointOfContact: Contact
    notes: string
    createdAt: Timestamp
    modifiedAt: Timestamp

    constructor(args: IOrganization) {
        this.diaperBank = args.diaperBank
        this.babyProductExchange = args.babyProductExchange
        this.lowIncome = args.lowIncome
        this.criminalJusticeInvolved = args.criminalJusticeInvolved
        this.adoptionAndFosterFamilies = args.adoptionAndFosterFamilies
        this.refugeeAndImmigration = args.refugeeAndImmigration
        this.substanceAbuseDisorders = args.substanceAbuseDisorders
        this.address = args.address
        this.pointOfContact = args.pointOfContact
        this.notes = args.notes
        this.createdAt = args.createdAt
        this.modifiedAt = args.modifiedAt
    }

    isDiaperBank() {
        return this.diaperBank
    }

    isBabyProductExchange() {
        return this.babyProductExchange
    }

    isLowIncome() {
        return this.lowIncome
    }

    isCriminalJusticeInvolved() {
        return this.criminalJusticeInvolved
    }

    isAdoptionAndFosterFamilies() {
        return this.adoptionAndFosterFamilies
    }

    isRefugeeAndImmigration() {
        return this.refugeeAndImmigration
    }

    isSubstanceAbuseDisorders() {
        return this.substanceAbuseDisorders
    }

    getAddress() {
        return this.address
    }

    getPointOfContact() {
        return this.pointOfContact
    }

    getNotes() {
        return this.notes
    }

    getCreatedAt() {
        return this.createdAt
    }

    getModifiedAt() {
        return this.modifiedAt
    }
}
