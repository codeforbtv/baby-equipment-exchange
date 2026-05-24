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
import { AdminDonationBody } from '@/types/DonationTypes';
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

type AcceptedDonationUpdate = {
    id: string;
    category: string;
    ref: DocumentReference;
    tagNumber: string;
};

async function getCategoryRefByName(category: string): Promise<DocumentReference> {
    const categoryName = category.trim();
    if (!categoryName) {
        throw new Error('Category not found: donation category is empty.');
    }

    const categoryQuery = query(collection(db, CATEGORIES_COLLECTION), where('name', '==', categoryName));
    const categorySnapshot = await getDocs(categoryQuery);
    const categoryRef = categorySnapshot.docs[0]?.ref;
    if (!categoryRef) {
        throw new Error(`Category not found: "${categoryName}". No matching category exists.`);
    }
    if (categorySnapshot.docs.length > 1) {
        throw new Error(`Category "${categoryName}" is duplicated. Tag assignment requires a single matching category.`);
    }
    return categoryRef;
}

function getValidatedCategoryTagData(category: string, categoryRef: DocumentReference, categoryData: DocumentData): CategoryTagData {
    const tagCount = Number(categoryData.tagCount ?? 0);
    const tagPrefix = String(categoryData.tagPrefix ?? '').trim();

    if (!Number.isFinite(tagCount) || !Number.isInteger(tagCount) || tagCount < 0) {
        // Category has an invalid tag count
    }
    if (!tagPrefix) {
        // Category has an empty tag prefix
    }

    return {
        ref: categoryRef,
        tagCount,
        tagPrefix
    };
}

function getDonationRef(id: string): DocumentReference {
    return doc(db, DONATIONS_COLLECTION, id);
}

function getDonationRefs(ids: string[]): DocumentReference[] {
    return Array.from(new Set(ids)).map(getDonationRef);
}

function getOrderDonationRefs(order: Order): DocumentReference[] {
    return getDonationRefs(order.items.map((item) => item.id));
}

function isActiveOrderItemStatus(status: unknown): boolean {
    return status === 'requested' || status === 'reserved';
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

export async function getAllInventory(): Promise<InventoryItem[]> {
    try {
        const inventory: InventoryItem[] = [];
        const collectionRef = collection(db, DONATIONS_COLLECTION).withConverter(inventoryConverter);
        const querySnapshot = await getDocs(collectionRef);
        querySnapshot.forEach((snapshot) => {
            inventory.push(snapshot.data());
        });
        return inventory;
    } catch (error) {
        addErrorEvent('Get all inventory', error);
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
            // At least one donation should be required
        }
        if (orderId && !requestor) {
            // Requestor should be required when adding donations to an order
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
                categoryDataByName.set(category, getValidatedCategoryTagData(category, ref, categoryDoc.data()));
            }

            if (orderRef && requestor && orderId) {
                const orderDoc = await transaction.get(orderRef);
                if (!orderDoc.exists()) {
                    throw new Error(`Order ${orderId} not found.`);
                }
                if (orderDoc.data().status !== 'open') {
                    throw new Error(`Order ${orderId} is not open.`);
                }
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

export async function updateDonationWithGeneratedTagNumber(id: string, category: string, donationDetails: any): Promise<string> {
    try {
        const categoryName = category.trim();
        const categoryRef = await getCategoryRefByName(categoryName);
        const donationRef = doc(db, DONATIONS_COLLECTION, id);

        return await runTransaction(db, async (transaction) => {
            const categoryDoc = await transaction.get(categoryRef);
            const donationDoc = await transaction.get(donationRef);

            if (!categoryDoc.exists()) {
                throw new Error(`Category not found: "${categoryName}". No matching category exists.`);
            }
            if (!donationDoc.exists()) {
                throw new Error(`Donation ${id} not found.`);
            }

            const categoryData = getValidatedCategoryTagData(categoryName, categoryRef, categoryDoc.data());
            const newTagCount = categoryData.tagCount + 1;
            const tagNumber = `${categoryData.tagPrefix} ${newTagCount}`.trim();
            const detailsToUpdate = { ...donationDetails };
            delete detailsToUpdate.tagNumber;
            delete detailsToUpdate.category;

            transaction.update(categoryRef, {
                tagCount: newTagCount,
                modifiedAt: serverTimestamp()
            });
            transaction.update(donationRef, {
                ...detailsToUpdate,
                category: categoryName,
                tagNumber,
                modifiedAt: serverTimestamp()
            });

            return tagNumber;
        });
    } catch (error) {
        addErrorEvent('Error updating donation with generated tag number', error);
        throw error;
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
        const acceptedDonations = Array.from(
            new Map(
                params.acceptedDonations.map((donation) => [
                    donation.id,
                    {
                        ...donation,
                        category: donation.category.trim()
                    }
                ])
            ).values()
        );
        const acceptedDonationIds = new Set(acceptedDonations.map((donation) => donation.id));
        const rejectedDonationIds = [...new Set(params.rejectedDonationIds)];
        const rejectedDonationIdSet = new Set(rejectedDonationIds);

        for (const acceptedDonationId of acceptedDonationIds) {
            if (rejectedDonationIdSet.has(acceptedDonationId)) {
                // Donation cannot be both accepted and rejected
            }
        }

        const uniqueCategories = [...new Set(acceptedDonations.map((donation) => donation.category))];
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

                categoryDataByName.set(category, getValidatedCategoryTagData(category, categoryRef, categoryDoc.data()));
            }

            const acceptedDonationUpdates: AcceptedDonationUpdate[] = [];
            for (const donation of acceptedDonations) {
                const donationRef = doc(db, DONATIONS_COLLECTION, donation.id);
                const donationDoc = await transaction.get(donationRef);
                if (!donationDoc.exists()) {
                    throw new Error(`Donation ${donation.id} not found.`);
                }

                const donationData = donationDoc.data();
                if (donationData.status !== 'in processing') {
                    // Donation is no longer pending approval
                }
                if (donationData.tagNumber) {
                    // Donation already has tag number
                }

                const categoryData = categoryDataByName.get(donation.category);
                if (!categoryData) {
                    throw new Error(`Category not found: "${donation.category}". No matching category exists.`);
                }

                categoryData.tagCount += 1;
                acceptedDonationUpdates.push({
                    id: donation.id,
                    category: donation.category,
                    ref: donationRef,
                    tagNumber: `${categoryData.tagPrefix} ${categoryData.tagCount}`.trim()
                });
            }

            const rejectedDonationRefs = rejectedDonationIds.map((donationId) => doc(db, DONATIONS_COLLECTION, donationId));
            for (let index = 0; index < rejectedDonationRefs.length; index++) {
                const rejectedDonationDoc = await transaction.get(rejectedDonationRefs[index]);
                if (!rejectedDonationDoc.exists()) {
                    // Donation not found
                }

                const rejectedDonationData = rejectedDonationDoc.data();
                if (rejectedDonationData!.status !== 'in processing') {
                    // Donation is no longer pending approval
                }
            }

            categoryDataByName.forEach((categoryData) => {
                transaction.update(categoryData.ref, {
                    tagCount: categoryData.tagCount,
                    modifiedAt: serverTimestamp()
                });
            });

            acceptedDonationUpdates.forEach((donation) => {
                transaction.update(donation.ref, {
                    status: 'pending delivery',
                    dateAccepted: serverTimestamp(),
                    tagNumber: donation.tagNumber,
                    schedulingLink: params.schedulingLink ?? null,
                    schedulingEmailSentAt: params.schedulingLink ? serverTimestamp() : null,
                    modifiedAt: serverTimestamp()
                });
            });

            rejectedDonationRefs.forEach((donationRef) => {
                transaction.update(donationRef, {
                    status: 'rejected',
                    modifiedAt: serverTimestamp()
                });
            });

            return acceptedDonationUpdates.map((donation) => ({
                id: donation.id,
                tagNumber: donation.tagNumber
            }));
        });
    } catch (error) {
        addErrorEvent('updateDropOffDonationStatuses', error);
        throw error;
    }
}

export async function schedulePickupForOrder(order: Order, schedulingLink?: string): Promise<void> {
    try {
        if (order.items.length === 0) {
            // Order has no items to schedule
        }

        const orderRef = doc(db, ORDERS_COLLECTION, order.id);
        const itemRefs = getOrderDonationRefs(order);
        const schedulingFields = schedulingLink
            ? {
                schedulingLink,
                schedulingEmailSentAt: serverTimestamp()
            }
            : {};

        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                throw new Error(`Order ${order.id} not found.`);
            }

            const orderData = orderDoc.data();
            if (orderData.status !== 'open') {
                // Order is not open
            }

            const currentOrderItemPaths = new Set(((orderData.items ?? []) as DocumentReference[]).map((itemRef) => itemRef.path));
            const itemRefsToSchedule: DocumentReference[] = [];
            for (const itemRef of itemRefs) {
                if (!currentOrderItemPaths.has(itemRef.path)) {
                    // Donation is no longer in order
                }

                const itemDoc = await transaction.get(itemRef);
                if (!itemDoc.exists()) {
                    throw new Error(`Donation ${itemRef.id} not found.`);
                }

                const itemData = itemDoc.data();
                if (itemData.status === 'distributed') {
                    continue;
                }
                if (itemData.status !== 'requested' && itemData.status !== 'reserved') {
                    // Donation should not be scheduled from status "requested" or "reserved"
                }
                itemRefsToSchedule.push(itemRef);
            }

            itemRefsToSchedule.forEach((itemRef) => {
                transaction.update(itemRef, {
                    status: 'reserved',
                    ...schedulingFields,
                    modifiedAt: serverTimestamp()
                });
            });

            transaction.update(orderRef, {
                modifiedAt: serverTimestamp()
            });
        });
    } catch (error) {
        addErrorEvent('schedulePickupForOrder', error);
        throw error;
    }
}

export async function cancelOrderAndReturnItems(order: Order): Promise<void> {
    try {
        const orderRef = doc(db, ORDERS_COLLECTION, order.id);
        const itemRefs = getOrderDonationRefs(order);

        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                throw new Error(`Order ${order.id} not found.`);
            }

            const orderData = orderDoc.data();
            if (orderData.status !== 'open') {
                // Order should be open
            }

            const currentOrderItemPaths = new Set(((orderData.items ?? []) as DocumentReference[]).map((itemRef) => itemRef.path));
            const itemRefsInOrder = itemRefs.filter((itemRef) => currentOrderItemPaths.has(itemRef.path));
            const itemRefsToReturn: DocumentReference[] = [];

            for (const itemRef of itemRefsInOrder) {
                const itemDoc = await transaction.get(itemRef);
                if (!itemDoc.exists()) {
                    throw new Error(`Donation ${itemRef.id} not found.`);
                }

                const itemData = itemDoc.data();
                if (isActiveOrderItemStatus(itemData.status)) {
                    itemRefsToReturn.push(itemRef);
                }
            }

            itemRefsToReturn.forEach((itemRef) => {
                transaction.update(itemRef, {
                    status: 'unavailable',
                    requestor: null,
                    schedulingLink: null,
                    schedulingEmailSentAt: null,
                    modifiedAt: serverTimestamp()
                });
            });

            const orderUpdates: Record<string, unknown> = {
                status: 'closed',
                modifiedAt: serverTimestamp()
            };
            transaction.update(orderRef, {
                ...orderUpdates
            });
        });
    } catch (error) {
        addErrorEvent('cancelOrderAndReturnItems', error);
        throw error;
    }
}

export async function returnOrderDonationToInventory(donationId: string): Promise<void> {
    try {
        const donationRef = getDonationRef(donationId);
        const openOrdersQuery = query(collection(db, ORDERS_COLLECTION), where('status', '==', 'open'), where('items', 'array-contains', donationRef));
        const openOrdersSnapshot = await getDocs(openOrdersQuery);
        const openOrderRefs = openOrdersSnapshot.docs.map((orderDoc) => orderDoc.ref);

        await runTransaction(db, async (transaction) => {
            const donationDoc = await transaction.get(donationRef);
            if (!donationDoc.exists()) {
                throw new Error(`Donation ${donationId} not found.`);
            }

            const existingOrderRefs: DocumentReference[] = [];
            for (const orderRef of openOrderRefs) {
                const orderDoc = await transaction.get(orderRef);
                if (orderDoc.exists()) {
                    existingOrderRefs.push(orderRef);
                }
            }

            existingOrderRefs.forEach((orderRef) => {
                transaction.update(orderRef, {
                    modifiedAt: serverTimestamp()
                });
            });

            transaction.update(donationRef, {
                status: 'unavailable',
                requestor: null,
                schedulingLink: null,
                schedulingEmailSentAt: null,
                modifiedAt: serverTimestamp()
            });
        });
    } catch (error) {
        addErrorEvent('returnOrderDonationToInventory', error);
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
            if (!donation || donation.status !== 'available') {
                unavailableDonations.push(id);
            }
        }
        return unavailableDonations;
    } catch (error) {
        addErrorEvent('Admin are donations available', error);
    }
    return Promise.reject();
}

export async function requestInventoryItems(inventoryItemIds: string[], user: { id: string; name: string; email: string }): Promise<void> {
    try {
        const inventoryItemRefs = getDonationRefs(inventoryItemIds);
        const orderRef = doc(collection(db, ORDERS_COLLECTION));

        await runTransaction(db, async (transaction) => {
            for (const inventoryItemRef of inventoryItemRefs) {
                const inventoryItemDoc = await transaction.get(inventoryItemRef);
                if (!inventoryItemDoc.exists()) {
                    throw new Error(`Donation ${inventoryItemRef.id} not found.`);
                }
                const inventoryItemData = inventoryItemDoc.data();
                if (inventoryItemData.status !== 'available') {
                    // Donation is not available.
                    continue;
                }
            }

            transaction.set(orderRef, {
                status: 'open',
                requestor: user,
                items: inventoryItemRefs,
                rejectedItems: [],
                createdAt: serverTimestamp(),
                modifiedAt: serverTimestamp()
            });

            inventoryItemRefs.forEach((inventoryItemRef) => {
                transaction.update(inventoryItemRef, {
                    status: 'requested',
                    requestor: user,
                    dateRequested: serverTimestamp(),
                    modifiedAt: serverTimestamp()
                });
            });
        });
    } catch (error) {
        addErrorEvent('Request inventory items', error);
        throw error;
    }
}

export async function adminRequestInventoryItems(inventoryItemIds: string[], user: { id: string; name: string; email: string }): Promise<Order> {
    try {
        const inventoryItemRefs = getDonationRefs(inventoryItemIds);
        const orderRef = doc(collection(db, ORDERS_COLLECTION));

        await runTransaction(db, async (transaction) => {
            for (const inventoryItemRef of inventoryItemRefs) {
                const inventoryItemDoc = await transaction.get(inventoryItemRef);
                if (!inventoryItemDoc.exists()) {
                    throw new Error(`Donation ${inventoryItemRef.id} not found.`);
                }
                const inventoryItemData = inventoryItemDoc.data();
                if (inventoryItemData.status !== 'available') {
                    // Donation is not available.
                    continue;
                }
            }

            transaction.set(orderRef, {
                status: 'open',
                requestor: user,
                items: inventoryItemRefs,
                rejectedItems: [],
                createdAt: serverTimestamp(),
                modifiedAt: serverTimestamp()
            });

            inventoryItemRefs.forEach((inventoryItemRef) => {
                transaction.update(inventoryItemRef, {
                    status: 'requested',
                    requestor: user,
                    dateRequested: serverTimestamp(),
                    modifiedAt: serverTimestamp()
                });
            });
        });

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
                if (donationDetails.exists()) {
                    const donationData = donationDetails.data() as Donation;
                    if (donationData.status === 'requested') {
                        order.items.push(donationData);
                    }
                } else {
                    console.warn(`Order ${doc.id}: referenced donation ${donation.id} not found, skipping`);
                }
            }
            if (orderInfo.rejectedItems) {
                for (const donation of orderInfo.rejectedItems) {
                    const donationDetails = await getDoc(donation);
                    if (donationDetails.exists()) {
                        order.rejectedItems?.push(donationDetails.data() as Donation);
                    } else {
                        console.warn(`Order ${doc.id}: referenced rejected donation ${donation.id} not found, skipping`);
                    }
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
                if (donationDetails.exists()) {
                    order.items.push(donationDetails.data() as Donation);
                } else {
                    console.warn(`Order ${id}: referenced donation ${donation.id} not found, skipping`);
                }
            }
            if (orderInfo.rejectedItems) {
                for (const donation of orderInfo.rejectedItems) {
                    const donationDetails = await getDoc(donation);
                    if (donationDetails.exists()) {
                        order.rejectedItems?.push(donationDetails.data() as Donation);
                    } else {
                        console.warn(`Order ${id}: referenced rejected donation ${donation.id} not found, skipping`);
                    }
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

// Removes rejected donation from order, add to rejectedItems array, and changes status to 'unavailable'.
export async function removeDonationFromOrder(orderId: string, donation: Donation): Promise<void> {
    try {
        const orderRef = doc(db, `${ORDERS_COLLECTION}/${orderId}`);
        const donationRef = getDonationRef(donation.id);

        await runTransaction(db, async (transaction) => {
            const orderSnapshot = await transaction.get(orderRef);
            if (!orderSnapshot.exists()) {
                throw new Error(`Order ${orderId} not found`);
            }

            const orderData = orderSnapshot.data();
            if (orderData.status !== 'open') {
                // Order is not open
            }

            const currentItems = (orderData.items ?? []) as DocumentReference[];
            if (!currentItems.some((itemRef) => itemRef.path === donationRef.path)) {
                // Donation is no longer in order
            }

            const donationDoc = await transaction.get(donationRef);
            if (!donationDoc.exists()) {
                throw new Error(`Donation ${donation.id} not found.`);
            }

            const donationData = donationDoc.data();
            if (!isActiveOrderItemStatus(donationData.status)) {
                // Donation cannot be removed from order from non-active status
            }

            let hasActiveRemainingItem = false;
            for (const itemRef of currentItems) {
                if (itemRef.path === donationRef.path) {
                    continue;
                }

                const itemDoc = await transaction.get(itemRef);
                if (itemDoc.exists() && isActiveOrderItemStatus(itemDoc.data().status)) {
                    hasActiveRemainingItem = true;
                    break;
                }
            }

            const orderUpdates: Record<string, unknown> = {
                rejectedItems: arrayUnion(donationRef),
                modifiedAt: serverTimestamp()
            };

            if (!hasActiveRemainingItem) {
                orderUpdates.status = 'closed';
            }

            transaction.update(orderRef, orderUpdates);
            transaction.update(donationRef, {
                status: 'unavailable',
                requestor: null,
                modifiedAt: serverTimestamp()
            });
        });
    } catch (error) {
        addErrorEvent('Error removing donation from order', error);
        throw error;
    }
}

//Marks donation as distributed and adds it to user's and organization's distributed items list
export async function markDonationAsDistributed(donation: Donation): Promise<void> {
    try {
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${donation.id}`);
        const openOrdersQuery = query(collection(db, ORDERS_COLLECTION), where('status', '==', 'open'), where('items', 'array-contains', donationRef));
        const openOrdersSnapshot = await getDocs(openOrdersQuery);
        const openOrderRefs = openOrdersSnapshot.docs.map((orderDoc) => orderDoc.ref);

        await runTransaction(db, async (transaction) => {
            const donationDoc = await transaction.get(donationRef);
            if (!donationDoc.exists()) {
                throw new Error(`Donation ${donation.id} not found.`);
            }

            const donationData = donationDoc.data();
            if (donationData.status === 'distributed') {
                // Donation is already distributed
            }
            if (donationData.status !== 'reserved') {
                // Donation cannot be distributed from non-reserved status
            }
            if (!donationData.requestor?.id) {
                // Donation does not have a requestor
            }

            const requestorRef = doc(db, `${USERS_COLLECTION}/${donationData.requestor.id}`);
            const requestorSnapshot = await transaction.get(requestorRef);
            if (!requestorSnapshot.exists()) {
                throw new Error(`Requestor ${donationData.requestor.id} not found.`);
            }

            const requestor = requestorSnapshot.data();
            const orgId = requestor.organization?.id;
            if (!orgId) {
                throw new Error(`Requestor ${donationData.requestor.id} does not have an organization.`);
            }

            const organizationRef = doc(db, ORGANIZATIONS_COLLECTION, orgId);
            const organizationSnapshot = await transaction.get(organizationRef);
            if (!organizationSnapshot.exists()) {
                throw new Error(`Organization ${orgId} not found.`);
            }

            const openOrderUpdates: { ref: DocumentReference; shouldClose: boolean }[] = [];
            for (const orderRef of openOrderRefs) {
                const orderDoc = await transaction.get(orderRef);
                if (!orderDoc.exists()) {
                    continue;
                }

                const orderData = orderDoc.data();
                let hasActiveRemainingItem = false;
                for (const itemRef of (orderData.items ?? []) as DocumentReference[]) {
                    if (itemRef.path === donationRef.path) {
                        continue;
                    }

                    const itemDoc = await transaction.get(itemRef);
                    if (itemDoc.exists() && isActiveOrderItemStatus(itemDoc.data().status)) {
                        hasActiveRemainingItem = true;
                        break;
                    }
                }
                openOrderUpdates.push({
                    ref: orderRef,
                    shouldClose: !hasActiveRemainingItem
                });
            }

            const orgName = organizationSnapshot.data().name;
            const distributedItem = {
                id: donation.id,
                tagNumber: donationData.tagNumber
            };

            transaction.update(donationRef, {
                status: 'distributed',
                distributor: {
                    id: donationData.requestor.id,
                    name: donationData.requestor.name,
                    email: donationData.requestor.email,
                    organization: orgName
                },
                modifiedAt: serverTimestamp(),
                dateDistributed: serverTimestamp()
            });
            transaction.update(requestorRef, {
                distributedItems: arrayUnion(distributedItem),
                modifiedAt: serverTimestamp()
            });
            transaction.update(organizationRef, {
                distributedItems: arrayUnion(distributedItem),
                modifiedAt: serverTimestamp()
            });
            openOrderUpdates.forEach((orderUpdate) => {
                const updates: Record<string, unknown> = {
                    modifiedAt: serverTimestamp()
                };
                if (orderUpdate.shouldClose) {
                    updates.status = 'closed';
                }
                transaction.update(orderUpdate.ref, updates);
            });
        });
    } catch (error) {
        addErrorEvent('Error marking donation as distributed', error);
        throw error;
    }
}
