import { UserMetadata } from 'firebase-admin/auth';

export type newUserAccountInfo = {
    displayName: string;
    email: string;
    password: string;
    phoneNumber: string;
    organization: string;
};

export type AuthUserRecord = {
    readonly uid: string;
    readonly email?: string;
    displayName?: string;
    disabled: boolean;
    metadata: UserMetadata;
    readonly customClaims?: {
        [key: string]: any;
    };
};
