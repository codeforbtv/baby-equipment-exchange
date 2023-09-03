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
    criminalJusticeInvolde: boolean
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
    criminalJusticeInvolde: boolean
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
        this.criminalJusticeInvolde = args.criminalJusticeInvolde
        this.adoptionAndFosterFamilies = args.adoptionAndFosterFamilies
        this.refugeeAndImmigration = args.refugeeAndImmigration
        this.substanceAbuseDisorders = args.substanceAbuseDisorders
        this.address = args.address
        this.pointOfContact = args.pointOfContact
        this.notes = args.notes
        this.createdAt = args.createdAt
        this.modifiedAt = args.modifiedAt
    }

    getDiaperBank() {
        return this.diaperBank
    }

    getBabyProductExchange() {
        return this.babyProductExchange
    }

    getLowIncome() {
        return this.lowIncome
    }

    getCriminalJusticeInvolde() {
        return this.criminalJusticeInvolde
    }

    getAdoptionAndFosterFamilies() {
        return this.adoptionAndFosterFamilies
    }

    getRefugeeAndImmigration() {
        return this.refugeeAndImmigration
    }

    getsubstanceAbuseDisorders() {
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
