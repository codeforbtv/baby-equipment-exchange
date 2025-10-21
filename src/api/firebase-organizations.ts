// Modules
import {
    DocumentData,
    collection,
    getDocs,
    query,
    QueryDocumentSnapshot,
    SnapshotOptions,
    doc,
    setDoc,
    serverTimestamp,
    Timestamp,
    getDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    deleteField
} from 'firebase/firestore';

// Models
import { IOrganization, Organization } from '@/models/organization';
import { OrganizationBody } from '@/types/OrganizationTypes';
// Libs
import { addErrorEvent, db } from './firebase';
//Constants
export const ORGANIZATIONS_COLLECTION = 'Organizations';

export const organizationConverter = {
    toFirestore(organization: Organization): DocumentData {
        const organizationData: IOrganization = {
            id: organization.getId(),
            name: organization.getName(),
            address: organization.getAddress(),
            county: organization.getCounty(),
            phoneNumber: organization.getPhoneNumber(),
            emailFooter: organization.getEmailFooter(),
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
            id: data.id,
            name: data.name,
            address: data.address,
            county: data.county,
            phoneNumber: data.phoneNumber,
            emailFooter: data.emailFooter,
            tags: data.tags,
            notes: data.notes,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        };
        return new Organization(organizationData);
    }
};

export async function addOrganization(newOrganization: OrganizationBody): Promise<void> {
    const organizationRef = doc(collection(db, ORGANIZATIONS_COLLECTION));
    const organizationParams: IOrganization = {
        id: organizationRef.id,
        name: newOrganization.name,
        address: newOrganization.address,
        county: newOrganization.county,
        phoneNumber: newOrganization.phoneNumber,
        emailFooter: newOrganization.emailFooter,
        tags: newOrganization.tags,
        notes: newOrganization.notes,
        createdAt: serverTimestamp() as Timestamp,
        modifiedAt: serverTimestamp() as Timestamp
    };
    const organization = new Organization(organizationParams);
    try {
        await setDoc(organizationRef, organizationConverter.toFirestore(organization));
    } catch (error) {
        addErrorEvent('Add organization', error);
    }
}

export async function updateOrganization(id: string, organizationDetails: any): Promise<void> {
    try {
        const organizationRef = doc(db, ORGANIZATIONS_COLLECTION, id).withConverter(organizationConverter);
        await updateDoc(organizationRef, {
            ...organizationDetails,
            modifiedAt: serverTimestamp()
        });
    } catch (error) {
        addErrorEvent('Error updating organization', error);
    }
}

export async function deleteOrganization(id: string): Promise<void> {
    try {
        const docRef = doc(db, ORGANIZATIONS_COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        addErrorEvent('Error deleting organization', error);
    }
}

export async function getOrganizations(): Promise<Organization[]> {
    const q = query(collection(db, ORGANIZATIONS_COLLECTION)).withConverter(organizationConverter);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
}

export async function checkIfOrganizationExists(name: string): Promise<boolean> {
    try {
        const orgRef = doc(db, ORGANIZATIONS_COLLECTION, name);
        const orgSnapshot = await getDoc(orgRef);
        return orgSnapshot.exists();
    } catch (error) {
        addErrorEvent('Error checking if organization exists', error);
    }
    return Promise.reject();
}

export async function getOrganizationById(id: string): Promise<IOrganization> {
    try {
        const organizationRef = doc(db, ORGANIZATIONS_COLLECTION, id).withConverter(organizationConverter);
        const organizationSnapshot = await getDoc(organizationRef);
        if (organizationSnapshot.exists()) {
            return organizationSnapshot.data();
        } else {
            return Promise.reject(new Error('Organization not found'));
        }
    } catch (error) {
        addErrorEvent('Get organization by id', error);
    }
    return Promise.reject();
}

export async function setOrgIds(): Promise<void> {
    try {
        const orgsSnapShot = await getDocs(collection(db, ORGANIZATIONS_COLLECTION));
        const batch = writeBatch(db);
        orgsSnapShot.forEach((doc) => {
            batch.update(doc.ref, {
                id: doc.id
            });
        });
        await batch.commit();
    } catch (error) {
        addErrorEvent('Error adding ID to orgs', error);
    }
}

export async function removeUnusedOrgFields(): Promise<void> {
    try {
        const orgsSnapShot = await getDocs(collection(db, ORGANIZATIONS_COLLECTION));
        const batch = writeBatch(db);
        orgsSnapShot.forEach((doc) => {
            if (doc.data()['County'] !== undefined) {
                batch.update(doc.ref, {
                    ['County']: deleteField()
                });
            }
            if (doc.data()['Email Footer'] !== undefined) {
                batch.update(doc.ref, {
                    ['Email Footer']: deleteField()
                });
            }
            if (doc.data()['Organization'] !== undefined) {
                batch.update(doc.ref, {
                    ['Organization']: deleteField()
                });
            }
            if (doc.data()['Town'] !== undefined) {
                batch.update(doc.ref, {
                    address: { ...doc.data()['address'], town: doc.data()['Town'] }
                });
                batch.update(doc.ref, {
                    ['Town']: deleteField()
                });
            }
        });
        await batch.commit();
    } catch (error) {
        addErrorEvent('Error cleaning up orgs', error);
    }
}
