import { IAddress } from '@/models/address';
import { OrganizationTagTypes } from '@/models/organization';

export type OrganizationBody = {
    name: string;
    address?: IAddress;
    phoneNumber?: string;
    tags: OrganizationTagTypes[];
    notes: string[];
};
