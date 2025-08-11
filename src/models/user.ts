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
        | (() => DocumentReference | null | undefined)
        | (() => DocumentReference[] | null | undefined)
        | (() => Timestamp | FieldValue);
    uid: string;
    requestedItems: DocumentReference[] | null | undefined;
    notes: string[] | null | undefined;
    organization: DocumentReference | null | undefined;
    modifiedAt: Timestamp | FieldValue;
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
        | (() => DocumentReference | null | undefined)
        | (() => DocumentReference[] | null | undefined)
        | (() => Timestamp | FieldValue);
    uid: string;
    requestedItems: DocumentReference[] | null | undefined;
    notes: string[] | null | undefined;
    organization: DocumentReference | null | undefined;
    modifiedAt: Timestamp | FieldValue;

    constructor(args: IUser) {
        this.uid = args.uid;
        this.user = args.user;
        this.requestedItems = args.requestedItems;
        this.notes = args.notes;
        this.organization = args.organization;
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

    getOrganization(): DocumentReference | null | undefined {
        return this.organization;
    }

    getModifiedAt(): Timestamp | FieldValue {
        return this.modifiedAt;
    }
}
