// Modules
import {
    DocumentData,
    QueryConstraint,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    runTransaction,
    serverTimestamp,
    where,
    writeBatch
} from 'firebase/firestore';
// Models
import { Donation, IDonation } from '@/models/donation';
import { InventoryItem, IInventoryItem } from '@/models/inventoryItem';
import { DonationBody } from '@/types/post-data';

// Libs
import { db, getUserId, addErrorEvent, storage } from './firebase';
import { deleteObject, ref } from 'firebase/storage';

// Imported constants

export const DONATIONS_COLLECTION = 'Donations';
export const BULK_DONATIONS_COLLECTION = 'BulkDonations';

const donationConverter = {
    toFirestore(donation: Donation): DocumentData {
        const donationData: IDonation = {
            id: donation.getId(),
            donorEmail: donation.getDonorEmail(),
            donorName: donation.getDonorName(),
            category: donation.getCategory(),
            brand: donation.getBrand(),
            model: donation.getModel(),
            description: donation.getDescription(),
            tagNumber: donation.getTagNumber(),
            notes: donation.getNotes(),
            status: donation.getStatus(),
            bulkCollection: donation.getBulkCollection(),
            images: donation.getImages(),
            createdAt: donation.getCreatedAt(),
            modifiedAt: donation.getModifiedAt(),
            dateReceived: donation.getDateReceived(),
            dateDistributed: donation.getDateDistributed(),
            requestor: donation.getRequestor()
        };
        for (const key in donationData) {
            if (donationData[key] === undefined || donationData[key] === null) {
                delete donationData[key];
            }
        }
        return donationData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Donation {
        const data = snapshot.data(options);
        const donationData: IDonation = {
            id: data.id,
            donorEmail: data.donorEmail,
            donorName: data.donorName,
            category: data.category,
            brand: data.brand,
            model: data.model,
            description: data.description,
            tagNumber: data.tagNumber,
            notes: data.notes,
            status: data.status,
            bulkCollection: data.bulkCollection,
            images: data.images,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt,
            dateReceived: data.dateReceived,
            dateDistributed: data.dateDistributed,
            requestor: data.requestor
        };
        return new Donation(donationData);
    }
};

const inventoryConverter = {
    toFirestore(inventory: InventoryItem): DocumentData {
        const inventoryData: IInventoryItem = {
            id: inventory.getId(),
            category: inventory.getCategory(),
            brand: inventory.getBrand(),
            model: inventory.getModel(),
            description: inventory.getDescription(),
            tagNumber: inventory.getTagNumber(),
            notes: inventory.getNotes(),
            status: inventory.getStatus(),
            bulkCollection: inventory.getBulkCollection(),
            images: inventory.getImages(),
            createdAt: inventory.getCreatedAt(),
            modifiedAt: inventory.getModifiedAt(),
            dateReceived: inventory.getDateReceived(),
            dateDistributed: inventory.getDateDistributed(),
            requestor: inventory.getRequestor()
        };
        for (const key in inventoryData) {
            if (inventoryData[key] === undefined || inventoryData[key] === null) {
                delete inventoryData[key];
            }
        }
        return inventoryData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): InventoryItem {
        const data = snapshot.data(options);
        const inventoryData: IInventoryItem = {
            id: data.id,
            category: data.category,
            brand: data.brand,
            model: data.model,
            description: data.description,
            tagNumber: data.tagNumber,
            notes: data.notes,
            status: data.status,
            bulkCollection: data.bulkCollection,
            images: data.images,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt,
            dateReceived: data.dateReceived,
            dateDistributed: data.dateDistributed,
            requestor: data.requestor
        };
        return new InventoryItem(inventoryData);
    }
};

export async function getAllDonations(): Promise<Donation[]> {
    try {
        let donations: Donation[] = [];
        const querySnapshot = await getDocs(collection(db, DONATIONS_COLLECTION).withConverter(donationConverter));
        querySnapshot.forEach((snapshot) => {
            donations.push(snapshot.data());
        });
        return donations;
    } catch (error) {
        addErrorEvent('Get all donations', error);
    }
    return Promise.reject();
}

export async function getInventory(): Promise<InventoryItem[]> {
    try {
        let inventory: InventoryItem[] = [];
        const collectionRef = collection(db, DONATIONS_COLLECTION);
        const contraints: QueryConstraint[] = [where('status', '==', 'available')];
        const q = query(collectionRef, ...contraints).withConverter(inventoryConverter);
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((snapshot) => {
            inventory.push(snapshot.data());
        });
        return inventory;
    } catch (error) {
        addErrorEvent('Get inventory', error);
    }
    return Promise.reject();
}

export async function getDonationById(id: string): Promise<Donation> {
    try {
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);
        const donationSnapshot = await getDoc(donationRef);
        if (donationSnapshot.exists()) {
            return donationSnapshot.data();
        } else {
            return Promise.reject();
        }
    } catch (error: any) {
        addErrorEvent('getDonationById', error);
    }
    return Promise.reject();
}

export async function addDonation(newDonation: DonationBody) {
    try {
        await runTransaction(db, async (transaction) => {
            // Generate document references with firebase-generated IDs
            const donationRef = doc(collection(db, DONATIONS_COLLECTION));
            const userId: string = await getUserId();
            const donationParams: IDonation = {
                id: donationRef.id,
                donorEmail: newDonation.donorEmail,
                donorName: newDonation.donorName,
                category: newDonation.category,
                brand: newDonation.brand,
                model: newDonation.model,
                description: newDonation.description,
                tagNumber: null,
                notes: null,
                status: 'pending review',
                bulkCollection: null,
                images: newDonation.images,
                createdAt: serverTimestamp() as Timestamp,
                modifiedAt: serverTimestamp() as Timestamp,
                dateReceived: null,
                dateDistributed: null,
                requestor: null
            };
            const donation = new Donation(donationParams);
            transaction.set(donationRef, donationConverter.toFirestore(donation));
        });
    } catch (error: any) {
        addErrorEvent('addDonation', error);
    }
}

export async function addBulkDonation(newDonations: DonationBody[]) {
    if (newDonations.length === 1) {
        await addDonation(newDonations[0]);
        return;
    }
    try {
        const userId: string = await getUserId();
        const bulkDonationsRef = doc(collection(db, BULK_DONATIONS_COLLECTION));
        const batch = writeBatch(db);
        batch.set(bulkDonationsRef, { donations: [], donorEmail: newDonations[0].donorEmail, donorName: newDonations[0].donorName });
        for (const newDonation of newDonations) {
            const donationRef = doc(collection(db, DONATIONS_COLLECTION));
            const donationParams: IDonation = {
                id: donationRef.id,
                donorEmail: newDonation.donorEmail,
                donorName: newDonation.donorName,
                category: newDonation.category,
                brand: newDonation.brand,
                model: newDonation.model,
                description: newDonation.description,
                tagNumber: null,
                notes: null,
                status: 'pending review',
                bulkCollection: bulkDonationsRef,
                images: newDonation.images,
                createdAt: serverTimestamp() as Timestamp,
                modifiedAt: serverTimestamp() as Timestamp,
                dateReceived: null,
                dateDistributed: null,
                requestor: null
            };
            const donation = new Donation(donationParams);
            batch.set(donationRef, donationConverter.toFirestore(donation));
            batch.update(bulkDonationsRef, {
                donations: arrayUnion(donationRef)
            });
        }
        await batch.commit();
    } catch (error) {
        addErrorEvent('addBulkDonation', error);
    }
}

export async function deleteDonationById(id: string): Promise<void> {
    //to-do make admin only
    try {
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);
        const donationSnapshot = await getDoc(donationRef);
        const donation = donationSnapshot.data();
        donation?.images.forEach(async (image) => {
            try {
                const imageRef = ref(storage, image as string);
                await deleteObject(imageRef);
            } catch (error) {
                addErrorEvent('Delete images in deleteDonationById', error);
            }
        });
        await deleteDoc(donationRef);
    } catch (error) {
        addErrorEvent('Delete donation by id', error);
    }
}
