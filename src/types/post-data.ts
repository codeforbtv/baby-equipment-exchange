import { IAddress } from '@/models/address';
import { IContact } from '@/models/contact';
import { DocumentReference } from 'firebase/firestore';
import { UserMetadata, UserRecord } from 'firebase-admin/auth';

export type UserCardProps = {
    readonly uid: string;
    readonly email?: string;
    emailVerified: boolean;
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
    disabled: boolean;
    metadata: UserMetadata;
    readonly customClaims?: {
        [key: string]: any;
    };
};

export type AccountInformation = {
    displayName?: string;
    email?: string;
    phoneNunber?: string;
};
export type DonationBody = {
    donorEmail: string;
    donorName: string;
    donorId: string;
    category: string;
    brand: string;
    model: string;
    description: string;
    images: string[];
};

export type UserBody = {
    user: string | undefined | null; // The Firebase auth id of the new user.
    name: string | undefined | null;
    email: string | undefined | null;
    photo: DocumentReference | string | undefined | null; // The Images document id of the user's profile photo.
};

export type OrganizationBody = {
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
};

export type StorageBody = {
    active: boolean;
    name: string;
    address: IAddress;
    pointOfContact: IContact;
};

export type NoteBody = {
    text: string;
    destinationId: string;
    destinationCollection: string;
};
