//Firebase types
import { Timestamp } from 'firebase/firestore';
//Plain JavaScript objects
import { IAddress } from '@/models/address';
import { IContact } from '@/models/contact';

export interface IOrganization {
    [key: string]:
        | boolean
        | string
        | IAddress
        | IContact
        | Timestamp
        | (() => boolean)
        | (() => IAddress)
        | (() => IContact)
        | (() => string)
        | (() => Timestamp);
    name: string;
    diaperBank: boolean;
    babyProductExchange: boolean;
    lowIncome: boolean;
    criminalJusticeInvolved: boolean;
    adoptionAndFosterFamilies: boolean;
    refugeeAndImmigration: boolean;
    substanceAbuseDisorders: boolean;
    address: IAddress;
    pointOfContact: IContact;
    notes: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class Organization implements IOrganization {
    [key: string]:
        | boolean
        | string
        | IAddress
        | IContact
        | Timestamp
        | (() => boolean)
        | (() => IAddress)
        | (() => IContact)
        | (() => string)
        | (() => Timestamp);
    name: string;
    diaperBank: boolean;
    babyProductExchange: boolean;
    lowIncome: boolean;
    criminalJusticeInvolved: boolean;
    adoptionAndFosterFamilies: boolean;
    refugeeAndImmigration: boolean;
    substanceAbuseDisorders: boolean;
    address: IAddress;
    pointOfContact: IContact;
    notes: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IOrganization) {
        this.name = args.name;
        this.diaperBank = args.diaperBank;
        this.babyProductExchange = args.babyProductExchange;
        this.lowIncome = args.lowIncome;
        this.criminalJusticeInvolved = args.criminalJusticeInvolved;
        this.adoptionAndFosterFamilies = args.adoptionAndFosterFamilies;
        this.refugeeAndImmigration = args.refugeeAndImmigration;
        this.substanceAbuseDisorders = args.substanceAbuseDisorders;
        this.address = args.address;
        this.pointOfContact = args.pointOfContact;
        this.notes = args.notes;
        this.createdAt = args.createdAt as Timestamp;
        this.modifiedAt = args.modifiedAt as Timestamp;
    }

    isDiaperBank() {
        return this.diaperBank;
    }

    isBabyProductExchange() {
        return this.babyProductExchange;
    }

    isLowIncome() {
        return this.lowIncome;
    }

    isCriminalJusticeInvolved() {
        return this.criminalJusticeInvolved;
    }

    isAdoptionAndFosterFamilies() {
        return this.adoptionAndFosterFamilies;
    }

    isRefugeeAndImmigration() {
        return this.refugeeAndImmigration;
    }

    isSubstanceAbuseDisorders() {
        return this.substanceAbuseDisorders;
    }

    getName() {
        return this.name;
    }

    getAddress() {
        return this.address;
    }

    getPointOfContact() {
        return this.pointOfContact;
    }

    getNotes() {
        return this.notes;
    }

    getCreatedAt() {
        return this.createdAt;
    }

    getModifiedAt() {
        return this.modifiedAt;
    }
}
