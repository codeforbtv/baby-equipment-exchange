//Firebase types
import { Timestamp } from 'firebase/firestore';
//Plain JavaScript objects
import { IAddress } from '@/models/address';

export const orgTags = {
    'social-services': 'Social Services',
    'mutual-aid': 'Mutual Aid',
    'sustainabilty-reuse': 'Sustainabilty Reuse',
    'pediatric-maternal-health': 'Pediatric/Maternal Health',
    'homelessness-unhoused': 'Homelessness/Unhoused',
    'early-childhood-education': 'Early Childhood Education'
};

type organizationTags = typeof orgTags;

export type OrganizationTagTypes = keyof organizationTags;

export interface IOrganization {
    [key: string]:
        | string
        | string[]
        | IAddress
        | undefined
        | Timestamp
        | (() => OrganizationTagTypes[])
        | (() => string[])
        | (() => IAddress | undefined)
        | (() => string | undefined)
        | (() => Timestamp);
    name: string;
    address?: IAddress;
    phoneNumber?: string;
    tags: OrganizationTagTypes[];
    notes: string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class Organization implements IOrganization {
    [key: string]:
        | string
        | string[]
        | IAddress
        | undefined
        | Timestamp
        | (() => OrganizationTagTypes[])
        | (() => IAddress | undefined)
        | (() => string[])
        | (() => string | undefined)
        | (() => Timestamp);
    name: string;
    address?: IAddress;
    phoneNumber?: string;
    tags: OrganizationTagTypes[];
    notes: string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IOrganization) {
        this.name = args.name;
        this.address = args.address;
        this.phoneNumber = args.phoneNumber;
        this.tags = args.tags;
        this.notes = args.notes;
        this.createdAt = args.createdAt as Timestamp;
        this.modifiedAt = args.modifiedAt as Timestamp;
    }

    getName() {
        return this.name;
    }

    getAddress() {
        return this.address;
    }

    getPhoneNumber() {
        return this.phoneNumber;
    }

    getTags() {
        return this.tags;
    }

    getNotes() {
        return this.notes;
    }

    getCreatedAt() {
        return this.createdAt;
    }

    getModifiedAt() {
        return this.modifiedAt;
    }
}
