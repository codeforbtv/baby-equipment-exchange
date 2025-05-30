// Modules
import {
    CollectionReference,
    DocumentData,
    DocumentReference,
    Query,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp,
    arrayUnion,
    collection,
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
import { DonationDetail, IDonationDetail } from '@/models/donation-detail';
import { DonationBody } from '@/types/post-data';
import { Image } from '@/models/image';
// Libs
import { db, getUserId, canReadDonations, getUserEmailById, addErrorEvent } from './firebase';
import { deleteImagesByRef, imageReferenceConverter } from './firebase-images';

// Imported constants
import { USERS_COLLECTION } from './firebase-users';

export const DONATIONS_COLLECTION = 'Donations';
export const DONATION_DETAILS_COLLECTION = 'DonationDetails';
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

const donationDetailsConverter = {
    toFirestore(donationDetail: DonationDetail): DocumentData {
        const donationDetailData: IDonationDetail = {
            donation: donationDetail.getDonation(),
            availability: donationDetail.getAvailability(),
            donor: donationDetail.getDonor(),
            tagNumber: donationDetail.getTagNumber(),
            tagNumberForItemDelivered: donationDetail.getTagNumberForItemDelivered(),
            sku: donationDetail.getSku(),
            recipientOrganization: donationDetail.getRecipientOrganization(),
            images: donationDetail.getImages(),
            daysInStorage: donationDetail.getDaysInStorage(),
            recipientContact: donationDetail.getRecipientContact(),
            recipientAddress: donationDetail.getRecipientAddress(),
            requestor: donationDetail.getRequestor(),
            storage: donationDetail.getStorage(),
            dateReceived: donationDetail.getDateReceived(),
            dateDistributed: donationDetail.getDateDistributed(),
            scheduledPickupDate: donationDetail.getScheduledPickupDate(),
            dateOrderFulfilled: donationDetail.getDateOrderFulfilled(),
            createdAt: donationDetail.getCreatedAt(),
            modifiedAt: donationDetail.getModifiedAt()
        };

        for (const key in donationDetailData) {
            if (donationDetailData[key] === undefined || donationDetailData[key] === null) {
                delete donationDetailData[key];
            }
        }

        return donationDetailData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): DonationDetail {
        const data = snapshot.data(options);
        const donationDetailData: IDonationDetail = {
            donation: data.donation,
            availability: data.availability,
            donor: data.donor,
            tagNumber: data.tagNumber,
            tagNumberForItemDelivered: data.tagNumberForItemDelivered,
            sku: data.sku,
            recipientOrganization: data.recipientOrganization,
            images: data.images,
            recipientContact: data.recipientContact,
            recipientAddress: data.recipientAddress,
            requestor: data.requestor,
            storage: data.storage,
            dateReceived: data.dateReceived,
            dateDistributed: data.dateDistributed,
            scheduledPickupDate: data.scheduledPickupDate,
            dateOrderFulfilled: data.dateOrderFulfilled,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        };
        return new DonationDetail(donationDetailData);
    }
};

/** Supplies donation item inventory to a user.
 *
 * Supplies donation item inventory to a user. In order to view donations a user has not
 * created themselves, a user must have a `can-read-donations` claim.
 *
 * To satisfy consecution, a query clause involving the `donor` field must only evaluate
 * if the `donor` field in a collection containing donation items is *equal* to
 * the calling client's current authenticated session.
 *
 * @filter An object that defines what kind(s) of donation items to return.
 * @return A Promise of a list of Donations, else a rejected promise.
 */
// export async function getDonations(filter: null | undefined): Promise<Donation[]> {
//     try {
//         const uid = await getUserId();
//         const hasClaimOnReadingDonations: boolean = await canReadDonations();
//         const userRef = doc(db, `${USERS_COLLECTION}/${uid}`);
//         // Claim: can-read-donations
//         // If a user has a claim on reading donations,
//         // consider all available documents within the collection.
//         const collectionRef = collection(db, DONATION_DETAILS_COLLECTION);
//         const conjunctions = [];
//         if (hasClaimOnReadingDonations !== true) {
//             // If an authenticated client, denoted by userRef,
//             // does not have a claim on reading donations,
//             // limit the result set to the donations a user account has submitted.
//             // (A note on consecution) any clause where `donor` is not equal to userRef,
//             // violates this method's defined behavior.
//             conjunctions.push(where('donor', '==', userRef));
//         }
//         const q = query(collectionRef, ...conjunctions).withConverter(donationDetailsConverter);
//         const donationDetailsSnapshot = await getDocs(q);
//         const donationDetails: DonationDetail[] = donationDetailsSnapshot.docs.map((doc: any) => doc.data());
//         const donations: Donation[] = [];
//         for (const donationDetail of donationDetails) {
//             const donationRef = donationDetail.getDonation().withConverter(donationConverter);
//             const donationSnapshot = await getDoc(donationRef);
//             if (donationSnapshot.exists()) {
//                 const donation = donationSnapshot.data();
//                 const imagesRef: DocumentReference<Image>[] = donation.getImages() as DocumentReference<Image>[];
//                 imagesRef.push(...(donationDetail.getImages() as DocumentReference<Image>[]));
//                 donation.images = await imageReferenceConverter(...imagesRef);
//                 donations.push(donation);
//             }
//         }
//         return donations;
//     } catch (error: any) {
//         addErrorEvent('getDonations', error);
//     }
//     return Promise.reject();
// }

export async function getDonations(): Promise<Donation[]> {
    try {
        let donations: Donation[] = [];
        const querySnapshot = await getDocs(collection(db, DONATIONS_COLLECTION).withConverter(donationConverter));
        querySnapshot.forEach((snapshot) => {
            donations.push(snapshot.data());
        });
        console.log(donations);
        return donations;
    } catch (error) {
        addErrorEvent('Get donations', error);
    }
    return Promise.reject();
}

async function _getDonations(...donationDetails: DonationDetail[]): Promise<Donation[]> {
    const donations: Donation[] = [];
    for (const donationDetail of donationDetails) {
        const donationRef = donationDetail.getDonation().withConverter(donationConverter);
        const donationSnapshot = await getDoc(donationRef);
        if (donationSnapshot.exists()) {
            const donation = donationSnapshot.data();
            const imagesRef: DocumentReference<Image>[] = donation.getImages() as DocumentReference<Image>[];
            imagesRef.push(...(donationDetail.getImages() as DocumentReference<Image>[]));
            donation.images = await imageReferenceConverter(...imagesRef);
            donations.push(donation);
        }
    }
    return donations;
}

export async function getDonationById(id: string): Promise<DonationDetail> {
    try {
        const uid = await getUserId();
        const userRef = doc(db, `${USERS_COLLECTION}/${uid}`);
        const hasClaimOnReadingDonations: boolean = await canReadDonations();
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);
        const donationDetailsCollectionRef = collection(db, DONATION_DETAILS_COLLECTION);
        const conjunctions = [where('donation', '==', donationRef)];
        //if user cannot read all donations, only fetch donation if it was donated by current user
        if (hasClaimOnReadingDonations !== true) {
            conjunctions.push(where('donor', '==', userRef));
        }

        const q = query(donationDetailsCollectionRef, ...conjunctions).withConverter(donationDetailsConverter);

        const donationDetailsSnapshot = await getDocs(q);
        const donationDetails: DonationDetail[] = donationDetailsSnapshot.docs.map((doc: any) => doc.data());

        if (donationDetails.length !== 1) {
            throw new Error('You are unauthorized to view this donation.');
        }

        let donation;
        const donationSnapshot = await getDoc(donationRef);
        if (donationSnapshot.exists()) {
            //handleDonationImages
            donation = donationSnapshot.data();
            const imagesRef: DocumentReference<Image>[] = donation.getImages() as DocumentReference<Image>[];
            imagesRef.push(...(donationDetails[0].getImages() as DocumentReference<Image>[]));
            donation.images = await imageReferenceConverter(...imagesRef);
        }

        if (donation) {
            const donationDetail: DonationDetail = donationDetails[0];

            return donationDetail;
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

export async function deleteDonationById(id: string) {
    try {
        await runTransaction(db, async (transaction) => {
            const uid = await getUserId();
            const userRef = doc(db, `${USERS_COLLECTION}/${uid}`);
            const hasClaimOnReadingDonations: boolean = await canReadDonations();
            const donationRef = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);
            const donationDetailsCollectionRef = collection(db, DONATION_DETAILS_COLLECTION);
            const conjunctions = [where('donation', '==', donationRef)];

            // if user cannot read all donations, only fetch donation if it was donated by current user
            // todo: should there be a seperate claim for deleting donations?
            if (hasClaimOnReadingDonations !== true) {
                conjunctions.push(where('donor', '==', userRef));
            }

            const q = query(donationDetailsCollectionRef, ...conjunctions).withConverter(donationDetailsConverter);

            const donationDetailsSnapshot = await getDocs(q);
            const donationDetails: DonationDetail[] = donationDetailsSnapshot.docs.map((doc: any) => doc.data());
            if (donationDetails.length !== 1) {
                throw new Error('You are unauthorized to delete this donation.');
            }

            const donationSnapshot = await getDoc(donationRef);
            if (donationSnapshot.exists()) {
                const donation = donationSnapshot.data();
                const imagesRef: DocumentReference<Image>[] = donation.getImages() as DocumentReference<Image>[];
                imagesRef.push(...(donationDetails[0].getImages() as DocumentReference<Image>[]));

                await deleteImagesByRef(...imagesRef);
            }

            transaction.delete(donationRef);
            transaction.delete(donationDetailsSnapshot.docs[0].ref);
        });
    } catch (error: any) {
        addErrorEvent('deleteDonationById', error);
    }
}

export async function getDonorEmailByDonationId(id: string): Promise<string> {
    try {
        const donationDetail = await getDonationById(id);
        const donorId = donationDetail.donor.id;
        const donorEmail = await getUserEmailById(donorId);
        return donorEmail;
    } catch (error: any) {
        addErrorEvent('getDonorByEmail', error);
    }
    return Promise.reject();
}
