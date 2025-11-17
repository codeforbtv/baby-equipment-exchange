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
    and,
    or,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
    documentId,
    DocumentReference,
    FieldValue,
    arrayRemove
} from 'firebase/firestore';
// Models
import { Donation, IDonation } from '@/models/donation';
import { InventoryItem, IInventoryItem } from '@/models/inventoryItem';
import { DonationStatusValues } from '@/models/donation';
import { DonationBody } from '@/types/post-data';
import { Order } from '@/types/OrdersTypes';
// Libs
import { db, auth, addErrorEvent, storage, checkIsAdmin, checkIsAidWorker } from './firebase';
import { deleteObject, ref } from 'firebase/storage';
import { getBase64ImagesFromTagnumber } from './firebaseAdmin';
import { base64ImageObj } from '@/types/DonationTypes';
import { base64ObjToFile } from '@/utils/utils';
import { uploadImages } from './firebase-images';
import { imageImports } from '@/data/imports/tag_image_map';

// Imported constants

export const DONATIONS_COLLECTION = 'Donations';
export const BULK_DONATIONS_COLLECTION = 'BulkDonations';
export const ORDERS_COLLECTION = 'Orders';

const donationConverter = {
    toFirestore(donation: Donation): DocumentData {
        const donationData: IDonation = {
            id: donation.getId(),
            donorEmail: donation.getDonorEmail(),
            donorName: donation.getDonorName(),
            donorId: donation.getDonorId(),
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
            dateAccepted: donation.getDateAccepted(),
            dateReceived: donation.getDateReceived(),
            dateRequested: donation.getDateRequested(),
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
            donorId: data.donorId,
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
            dateAccepted: data.dateAccepted,
            dateReceived: data.dateReceived,
            dateRequested: data.dateRequested,
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
            status: inventory.getStatus(),
            images: inventory.getImages()
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
            status: data.status,
            images: data.images
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

export async function getDonationNotifications(): Promise<Donation[]> {
    let donations: Donation[] = [];
    try {
        const donationsRef = collection(db, DONATIONS_COLLECTION);
        const donationNotificationsQuery = query(
            donationsRef,
            or(where('status', '==', 'in processing'), where('status', '==', 'pending delivery'), where('status', '==', 'reserved'))
        ).withConverter(donationConverter);
        const donationsNotificationsSnapshot = await getDocs(donationNotificationsQuery);
        for (const doc of donationsNotificationsSnapshot.docs) {
            donations.push(doc.data());
        }
        return donations;
    } catch (error) {
        addErrorEvent('Get donation notifications', error);
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

export async function getInventoryItemById(id: string): Promise<InventoryItem> {
    try {
        const itemRef = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(inventoryConverter);
        const itemSnapshot = await getDoc(itemRef);
        if (itemSnapshot.exists()) {
            return itemSnapshot.data();
        } else {
            return Promise.reject(new Error('Inventory item not found'));
        }
    } catch (error) {
        addErrorEvent('Get inventory item by id', error);
    }
    return Promise.reject();
}

//Get an array of inventory items from array of IDs. For retrieving items from local storage.
export async function getInventoryByIds(inventoryIds: string[]): Promise<InventoryItem[]> {
    if (inventoryIds.length === 0) return [];
    try {
        let inventory: InventoryItem[] = [];
        const collectionRef = collection(db, DONATIONS_COLLECTION);
        const q = query(collectionRef, where(documentId(), 'in', inventoryIds)).withConverter(inventoryConverter);
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((snapshot) => {
            inventory.push(snapshot.data());
        });
        return inventory;
    } catch (error) {
        addErrorEvent('Get inventory by Ids', error);
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
            return Promise.reject(new Error('Donation not found'));
        }
    } catch (error: any) {
        addErrorEvent('getDonationById', error);
    }
    return Promise.reject();
}

export async function getDonationsByBulkId(id: string): Promise<Donation[]> {
    try {
        let donations: Donation[] = [];
        const bulkRef = doc(db, BULK_DONATIONS_COLLECTION, id);
        const bulkSnapshot = await getDoc(bulkRef);
        if (bulkSnapshot.exists()) {
            const bulkData = bulkSnapshot.data();
            for (const donation of bulkData.donations) {
                const donationDetails = await getDonationById(donation.id);
                donations.push(donationDetails);
            }
        }
        return donations;
    } catch (error) {
        addErrorEvent('Get donations by bulk id', error);
    }
    return Promise.reject(new Error('Something went wrong fetching donations by bulk ID'));
}

export async function addDonation(newDonations: DonationBody[]) {
    try {
        //All donations are assigned a bulk donatin id to account for multiple items
        const bulkDonationsRef = doc(collection(db, BULK_DONATIONS_COLLECTION));
        const batch = writeBatch(db);
        batch.set(bulkDonationsRef, {
            donations: [],
            donorEmail: newDonations[0].donorEmail,
            donorName: newDonations[0].donorName,
            donorId: newDonations[0].donorId
        });
        for (const newDonation of newDonations) {
            const donationRef = doc(collection(db, DONATIONS_COLLECTION));
            const donationParams: IDonation = {
                id: donationRef.id,
                donorEmail: newDonation.donorEmail,
                donorName: newDonation.donorName,
                donorId: newDonation.donorId,
                category: newDonation.category,
                brand: newDonation.brand,
                model: newDonation.model,
                description: newDonation.description,
                tagNumber: null,
                notes: null,
                status: 'in processing',
                bulkCollection: bulkDonationsRef.id,
                images: newDonation.images,
                createdAt: serverTimestamp() as Timestamp,
                modifiedAt: serverTimestamp() as Timestamp,
                dateAccepted: null,
                dateReceived: null,
                dateRequested: null,
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

//When admins make donations, status is automatically set to 'available'
export async function addAdminDonation(newDonations: DonationBody[]): Promise<void> {
    try {
        //All donations are assigned a bulk donatin id to account for multiple items
        const bulkDonationsRef = doc(collection(db, BULK_DONATIONS_COLLECTION));
        const batch = writeBatch(db);
        batch.set(bulkDonationsRef, {
            donations: [],
            donorEmail: newDonations[0].donorEmail,
            donorName: newDonations[0].donorName,
            donorId: newDonations[0].donorId
        });
        for (const newDonation of newDonations) {
            const donationRef = doc(collection(db, DONATIONS_COLLECTION));
            const donationParams: IDonation = {
                id: donationRef.id,
                donorEmail: newDonation.donorEmail,
                donorName: newDonation.donorName,
                donorId: newDonation.donorId,
                category: newDonation.category,
                brand: newDonation.brand,
                model: newDonation.model,
                description: newDonation.description,
                tagNumber: null,
                notes: null,
                status: 'available',
                bulkCollection: bulkDonationsRef.id,
                images: newDonation.images,
                createdAt: serverTimestamp() as Timestamp,
                modifiedAt: serverTimestamp() as Timestamp,
                dateAccepted: serverTimestamp() as Timestamp,
                dateReceived: serverTimestamp() as Timestamp,
                dateRequested: null,
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

export async function updateDonation(id: string, donationDetails: any): Promise<void> {
    try {
        const donationRef = doc(db, DONATIONS_COLLECTION, id).withConverter(donationConverter);
        await updateDoc(donationRef, {
            ...donationDetails,
            modifiedAt: serverTimestamp()
        });
    } catch (error) {
        addErrorEvent('Error updating donation', error);
    }
}

export async function updateDonationStatus(id: string, status: DonationStatusValues): Promise<DonationStatusValues> {
    try {
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);

        let statusUpdate;

        if (status === 'available') {
            statusUpdate = {
                status: status,
                modfiedAt: serverTimestamp(),
                dateReceived: serverTimestamp()
            };
        } else if (status === 'distributed') {
            statusUpdate = {
                status: status,
                modfiedAt: serverTimestamp(),
                dateDistributed: serverTimestamp()
            };
        } else {
            statusUpdate = {
                status: status,
                modfiedAt: serverTimestamp()
            };
        }
        await updateDoc(donationRef, statusUpdate);
        return status;
    } catch (error) {
        addErrorEvent('updateDonationStatus', error);
        throw error;
    }
}

export async function deleteDonationById(id: string): Promise<void> {
    //to-do make admin only
    try {
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);
        const donationSnapshot = await getDoc(donationRef);
        const donation = donationSnapshot.data();
        if (donation?.images) {
            for (const image of donation.images) {
                try {
                    const imageRef = ref(storage, image as string);
                    await deleteObject(imageRef);
                } catch (error) {
                    addErrorEvent('Delete images in deleteDonationById', error);
                }
            }
        }
        await deleteDoc(donationRef);
    } catch (error) {
        addErrorEvent('Delete donation by id', error);
    }
}

export async function adminAreDonationsAvailable(ids: string[]): Promise<string[]> {
    try {
        let unavailableDonations = [];
        for (const id of ids) {
            const donationref = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);
            const donationSnapshot = await getDoc(donationref);
            const donation = donationSnapshot.data();
            if (donation && donation.status !== 'available') {
                unavailableDonations.push(donation.id);
            }
            return unavailableDonations;
        }
    } catch (error) {
        addErrorEvent('Admin are donations available', error);
    }
    return Promise.reject();
}

export async function requestInventoryItems(inventoryItemIds: string[], user: { id: string; name: string; email: string }): Promise<void> {
    try {
        const orderRef = doc(collection(db, ORDERS_COLLECTION));
        const batch = writeBatch(db);
        //Create a new order collection doc
        batch.set(orderRef, {
            status: 'open',
            requestor: user,
            items: [],
            createdAt: serverTimestamp()
        });
        for (const inventoryItemId of inventoryItemIds) {
            const inventoryItemRef = doc(db, DONATIONS_COLLECTION, inventoryItemId);
            //Update state of each requested item to 'requested'
            batch.update(inventoryItemRef, {
                status: 'requested',
                requestor: user,
                dateRequested: serverTimestamp(),
                modifiedAt: serverTimestamp()
            });
            //Add donation ref to items array
            batch.update(orderRef, {
                items: arrayUnion(inventoryItemRef),
                modifiedAt: serverTimestamp()
            });
        }
        await batch.commit();
    } catch (error) {
        addErrorEvent('Request inventory items', error);
    }
}

export async function adminRequestInventoryItems(inventoryItemIds: string[], user: { id: string; name: string; email: string }): Promise<Order> {
    try {
        const orderRef = doc(collection(db, ORDERS_COLLECTION));
        const batch = writeBatch(db);
        //Create and close order
        batch.set(orderRef, {
            status: 'open',
            requestor: user,
            items: [],
            createdAt: serverTimestamp()
        });
        for (const inventoryItemId of inventoryItemIds) {
            const inventoryItemRef = doc(db, DONATIONS_COLLECTION, inventoryItemId);
            //Update state of each requested item to 'requested'
            batch.update(inventoryItemRef, {
                status: 'requested',
                requestor: user,
                dateRequested: serverTimestamp(),
                modifiedAt: serverTimestamp()
            });
            //Add donation ref to items array
            batch.update(orderRef, {
                items: arrayUnion(inventoryItemRef),
                modifiedAt: serverTimestamp()
            });
        }
        await batch.commit();
        const order = await getOrderById(orderRef.id);
        return order;
    } catch (error) {
        addErrorEvent('Admin request inventory items', error);
        throw error;
    }
}

//Get items requested by aid workers
export async function getOrdersNotifications() {
    let orders: Order[] = [];
    try {
        const ordersRef = collection(db, ORDERS_COLLECTION);
        const q = query(ordersRef, where('status', '==', 'open'));
        const ordersSnapshot = await getDocs(q);
        for (const doc of ordersSnapshot.docs) {
            const orderInfo = doc.data();
            let order: Order = {
                id: doc.id,
                status: orderInfo.status,
                requestor: orderInfo.requestor,
                items: [],
                rejectedItems: []
            };
            for (const donation of orderInfo.items) {
                const donationDetails = await getDoc(donation);
                order.items.push(donationDetails.data() as Donation);
            }
            if (orderInfo.rejectedItems) {
                for (const donation of orderInfo.rejectedItems) {
                    const donationDetails = await getDoc(donation);
                    order.rejectedItems?.push(donationDetails.data() as Donation);
                }
            }

            orders.push(order);
        }
        return orders;
    } catch (error) {
        addErrorEvent('Error geting order notifications', error);
    }
    return Promise.reject();
}

export async function getOrderById(id: string): Promise<Order> {
    try {
        const orderRef = doc(db, `${ORDERS_COLLECTION}/${id}`);
        const orderSnapShot = await getDoc(orderRef);
        if (orderSnapShot.exists()) {
            const orderInfo = orderSnapShot.data();
            let order: Order = {
                id: orderRef.id,
                status: orderInfo.status,
                requestor: orderInfo.requestor,
                items: [],
                rejectedItems: []
            };
            for (const donation of orderInfo.items) {
                const donationDetails = await getDoc(donation);
                order.items.push(donationDetails.data() as Donation);
            }
            if (orderInfo.rejectedItems) {
                for (const donation of orderInfo.rejectedItems) {
                    const donationDetails = await getDoc(donation);
                    order.rejectedItems?.push(donationDetails.data() as Donation);
                }
            }
            return order;
        } else {
            return Promise.reject(new Error('Order not found'));
        }
    } catch (error) {
        addErrorEvent('Get order by ID', error);
    }
    return Promise.reject();
}

export async function closeOrder(id: string): Promise<void> {
    try {
        const orderRef = doc(db, `${ORDERS_COLLECTION}/${id}`);
        await updateDoc(orderRef, { status: 'closed', modifiedAt: serverTimestamp() });
    } catch (error) {
        addErrorEvent('Error closing', error);
    }
}

//Removes rejected donation from order, add to rejectedItems array, and changes status to 'unavailable'.
export async function removeDonationFromOrder(orderId: string, donation: Donation): Promise<void> {
    try {
        const batch = writeBatch(db);
        const orderRef = doc(db, `${ORDERS_COLLECTION}/${orderId}`);
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${donation.id}`).withConverter(donationConverter);
        batch.update(orderRef, {
            items: arrayRemove(donationRef),
            rejectedItems: arrayUnion(donationRef),
            modifiedAt: serverTimestamp()
        });
        batch.update(donationRef, {
            status: 'unavailable',
            modifiedAt: serverTimestamp()
        });
        await batch.commit();
    } catch (error) {
        addErrorEvent('Error removing donation from order', error);
    }
}

//The below functions are for uploading images for donations imported from the original spreadsheet
export async function uploadImagesFromTagNumber(tagNumber: string) {
    try {
        const base64Images: base64ImageObj[] = await getBase64ImagesFromTagnumber(tagNumber);
        let imageFiles: File[] = [];
        for (const base64Image of base64Images) {
            const imageFile = await base64ObjToFile(base64Image);
            imageFiles.push(imageFile);
        }
        const imageUrls = await uploadImages(imageFiles);
        return imageUrls;
    } catch (error) {
        throw error;
    }
}

export async function convertImportedDonations(): Promise<void> {
    try {
        const importsSnapshot = await getDocs(collection(db, 'BPE_Test_Data_Updated_Donors_v2'));
        const batch = writeBatch(db);
        for (const doc of importsSnapshot.docs) {
            const docData = doc.data();
            const images = await uploadImagesFromTagNumber(docData['tagNumber']);
            batch.update(doc.ref, {
                images: images,
                dateAccepted: null,
                dateReceived: null,
                dateRequested: null,
                dateDistributed: null,
                requestor: null,
                notes: null,
                modifiedAt: serverTimestamp()
            });
            if (docData['donorEmail'] === undefined) {
                batch.update(doc.ref, {
                    donorEmail: ''
                });
            }
            if (docData['donorName'] === undefined) {
                batch.update(doc.ref, {
                    donorName: ''
                });
            }
        }
        await batch.commit();
        console.log('Done!');
    } catch (error) {
        console.log('Not done!');
        throw error;
    }
}
