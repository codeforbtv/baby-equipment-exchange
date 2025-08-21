import { UserMetadata } from 'firebase-admin/auth';
import { IUser } from '@/models/user';

export type newUserAccountInfo = {
    displayName: string;
    email: string;
    password: string;
    phoneNumber: string;
    organization: string;
};

export interface AuthUserRecord {
    readonly uid: string;
    readonly email?: string;
    displayName?: string;
    disabled: boolean;
    metadata: UserMetadata;
    readonly customClaims?: {
        [key: string]: any;
    };
}

export interface UserDetails extends AuthUserRecord, IUser {}
