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
import { Order, RejectionRecord } from '@/types/OrdersTypes';
import { ReservedOrderLink } from '@/types/NotificationTypes';
// Libs
import { db, addErrorEvent, storage } from './firebase';
import { deleteObject, ref } from 'firebase/storage';
import { AdminDonationBody, base64ImageObj } from '@/types/DonationTypes';
import { base64ObjToFile } from '@/utils/utils';
import { uploadImages } from './firebase-images';

// Imported constants
import { USERS_COLLECTION } from './firebase-users';
import { ORGANIZATIONS_COLLECTION } from './firebase-organizations';

export const DONATIONS_COLLECTION = 'Donations';
export const BULK_DONATIONS_COLLECTION = 'BulkDonations';
export const ORDERS_COLLECTION = 'Orders';

export type OrderItemRejectionResolution =
    | { action: 'available' }
    | { action: 'unavailable' }
    | { action: 'requested'; requestor: { id: string; name: string; email: string } };

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
            firstReceivedAt: donation.getFirstReceivedAt(),
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
            firstReceivedAt: data.firstReceivedAt,
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

async function batchGetDonationsByRefs(refs: DocumentReference[]): Promise<Donation[]> {
    if (refs.length === 0) return [];

    const CHUNK_SIZE = 30;
    const ids = refs.map((ref) => ref.id);
    const donations: Donation[] = [];

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const q = query(collection(db, DONATIONS_COLLECTION).withConverter(donationConverter), where(documentId(), 'in', chunk));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
            donations.push(doc.data());
        });
    }

    return donations;
}

export async function getOrderLinksForDonations(donationRefs: DocumentReference[]): Promise<ReservedOrderLink[]> {
    if (donationRefs.length === 0) return [];

    const CHUNK_SIZE = 30; // Firestore array-contains-any limit
    const links: ReservedOrderLink[] = [];
    const targetIds = new Set(donationRefs.map((r) => r.id));

    for (let i = 0; i < donationRefs.length; i += CHUNK_SIZE) {
        const chunk = donationRefs.slice(i, i + CHUNK_SIZE);
        const q = query(collection(db, ORDERS_COLLECTION), where('items', 'array-contains-any', chunk));
        const snapshot = await getDocs(q);
        snapshot.forEach((orderDoc) => {
            const data = orderDoc.data();
            const itemRefs: DocumentReference[] = data.items ?? [];
            for (const ref of itemRefs) {
                if (targetIds.has(ref.id)) {
                    links.push({ donationId: ref.id, orderId: orderDoc.id, orderCreatedAt: data.createdAt ?? null });
                }
            }
        });
    }

    return links;
}

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
    if (inventoryIds.length === 0) return [];
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
        if (!id) {
            return [];
        }

        const donations: Donation[] = [];
        const donationsRef = collection(db, DONATIONS_COLLECTION);
        const donationsByBulkIdQuery = query(donationsRef, where('bulkCollection', '==', id), where('status', '==', 'in processing')).withConverter(
            donationConverter
        );
        const donationsSnapshot = await getDocs(donationsByBulkIdQuery);
        donationsSnapshot.forEach((snapshot) => donations.push(snapshot.data()));
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
                firstReceivedAt: null,
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

//When admins make donations, status is automatically set to 'available'
export async function addAdminDonation(newDonations: AdminDonationBody[]): Promise<void> {
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
                tagNumber: newDonation.tagNumber,
                notes: null,
                status: 'available',
                bulkCollection: bulkDonationsRef.id,
                images: newDonation.images,
                createdAt: serverTimestamp() as Timestamp,
                modifiedAt: serverTimestamp() as Timestamp,
                dateAccepted: serverTimestamp() as Timestamp,
                dateReceived: serverTimestamp() as Timestamp,
                firstReceivedAt: serverTimestamp() as Timestamp,
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
            //Stamp the immutable firstReceivedAt storage-clock only on the first receive; keep dateReceived re-stamp for backward compatibility.
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(donationRef);
                const data = snap.data();
                const update: any = { status, modfiedAt: serverTimestamp(), dateReceived: serverTimestamp() };
                if (!data?.firstReceivedAt) update.firstReceivedAt = serverTimestamp();
                tx.update(donationRef, update);
            });
            return status;
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
        const unavailableDonations = [];
        for (const id of ids) {
            const donationref = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);
            const donationSnapshot = await getDoc(donationref);
            const donation = donationSnapshot.data();
            if (donation && donation.status !== 'available') {
                unavailableDonations.push(donation.id);
            }
        }
        return unavailableDonations;
    } catch (error) {
        addErrorEvent('Admin are donations available', error);
        throw error;
    }
    return [];
}

export async function requestInventoryItems(inventoryItemIds: string[], user: { id: string; name: string; email: string }): Promise<void> {
    try {
        // Snapshot the requestor's org at request time; callers only have Auth data.
        const requestorUserSnap = await getDoc(doc(db, USERS_COLLECTION, user.id));
        const organization = requestorUserSnap.exists() ? (requestorUserSnap.data().organization ?? null) : null;
        const requestor = { ...user, organization };
        const orderRef = doc(collection(db, ORDERS_COLLECTION));
        const batch = writeBatch(db);
        //Create a new order collection doc
        batch.set(orderRef, {
            status: 'open',
            requestor: requestor,
            items: [],
            createdAt: serverTimestamp()
        });
        for (const inventoryItemId of inventoryItemIds) {
            const inventoryItemRef = doc(db, DONATIONS_COLLECTION, inventoryItemId);
            //Update state of each requested item to 'requested'
            batch.update(inventoryItemRef, {
                status: 'requested',
                requestor: requestor,
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
        // Snapshot the requestor's org at request time; callers only have Auth data.
        const requestorUserSnap = await getDoc(doc(db, USERS_COLLECTION, user.id));
        const organization = requestorUserSnap.exists() ? (requestorUserSnap.data().organization ?? null) : null;
        const requestor = { ...user, organization };
        const orderRef = doc(collection(db, ORDERS_COLLECTION));
        const batch = writeBatch(db);
        //Create and close order
        batch.set(orderRef, {
            status: 'open',
            requestor: requestor,
            items: [],
            createdAt: serverTimestamp()
        });
        for (const inventoryItemId of inventoryItemIds) {
            const inventoryItemRef = doc(db, DONATIONS_COLLECTION, inventoryItemId);
            //Update state of each requested item to 'requested'
            batch.update(inventoryItemRef, {
                status: 'requested',
                requestor: requestor,
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

        const allItemRefs: DocumentReference[] = [];
        const allRejectedRefs: DocumentReference[] = [];
        const orderShells: {
            id: string;
            status: string;
            requestor: { email: string; id: string; name: string };
            itemIds: string[];
            rejectedIds: string[];
            rejections: Record<string, RejectionRecord>;
        }[] = [];

        for (const doc of ordersSnapshot.docs) {
            const orderInfo = doc.data();
            const itemRefs: DocumentReference[] = orderInfo.items ?? [];
            const rejectedRefs: DocumentReference[] = orderInfo.rejectedItems ?? [];

            orderShells.push({
                id: doc.id,
                status: orderInfo.status,
                requestor: orderInfo.requestor,
                itemIds: itemRefs.map((ref) => ref.id),
                rejectedIds: rejectedRefs.map((ref) => ref.id),
                rejections: orderInfo.rejections ?? {}
            });

            allItemRefs.push(...itemRefs);
            allRejectedRefs.push(...rejectedRefs);
        }

        const [allItems, allRejected] = await Promise.all([batchGetDonationsByRefs(allItemRefs), batchGetDonationsByRefs(allRejectedRefs)]);

        const itemsById = new Map(allItems.map((d) => [d.id, d]));
        const rejectedById = new Map(allRejected.map((d) => [d.id, d]));

        for (const shell of orderShells) {
            orders.push({
                id: shell.id,
                status: shell.status,
                requestor: shell.requestor,
                items: shell.itemIds.map((id) => itemsById.get(id)).filter(Boolean) as Donation[],
                rejectedItems: shell.rejectedIds.map((id) => rejectedById.get(id)).filter(Boolean) as Donation[],
                rejections: shell.rejections
            });
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
                rejectedItems: [],
                rejections: orderInfo.rejections ?? {}
            };
            order.items = await batchGetDonationsByRefs(orderInfo.items ?? []);

            if (orderInfo.rejectedItems) {
                order.rejectedItems = await batchGetDonationsByRefs(orderInfo.rejectedItems);
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

//Removes rejected donation from order, adds it to rejectedItems, and applies the selected next step.
export async function removeDonationFromOrder(
    orderId: string,
    donation: Donation,
    resolution: OrderItemRejectionResolution = { action: 'unavailable' }
): Promise<void> {
    try {
        const orderRef = doc(db, `${ORDERS_COLLECTION}/${orderId}`);
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${donation.id}`).withConverter(donationConverter);
        const reassignedOrderRef = resolution.action === 'requested' ? doc(collection(db, ORDERS_COLLECTION)) : null;

        await runTransaction(db, async (transaction) => {
            const orderSnapshot = await transaction.get(orderRef);
            if (!orderSnapshot.exists()) {
                throw new Error('Order not found');
            }

            const donationSnapshot = await transaction.get(donationRef);
            if (!donationSnapshot.exists()) {
                throw new Error('Donation not found');
            }

            const orderData = orderSnapshot.data();
            if (orderData.status !== 'open') {
                throw new Error('Order is no longer open');
            }

            const donationData = donationSnapshot.data();
            if (donationData.status !== 'requested') {
                throw new Error('Donation is no longer requested');
            }

            if (resolution.action === 'requested' && resolution.requestor.id === orderData.requestor?.id) {
                throw new Error('Donation is already requested by this user');
            }

            const orderItems = (orderData.items ?? []) as { id: string; path?: string }[];
            const matchingOrderItem = orderItems.find((itemRef) => itemRef.id === donation.id || itemRef.path === donationRef.path);
            if (!matchingOrderItem) {
                throw new Error('Donation is no longer in this order');
            }

            const remainingItemCount = orderItems.filter((itemRef) => itemRef.id !== donation.id && itemRef.path !== donationRef.path).length;
            transaction.update(orderRef, {
                items: arrayRemove(donationRef),
                rejectedItems: arrayUnion(donationRef),
                status: remainingItemCount === 0 ? 'closed' : orderData.status,
                modifiedAt: serverTimestamp(),
                [`rejections.${donation.id}.action`]: resolution.action,
                [`rejections.${donation.id}.rejectedAt`]: serverTimestamp(),
                ...(resolution.action === 'requested' ? { [`rejections.${donation.id}.reservedFor`]: resolution.requestor } : {})
            });

            if (resolution.action === 'available') {
                transaction.update(donationRef, {
                    status: 'available',
                    requestor: null,
                    dateRequested: null,
                    modifiedAt: serverTimestamp()
                });
            } else if (resolution.action === 'requested') {
                if (!reassignedOrderRef) {
                    throw new Error('Unable to create reassigned order');
                }

                transaction.set(reassignedOrderRef, {
                    status: 'open',
                    requestor: resolution.requestor,
                    items: [donationRef],
                    rejectedItems: [],
                    createdAt: serverTimestamp(),
                    modifiedAt: serverTimestamp()
                });
                transaction.update(donationRef, {
                    status: 'requested',
                    requestor: resolution.requestor,
                    dateRequested: serverTimestamp(),
                    modifiedAt: serverTimestamp()
                });
            } else {
                transaction.update(donationRef, {
                    status: 'unavailable',
                    requestor: null,
                    modifiedAt: serverTimestamp()
                });
            }
        });
    } catch (error) {
        addErrorEvent('Error removing donation from order', error);
        throw error;
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
