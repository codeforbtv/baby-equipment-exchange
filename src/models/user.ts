// Firebase types
import { DocumentReference, FieldValue, Timestamp } from 'firebase/firestore';

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
        | (() => string)
        | (() => string[] | null | undefined)
        | (() => DocumentReference[] | null | undefined)
        | (() => DocumentReference | null | undefined)
        | (() => FieldValue);
    uid: string;
    requestedItems: DocumentReference[] | null | undefined;
    notes: string[] | null | undefined;
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
        | (() => string)
        | (() => string[] | null | undefined)
        | (() => DocumentReference[] | null | undefined)
        | (() => DocumentReference | null | undefined)
        | (() => FieldValue);
    uid: string;
    requestedItems: DocumentReference[] | null | undefined;
    notes: string[] | null | undefined;
    modifiedAt: Timestamp;

    constructor(args: IUser) {
        this.uid = args.uid;
        this.user = args.user;
        this.requestedItems = args.requestedItems;
        this.notes = args.notes;
        this.modifiedAt = args.modifiedAt;
    }

    getUid(): string {
        return this.uid;
    }

    getRequestedItems(): DocumentReference[] | null | undefined {
        return this.requestedItems;
    }

    getNotes(): string[] | null | undefined {
        return this.notes;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
