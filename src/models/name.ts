import { Name } from './name';

interface IUser {
    name: Name;
    gender: string;
    dob: Date;
    pendingDonations: Array<string>;
    photo: string;
    createdAt: Date;
    modifiedAt: Date;
}

export class User implements IUser {
    name: Name;
    gender: string;
    dob: Date;
    pendingDonations: Array<string>;
    photo: string;
    createdAt: Date;
    modifiedAt: Date;

    constructor(name: Name, gender: string, dob: Date, pendingDonations: Array<string>, photo: string, createdAt: Date, modifiedAt: Date) {
        this.name = name;
        this.gender = gender;
        this.dob = dob;
        this.pendingDonations = pendingDonations;
        this.photo = photo;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
    }

    getName(): Name {
        return this.name;
    }

    getGender(): string {
        return this.gender;
    }

    getDob(): Date {
        return this.dob;
    }

    getPendingDonations(): Array<string> {
        return this.pendingDonations;
    }

    getPhoto(): string {
        return this.photo;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getModifiedAt(): Date {
        return this.modifiedAt;
    }
}
