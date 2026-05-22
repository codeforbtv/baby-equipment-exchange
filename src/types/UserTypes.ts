export type NewUserAccountInfo = {
    displayName: string;
    email: string;
    password: string;
    phoneNumber: string;
    organization: { id: string; name: string } | null;
    title: string;
    termsAccepted: string[];
    notes: string[];
};

export type AuthUserMetadata = {
    creationTime?: string;
    lastSignInTime?: string;
    lastRefreshTime?: string;
};

export interface AuthUserRecord {
    readonly uid: string;
    email: string;
    displayName: string;
    disabled: boolean;
    metadata: AuthUserMetadata;
    readonly customClaims?: {
        [key: string]: any;
    };
}

//Type for updating auth user accounts
export type AccountInformation = {
    displayName?: string;
    email?: string;
};
