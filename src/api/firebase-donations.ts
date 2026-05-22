// Modules
import {
    DocumentData,
    DocumentReference,
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
    or,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
    documentId,
    arrayRemove,
    runTransaction
} from 'firebase/firestore';
// Models
import { Donation, IDonation } from '@/models/donation';
import { InventoryItem, IInventoryItem } from '@/models/inventoryItem';
import { DonationStatusValues } from '@/models/donation';
import { DonationBody } from '@/types/post-data';
import { Order } from '@/types/OrdersTypes';
// Libs
import { db, addErrorEvent, storage } from './firebase';
import { deleteObject, ref } from 'firebase/storage';
import { AdminDonationBody, base64ImageObj } from '@/types/DonationTypes';
import { base64ObjToFile } from '@/utils/utils';
import { uploadImages } from './firebase-images';
import { CATEGORIES_COLLECTION } from './firebase-categories';

// Imported constants
import { USERS_COLLECTION } from './firebase-users';
import { ORGANIZATIONS_COLLECTION } from './firebase-organizations';

export const DONATIONS_COLLECTION = 'Donations';
export const BULK_DONATIONS_COLLECTION = 'BulkDonations';
export const ORDERS_COLLECTION = 'Orders';

type CategoryTagData = {
    ref: DocumentReference;
    tagCount: number;
    tagPrefix: string;
};

async function getCategoryRefByName(category: string): Promise<DocumentReference> {
    const categoryQuery = query(collection(db, CATEGORIES_COLLECTION), where('name', '==', category));
    const categorySnapshot = await getDocs(categoryQuery);
    const categoryRef = categorySnapshot.docs[0]?.ref;
    if (!categoryRef) {
        throw new Error(`Category not found: "${category}". No matching category exists.`);
    }
    return categoryRef;
}

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
            requestor: donation.getRequestor(),
            distributor: donation.getDistributor()
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
            requestor: data.requestor,
            distributor: data.distributor
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
        const donations: Donation[] = [];
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
    const donations: Donation[] = [];
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
        const inventory: InventoryItem[] = [];
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
    if (inventoryIds.length === 0) {
        return [];
    }
    try {
        const inventory: InventoryItem[] = [];
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
        const donations: Donation[] = [];
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

export async function addDonation(newDonations: DonationBody[], termsAccepted: string) {
    try {
        //All donations are assigned a bulk donatin id to account for multiple items
        const bulkDonationsRef = doc(collection(db, BULK_DONATIONS_COLLECTION));
        const batch = writeBatch(db);
        batch.set(bulkDonationsRef, {
            donations: [],
            donorEmail: newDonations[0].donorEmail,
            donorName: newDonations[0].donorName,
            donorId: newDonations[0].donorId,
            termsAccepted: termsAccepted,
            createdAt: serverTimestamp()
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
                requestor: null,
                distributor: null
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

type RequestorInfo = { id: string; name: string; email: string };

//When admins make donations, status is automatically set to 'available' unless it is attached to a requestor order.
export async function addAdminDonation(newDonations: AdminDonationBody[], requestor?: RequestorInfo, orderId?: string): Promise<Order | null> {
    try {
        if (newDonations.length === 0) {
            throw new Error('At least one donation is required.');
        }
        if (orderId && !requestor) {
            throw new Error('Requestor is required when adding donations to an order.');
        }

        //All donations are assigned a bulk donatin id to account for multiple items
        const bulkDonationsRef = doc(collection(db, BULK_DONATIONS_COLLECTION));
        const orderRef = orderId ? doc(db, ORDERS_COLLECTION, orderId) : requestor ? doc(collection(db, ORDERS_COLLECTION)) : null;
        const donationRefs = newDonations.map(() => doc(collection(db, DONATIONS_COLLECTION)));
        const uniqueCategories = Array.from(new Set(newDonations.map((donation) => donation.category || 'Other')));
        const categoryEntries = await Promise.all(
            uniqueCategories.map(async (category) => ({
                category,
                ref: await getCategoryRefByName(category)
            }))
        );

        await runTransaction(db, async (transaction) => {
            const categoryDataByName = new Map<string, CategoryTagData>();

            for (const { category, ref } of categoryEntries) {
                const categoryDoc = await transaction.get(ref);
                if (!categoryDoc.exists()) {
                    throw new Error(`Category not found: ${category}`);
                }
                const categoryData = categoryDoc.data();
                categoryDataByName.set(category, {
                    ref,
                    tagCount: Number(categoryData.tagCount ?? 0),
                    tagPrefix: String(categoryData.tagPrefix ?? '').trim()
                });
            }

            transaction.set(bulkDonationsRef, {
                donations: donationRefs,
                donorEmail: newDonations[0].donorEmail,
                donorName: newDonations[0].donorName,
                donorId: newDonations[0].donorId,
                createdAt: serverTimestamp()
            });

            if (orderRef && requestor && orderId) {
                transaction.update(orderRef, {
                    items: arrayUnion(...donationRefs),
                    modifiedAt: serverTimestamp()
                });
            } else if (orderRef && requestor) {
                transaction.set(orderRef, {
                    status: 'open',
                    requestor,
                    items: donationRefs,
                    rejectedItems: [],
                    createdAt: serverTimestamp(),
                    modifiedAt: serverTimestamp()
                });
            }

            newDonations.forEach((newDonation, index) => {
                const categoryName = newDonation.category || 'Other';
                const categoryData = categoryDataByName.get(categoryName);
                if (!categoryData) {
                    throw new Error(`Category not found: ${categoryName}`);
                }

                categoryData.tagCount += 1;
                const donationParams: IDonation = {
                    id: donationRefs[index].id,
                    donorEmail: newDonation.donorEmail,
                    donorName: newDonation.donorName,
                    donorId: newDonation.donorId,
                    category: categoryName,
                    brand: newDonation.brand,
                    model: newDonation.model,
                    description: newDonation.description,
                    tagNumber: `${categoryData.tagPrefix} ${categoryData.tagCount}`.trim(),
                    notes: null,
                    status: requestor ? 'requested' : 'available',
                    bulkCollection: bulkDonationsRef.id,
                    images: newDonation.images,
                    createdAt: serverTimestamp() as Timestamp,
                    modifiedAt: serverTimestamp() as Timestamp,
                    dateAccepted: serverTimestamp() as Timestamp,
                    dateReceived: serverTimestamp() as Timestamp,
                    dateRequested: requestor ? (serverTimestamp() as Timestamp) : null,
                    dateDistributed: null,
                    requestor: requestor ?? null,
                    distributor: null
                };
                const donation = new Donation(donationParams);
                transaction.set(donationRefs[index], donationConverter.toFirestore(donation));
            });

            for (const categoryData of categoryDataByName.values()) {
                transaction.update(categoryData.ref, {
                    tagCount: categoryData.tagCount,
                    modifiedAt: serverTimestamp()
                });
            }
        });

        return orderRef ? await getOrderById(orderRef.id) : null;
    } catch (error) {
        addErrorEvent('addBulkDonation', error);
        throw error;
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

export async function updateDropOffDonationStatuses(params: {
    acceptedDonations: { id: string; category: string }[];
    rejectedDonationIds: string[];
    schedulingLink?: string;
}): Promise<{ id: string; tagNumber: string }[]> {
    try {
        const uniqueCategories = [...new Set(params.acceptedDonations.map((donation) => donation.category))];
        const categoryRefsByName = new Map<string, DocumentReference>();

        await Promise.all(
            uniqueCategories.map(async (category) => {
                categoryRefsByName.set(category, await getCategoryRefByName(category));
            })
        );

        return await runTransaction(db, async (transaction) => {
            const categoryDataByName = new Map<string, CategoryTagData>();

            for (const category of uniqueCategories) {
                const categoryRef = categoryRefsByName.get(category);
                if (!categoryRef) {
                    throw new Error(`Category not found: "${category}". No matching category exists.`);
                }

                const categoryDoc = await transaction.get(categoryRef);
                if (!categoryDoc.exists()) {
                    throw new Error(`Category not found: "${category}". No matching category exists.`);
                }

                const categoryData = categoryDoc.data();
                categoryDataByName.set(category, {
                    ref: categoryRef,
                    tagCount: Number(categoryData.tagCount ?? 0),
                    tagPrefix: String(categoryData.tagPrefix ?? '').trim()
                });
            }

            const acceptedDonationUpdates = params.acceptedDonations.map((donation) => {
                const categoryData = categoryDataByName.get(donation.category);
                if (!categoryData) {
                    throw new Error(`Category not found: "${donation.category}". No matching category exists.`);
                }

                categoryData.tagCount += 1;
                return {
                    id: donation.id,
                    tagNumber: `${categoryData.tagPrefix} ${categoryData.tagCount}`.trim()
                };
            });

            categoryDataByName.forEach((categoryData) => {
                transaction.update(categoryData.ref, {
                    tagCount: categoryData.tagCount,
                    modifiedAt: serverTimestamp()
                });
            });

            acceptedDonationUpdates.forEach((donation) => {
                const donationRef = doc(db, DONATIONS_COLLECTION, donation.id).withConverter(donationConverter);
                transaction.update(donationRef, {
                    status: 'pending delivery',
                    dateAccepted: serverTimestamp(),
                    tagNumber: donation.tagNumber,
                    schedulingLink: params.schedulingLink ?? null,
                    schedulingEmailSentAt: params.schedulingLink ? serverTimestamp() : null,
                    modifiedAt: serverTimestamp()
                });
            });

            params.rejectedDonationIds.forEach((donationId) => {
                const donationRef = doc(db, DONATIONS_COLLECTION, donationId).withConverter(donationConverter);
                transaction.update(donationRef, {
                    status: 'rejected',
                    modifiedAt: serverTimestamp()
                });
            });

            return acceptedDonationUpdates;
        });
    } catch (error) {
        addErrorEvent('updateDropOffDonationStatuses', error);
        throw error;
    }
}

export async function schedulePickupForOrder(order: Order, schedulingLink?: string): Promise<void> {
    try {
        const batch = writeBatch(db);
        const schedulingFields = schedulingLink
            ? {
                  schedulingLink,
                  schedulingEmailSentAt: serverTimestamp()
              }
            : {};

        order.items.forEach((item) => {
            const donationRef = doc(db, DONATIONS_COLLECTION, item.id).withConverter(donationConverter);
            batch.update(donationRef, {
                status: 'reserved',
                ...schedulingFields,
                modifiedAt: serverTimestamp()
            });
        });

        const orderRef = doc(db, ORDERS_COLLECTION, order.id);
        batch.update(orderRef, {
            modifiedAt: serverTimestamp()
        });

        await batch.commit();
    } catch (error) {
        addErrorEvent('schedulePickupForOrder', error);
        throw error;
    }
}

export async function cancelOrderAndReturnItems(order: Order): Promise<void> {
    try {
        const batch = writeBatch(db);
        const orderRef = doc(db, ORDERS_COLLECTION, order.id);

        order.items.forEach((item) => {
            const donationRef = doc(db, DONATIONS_COLLECTION, item.id).withConverter(donationConverter);
            batch.update(donationRef, {
                status: 'available',
                requestor: null,
                modifiedAt: serverTimestamp()
            });
        });

        batch.update(orderRef, {
            modifiedAt: serverTimestamp()
        });

        await batch.commit();
    } catch (error) {
        addErrorEvent('cancelOrderAndReturnItems', error);
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
        const unavailableDonations = [];
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
    const orders: Order[] = [];
    try {
        const ordersRef = collection(db, ORDERS_COLLECTION);
        const q = query(ordersRef, where('status', '==', 'open'));
        const ordersSnapshot = await getDocs(q);
        for (const doc of ordersSnapshot.docs) {
            const orderInfo = doc.data();
            const order: Order = {
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
            const order: Order = {
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
            requestor: null,
            modifiedAt: serverTimestamp()
        });
        await batch.commit();
    } catch (error) {
        addErrorEvent('Error removing donation from order', error);
    }
}

//Marks donation as distributed and adds it to user's and organization's distributed items list
export async function markDonationAsDistributed(donation: Donation): Promise<void> {
    try {
        const batch = writeBatch(db);
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${donation.id}`).withConverter(donationConverter);
        const requestorRef = doc(db, `${USERS_COLLECTION}/${donation.requestor?.id}`);
        const requestorSnapshot = await getDoc(requestorRef);
        let orgId = '';
        if (requestorSnapshot.exists()) {
            const requestor = requestorSnapshot.data();
            orgId = requestor.organization.id;
        }
        const organizationRef = doc(db, ORGANIZATIONS_COLLECTION, orgId);
        const organizationSnapshot = await getDoc(organizationRef);
        let orgName;
        if (organizationSnapshot.exists()) {
            orgName = organizationSnapshot.data().name;
        }

        batch.update(donationRef, {
            status: 'distributed',
            distributor: {
                id: donation.requestor?.id,
                name: donation.requestor?.name,
                email: donation.requestor?.email,
                organization: orgName
            },
            modifiedAt: serverTimestamp(),
            dateDistributed: serverTimestamp()
        });
        batch.update(requestorRef, {
            distributedItems: arrayUnion({
                id: donation.id,
                tagNumber: donation.tagNumber
            }),
            modifiedAt: serverTimestamp()
        });
        batch.update(organizationRef, {
            distributedItems: arrayUnion({
                id: donation.id,
                tagNumber: donation.tagNumber
            }),
            modifiedAt: serverTimestamp()
        });
        await batch.commit();
    } catch (error) {
        addErrorEvent('Error marking donation as distributed', error);
    }
}
