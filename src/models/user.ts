// Firebase types
import { DocumentReference, FieldValue, Timestamp } from 'firebase/firestore';

export interface IUser {
    [key: string]:
        | string
        | DocumentReference
        | DocumentReference[]
        | FieldValue
        | Timestamp
        | null
        | undefined
        | (() => string)
        | (() => DocumentReference[])
        | (() => DocumentReference | null | undefined)
        | (() => FieldValue);

    name: string;
    pendingDonations: DocumentReference[];
    photo: DocumentReference | null | undefined;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class User implements IUser {
    [key: string]:
        | string
        | DocumentReference
        | DocumentReference[]
        | Timestamp
        | null
        | undefined
        | (() => string)
        | (() => DocumentReference[])
        | (() => DocumentReference | null | undefined)
        | (() => Timestamp);
    name: string;
    pendingDonations: DocumentReference[];
    photo: DocumentReference | null | undefined;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IUser) {
        this.name = args.name;
        this.pendingDonations = args.pendingDonations;
        this.photo = args.photo;
        this.createdAt = args.createdAt;
        this.modifiedAt = args.modifiedAt;
    }

    getName(): string {
        return this.name;
    }

    getPendingDonations(): DocumentReference[] {
        return this.pendingDonations;
    }

    getPhoto(): DocumentReference | null | undefined {
        return this.photo;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
