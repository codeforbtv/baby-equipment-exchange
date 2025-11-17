// Firebase types
import { DocumentReference, FieldValue, Timestamp } from 'firebase/firestore';
import { Donation } from './donation';

export interface IUser {
    [key: string]:
        | string
        | { id: string; name: string }[]
        | FieldValue
        | Timestamp
        | null
        | undefined
        | boolean
        | undefined
        | { [key: string]: any }
        | (() => string)
        | (() => { id: string; name: string }[] | null | undefined)
        | (() => DocumentReference | null | undefined)
        | (() => DocumentReference[] | null | undefined)
        | (() => Timestamp | FieldValue)
        | (() => boolean | undefined);
    readonly uid: string;
    email: string;
    displayName: string;
    customClaims?: { [key: string]: any };
    isDisabled?: boolean;
    phoneNumber: string;
    requestedItems: { id: string; model: string }[] | null | undefined;
    distributedItems: Donation[] | null;
    notes: string[] | null | undefined;
    organization: { id: string; name: string } | null;
    modifiedAt: Timestamp | FieldValue;
}

export class UserCollection implements IUser {
    [key: string]:
        | string
        | { id: string; name: string }[]
        | DocumentReference
        | DocumentReference[]
        | FieldValue
        | Timestamp
        | null
        | undefined
        | boolean
        | undefined
        | { [key: string]: any }
        | (() => string)
        | (() => { id: string; model: string }[] | null | undefined)
        | (() => Timestamp | FieldValue)
        | (() => boolean | undefined);
    readonly uid: string;
    email: string;
    displayName: string;
    customClaims?: { [key: string]: any };
    isDisabled?: boolean;
    phoneNumber: string;
    requestedItems: { id: string; model: string }[] | null | undefined;
    distributedItems: Donation[] | null;
    notes: string[] | null | undefined;
    organization: { id: string; name: string } | null;
    modifiedAt: Timestamp | FieldValue;

    constructor(args: IUser) {
        this.uid = args.uid;
        this.email = args.email;
        this.displayName = args.displayName;
        this.customClaims = args.customClaims;
        this.isDisabled = args.isDisabled;
        this.phoneNumber = args.phoneNumber;
        this.requestedItems = args.requestedItems;
        this.distributedItems = args.distributedItems;
        this.notes = args.notes;
        this.organization = args.organization;
        this.modifiedAt = args.modifiedAt;
    }

    getUid(): string {
        return this.uid;
    }

    getEmail(): string {
        return this.email;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getCustomClaims(): { [key: string]: any } | undefined {
        return this.customClaims;
    }

    getIsDisabled(): boolean | undefined {
        return this.isDisabled;
    }

    getPhoneNumber(): string {
        return this.phoneNumber;
    }

    getRequestedItems(): { id: string; model: string }[] | null | undefined {
        return this.requestedItems;
    }

    getDistributedItems(): Donation[] | null {
        return this.distributedItems;
    }

    getNotes(): string[] | null | undefined {
        return this.notes;
    }

    getOrganization(): { id: string; name: string } | null {
        return this.organization;
    }

    getModifiedAt(): Timestamp | FieldValue {
        return this.modifiedAt;
    }
}
