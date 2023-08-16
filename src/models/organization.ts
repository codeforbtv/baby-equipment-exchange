import { Address } from './address';
import { Contact } from './contact';

interface IOrganization {
    diaperBank: boolean;
    babyProductExchange: boolean;
    lowIncome: boolean;
    criminalJusticeInvolde: boolean;
    adoptionAndFosterFamilies: boolean;
    refugeeAndImmigration: boolean;
    substanceAbuseDisorders: boolean;
    address: Address;
    pointOfContact: Contact;
    notes: string;
    createdAt: Date;
    modifiedAt: Date;
}

export class Organization implements IOrganization {
    diaperBank: boolean;
    babyProductExchange: boolean;
    lowIncome: boolean;
    criminalJusticeInvolde: boolean;
    adoptionAndFosterFamilies: boolean;
    refugeeAndImmigration: boolean;
    substanceAbuseDisorders: boolean;
    address: Address;
    pointOfContact: Contact;
    notes: string;
    createdAt: Date;
    modifiedAt: Date;

    constructor(
        diaperBank: boolean,
        babyProductExchange: boolean,
        lowIncome: boolean,
        criminalJusticeInvolde: boolean,
        adoptionAndFosterFamilies: boolean,
        refugeeAndImmigration: boolean,
        substanceAbuseDisorders: boolean,
        address: Address,
        pointOfContact: Contact,
        notes: string,
        createdAt: Date,
        modifiedAt: Date
    ) {
        this.diaperBank = diaperBank;
        this.babyProductExchange = babyProductExchange;
        this.lowIncome = lowIncome;
        this.criminalJusticeInvolde = criminalJusticeInvolde;
        this.adoptionAndFosterFamilies = adoptionAndFosterFamilies;
        this.refugeeAndImmigration = refugeeAndImmigration;
        this.substanceAbuseDisorders = substanceAbuseDisorders;
        this.address = address;
        this.pointOfContact = pointOfContact;
        this.notes = notes;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
    }

    getDiaperBank() {
        return this.diaperBank;
    }

    getBabyProductExchange() {
        return this.babyProductExchange;
    }

    getLowIncome() {
        return this.lowIncome;
    }

    getCriminalJusticeInvolde() {
        return this.criminalJusticeInvolde;
    }

    getAdoptionAndFosterFamilies() {
        return this.adoptionAndFosterFamilies;
    }

    getRefugeeAndImmigration() {
        return this.refugeeAndImmigration;
    }

    getsubstanceAbuseDisorders() {
        return this.substanceAbuseDisorders;
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
