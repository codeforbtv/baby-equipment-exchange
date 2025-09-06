import { UserMetadata } from 'firebase-admin/auth';
import { IUser } from '@/models/user';

export type newUserAccountInfo = {
    displayName: string;
    email: string;
    password: string;
    phoneNumber: string;
    organization: { id: string; name: string } | null;
    notes: string[];
};

export interface AuthUserRecord {
    readonly uid: string;
    email: string;
    displayName: string;
    disabled: boolean;
    metadata: UserMetadata;
    readonly customClaims?: {
        [key: string]: any;
    };
}

export interface UserDetails extends AuthUserRecord, IUser {}

//Type for updating auth user accounts
export type AccountInformation = {
    displayName?: string;
    email?: string;
};
