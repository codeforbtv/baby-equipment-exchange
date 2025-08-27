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
        | boolean
        | { [key: string]: any }
        | (() => string)
        | (() => string[] | null | undefined)
        | (() => DocumentReference | null | undefined)
        | (() => DocumentReference[] | null | undefined)
        | (() => Timestamp | FieldValue)
        | (() => boolean);
    readonly uid: string;
    phoneNumber: string;
    requestedItems: DocumentReference[] | null | undefined;
    notes: string[] | null | undefined;
    organization: string;
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
        | boolean
        | { [key: string]: any }
        | (() => string)
        | (() => string[] | null | undefined)
        | (() => DocumentReference | null | undefined)
        | (() => DocumentReference[] | null | undefined)
        | (() => Timestamp | FieldValue)
        | (() => boolean);
    readonly uid: string;
    phoneNumber: string;
    requestedItems: DocumentReference[] | null | undefined;
    notes: string[] | null | undefined;
    organization: string;
    modifiedAt: Timestamp | FieldValue;

    constructor(args: IUser) {
        this.uid = args.uid;
        this.phoneNumber = args.phoneNumber;
        this.requestedItems = args.requestedItems;
        this.notes = args.notes;
        this.organization = args.organization;
        this.modifiedAt = args.modifiedAt;
    }

    getUid(): string {
        return this.uid;
    }

    getPhoneNumber(): string {
        return this.phoneNumber;
    }

    getRequestedItems(): DocumentReference[] | null | undefined {
        return this.requestedItems;
    }

    getNotes(): string[] | null | undefined {
        return this.notes;
    }

    getOrganization(): string {
        return this.organization;
    }

    getModifiedAt(): Timestamp | FieldValue {
        return this.modifiedAt;
    }
}
