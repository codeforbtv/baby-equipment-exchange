//Modules
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
    Timestamp
} from 'firebase/firestore'
//Models
import { IOrganization, Organization } from '@/models/organization'
import { OrganizationBody } from '@/types/post-data'
//Libs
import { db } from './firebase'

const ORGANIZATIONS_COLLECTION = 'Organizations'

const organizationConverter = {
    toFirestore(organization: Organization): DocumentData {
        const organizationData: IOrganization = {
            name : organization.getName(),
            diaperBank: organization.isDiaperBank(),
            babyProductExchange: organization.isBabyProductExchange(),
            lowIncome: organization.isLowIncome(),
            criminalJusticeInvolved: organization.isCriminalJusticeInvolved(),
            adoptionAndFosterFamilies: organization.isAdoptionAndFosterFamilies(),
            refugeeAndImmigration: organization.isRefugeeAndImmigration(),
            substanceAbuseDisorders: organization.isSubstanceAbuseDisorders(),
            address: organization.getAddress(),
            pointOfContact: organization.getPointOfContact(),
            notes: organization.getNotes(),
            createdAt: organization.getCreatedAt(),
            modifiedAt: organization.getModifiedAt()
        }
        for (const key in organizationData) {
            if (organizationData[key] === undefined || organizationData[key] === null) {
                delete organizationData[key]
            } 
        }
        return organizationData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Organization {
        const data = snapshot.data(options)
        const organizationData: IOrganization = {
            name: data.name,
            diaperBank: data.diaperBank,
            babyProductExchange: data.babyProductExchange,
            lowIncome: data.lowIncome,
            criminalJusticeInvolved: data.criminalJusticeInvolved,
            adoptionAndFosterFamilies: data.adoptionAndFosterFamilies,
            refugeeAndImmigration: data.refugeeAndImmigration,
            substanceAbuseDisorders: data.substanceAbuseDisorders,
            address: data.address,
            pointOfContact: data.pointOfContact,
            notes: data.notes,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        }
        return new Organization(organizationData)
    }
}

export async function addOrganization(newOrganization: OrganizationBody) {
    const organizationParams: IOrganization = {
        name: newOrganization.name,
        diaperBank: newOrganization.diaperBank,
        babyProductExchange: newOrganization.babyProductExchange,
        lowIncome: newOrganization.lowIncome,
        criminalJusticeInvolved: newOrganization.criminalJusticeInvolved,
        adoptionAndFosterFamilies: newOrganization.adoptionAndFosterFamilies,
        refugeeAndImmigration: newOrganization.adoptionAndFosterFamilies,
        substanceAbuseDisorders: newOrganization.substanceAbuseDisorders,
        address: newOrganization.address,
        pointOfContact: newOrganization.pointOfContact,
        notes: newOrganization.notes,
        createdAt: serverTimestamp() as Timestamp,
        modifiedAt: serverTimestamp() as Timestamp
    }

    const organization = new Organization(organizationParams)
    const organizationRef = doc(db, ORGANIZATIONS_COLLECTION)
    await setDoc(organizationRef, organization)
}

export async function getOrganizations(): Promise<Organization[]> {
    const q = query(collection(db, ORGANIZATIONS_COLLECTION)).withConverter(organizationConverter)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
}
