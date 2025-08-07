// Firebase types
import { DocumentReference, FieldValue, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface IUser {
    [key: string]:
        | string
        | string[]
        | DocumentReference
        | DocumentReference[]
        | FieldValue
        | Timestamp
        | null
        | undefined
        | User
        | (() => string)
        | (() => string[])
        | (() => DocumentReference[])
        | (() => DocumentReference | null | undefined)
        | (() => FieldValue)
        | (() => User);

    user: User;
    requestedItems: DocumentReference[];
    notes: string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class UserCollection implements IUser {
    [key: string]:
        | string
        | string[]
        | DocumentReference
        | DocumentReference[]
        | FieldValue
        | Timestamp
        | null
        | undefined
        | User
        | (() => string)
        | (() => string[])
        | (() => DocumentReference[])
        | (() => DocumentReference | null | undefined)
        | (() => FieldValue)
        | (() => User);
    user: User;
    requestedItems: DocumentReference[];
    notes: string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IUser) {
        this.user = args.user;
        this.requestedItems = args.requestedItems;
        this.notes = args.notes;
        this.createdAt = args.createdAt;
        this.modifiedAt = args.modifiedAt;
    }

    getUser(): User {
        return this.user;
    }

    getRequestedItems(): DocumentReference[] {
        return this.requestedItems;
    }

    getNotes(): string[] {
        return this.notes;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
