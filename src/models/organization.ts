//Firebase types
import { Timestamp } from 'firebase/firestore';
//Plain JavaScript objects
import { IAddress } from '@/models/address';
import { Donation } from './donation';

export const orgTags = {
    'Social Services': 'social-services',
    'Mutual Aid': 'mutual-aid',
    'Sustainabilty Reuse': 'sustainabilty-reuse',
    'Pediatric/Maternal Health': 'pediatric-maternal-health',
    'Homelessness/Unhoused': 'homelessness-unhoused',
    'Early Childhood Education': 'early-childhood-education'
};

export type organizationTags = typeof orgTags;
export type OrganizationTagKeys = keyof organizationTags;
export type OrganizationTagValues = organizationTags[keyof organizationTags];

export interface IOrganization {
    [key: string]:
        | string
        | string[]
        | IAddress
        | undefined
        | Timestamp
        | Donation[]
        | null
        | (() => OrganizationTagValues[])
        | (() => string[])
        | (() => IAddress | undefined)
        | (() => string | undefined)
        | (() => Donation[] | null)
        | (() => Timestamp);
    id: string;
    name: string;
    address?: IAddress;
    county?: string;
    phoneNumber?: string;
    emailFooter?: string;
    tags: OrganizationTagValues[];
    distributedItems: Donation[] | null;
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
        | Donation[]
        | null
        | (() => OrganizationTagValues[])
        | (() => IAddress | undefined)
        | (() => string[])
        | (() => string | undefined)
        | (() => Donation[] | null)
        | (() => Timestamp);
    id: string;
    name: string;
    address?: IAddress;
    county?: string;
    phoneNumber?: string;
    emailFooter?: string;
    tags: OrganizationTagValues[];
    distributedItems: Donation[] | null;
    notes: string[];
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IOrganization) {
        this.id = args.id;
        this.name = args.name;
        this.address = args.address;
        this.county = args.county;
        this.phoneNumber = args.phoneNumber;
        this.emailFooter = args.emailFooter;
        this.tags = args.tags;
        this.distributedItems = args.distributedItems;
        this.notes = args.notes;
        this.createdAt = args.createdAt as Timestamp;
        this.modifiedAt = args.modifiedAt as Timestamp;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getAddress() {
        return this.address;
    }

    getCounty() {
        return this.county;
    }

    getPhoneNumber() {
        return this.phoneNumber;
    }

    getEmailFooter() {
        return this.emailFooter;
    }

    getTags() {
        return this.tags;
    }

    getDistributedItems(): Donation[] | null {
        return this.distributedItems;
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
