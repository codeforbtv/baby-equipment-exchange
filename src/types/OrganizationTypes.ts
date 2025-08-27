import { IAddress } from '@/models/address';
import { OrganizationTagValues } from '@/models/organization';

export type OrganizationBody = {
    name: string;
    address?: IAddress;
    phoneNumber?: string;
    tags: OrganizationTagValues[];
    notes: string[];
};
