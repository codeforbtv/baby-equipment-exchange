// Modules
import { DocumentData, collection, getDocs, query, QueryDocumentSnapshot, SnapshotOptions, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
// Models
import { IOrganization, Organization } from '@/models/organization';
import { OrganizationBody } from '@/types/OrganizationTypes';
// Libs
import { addErrorEvent, db } from './firebase';

export const ORGANIZATIONS_COLLECTION = 'Organizations';

export const organizationConverter = {
    toFirestore(organization: Organization): DocumentData {
        const organizationData: IOrganization = {
            name: organization.getName(),
            address: organization.getAddress(),
            phoneNumber: organization.getPhoneNumber(),
            tags: organization.getTags(),
            notes: organization.getNotes(),
            createdAt: organization.getCreatedAt(),
            modifiedAt: organization.getModifiedAt()
        };
        for (const key in organizationData) {
            if (organizationData[key] === undefined || organizationData[key] === null) {
                delete organizationData[key];
            }
        }
        return organizationData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Organization {
        const data = snapshot.data(options);
        const organizationData: IOrganization = {
            name: data.name,
            address: data.address,
            phoneNumber: data.phoneNumber,
            tags: data.tags,
            notes: data.notes,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        };
        return new Organization(organizationData);
    }
};

export async function addOrganization(newOrganization: OrganizationBody): Promise<void> {
    const organizationParams: IOrganization = {
        name: newOrganization.name,
        address: newOrganization.address,
        phoneNumber: newOrganization.phoneNumber,
        tags: newOrganization.tags,
        notes: newOrganization.notes,
        createdAt: serverTimestamp() as Timestamp,
        modifiedAt: serverTimestamp() as Timestamp
    };
    const organization = new Organization(organizationParams);
    try {
        const organizationRef = doc(db, ORGANIZATIONS_COLLECTION);
        await setDoc(organizationRef, organization);
    } catch (error) {
        addErrorEvent('Add organization', error);
    }
}

export async function getOrganizations(): Promise<Organization[]> {
    const q = query(collection(db, ORGANIZATIONS_COLLECTION)).withConverter(organizationConverter);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
}
