//Firebase types
import { Timestamp } from 'firebase/firestore';
//Plain JavaScript objects
import { Donation } from './donation';
import { Name } from './name';

interface IUser {
    name: Name;
    gender: string;
    dob: Date;
    pendingDonations: Array<Donation>;
    photo: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class User implements IUser {
    name: Name;
    gender: string;
    dob: Date;
    pendingDonations: Donation[];
    photo: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(name: Name, gender: string, dob: Date, pendingDonations: Donation[], photo: string, createdAt: Timestamp, modifiedAt: Timestamp) {
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

    getPendingDonations(): Array<Donation> {
        return this.pendingDonations;
    }

    getPhoto(): string {
        return this.photo;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
