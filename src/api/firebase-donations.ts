// Modules
import {
    CollectionReference,
    DocumentData,
    DocumentReference,
    Query,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    runTransaction,
    serverTimestamp,
    where
} from 'firebase/firestore';
// Models
import { Donation, IDonation } from '@/models/donation';
import { DonationDetail, IDonationDetail } from '@/models/donation-detail';
import { DonationBody } from '@/types/post-data';
import { Image } from '@/models/image';
// Libs
import { addEvent, canReadDonations, db, getUserId } from './firebase';
import { imageReferenceConverter } from './firebase-images';
// Imported constants
import { USERS_COLLECTION } from './firebase-users';

export const DONATIONS_COLLECTION = 'Donations';
export const DONATION_DETAILS_COLLECTION = 'DonationDetails';

const donationConverter = {
    toFirestore(donation: Donation): DocumentData {
        const donationData: IDonation = {
            id: donation.getId(),
            category: donation.getCategory(),
            brand: donation.getBrand(),
            model: donation.getModel(),
            description: donation.getDescription(),
            active: donation.getActive(),
            images: donation.getImages(),
            createdAt: donation.getCreatedAt(),
            modifiedAt: donation.getModifiedAt()
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
            category: data.category,
            brand: data.brand,
            model: data.model,
            description: data.description,
            active: data.active,
            images: data.images,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
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
export async function getDonations(filter: null | undefined): Promise<Donation[]> {
    try {
        const uid = await getUserId();
        const hasClaimOnReadingDonations: boolean = await canReadDonations();
        const userRef = doc(db, `${USERS_COLLECTION}/${uid}`);
        // Claim: can-read-donations
        // If a user has a claim on reading donations,
        // consider all available documents within the collection.
        const collectionRef = collection(db, DONATION_DETAILS_COLLECTION);
        const conjunctions = [];
        if (hasClaimOnReadingDonations !== true) {
            // If an authenticated client, denoted by userRef,
            // does not have a claim on reading donations,
            // limit the result set to the donations a user account has submitted.
            // (A note on consecution) any clause where `donor` is not equal to userRef,
            // violates this method's defined behavior.
            conjunctions.push(where('donor', '==', userRef));
        }
        const q = query(collectionRef, ...conjunctions).withConverter(donationDetailsConverter);
        const donationDetailsSnapshot = await getDocs(q);
        const donationDetails: DonationDetail[] = donationDetailsSnapshot.docs.map((doc: any) => doc.data());
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
    } catch (error: any) {
        addEvent({ location: 'api/firebase-donations', error: error });
    }
    return Promise.reject();
}

export async function addDonation(newDonation: DonationBody) {
    try {
        await runTransaction(db, async (transaction) => {
            // Generate document references with firebase-generated IDs
            const donationRef = doc(collection(db, DONATIONS_COLLECTION));
            const donationDetailRef = doc(collection(db, DONATION_DETAILS_COLLECTION));
            const userId: string = await getUserId();
            const donationParams: IDonation = {
                id: donationRef.id,
                category: newDonation.category,
                brand: newDonation.brand,
                model: newDonation.model,
                description: newDonation.description,
                active: false,
                images: [], // Only approved images display here.
                createdAt: serverTimestamp() as Timestamp,
                modifiedAt: serverTimestamp() as Timestamp
            };
            const donationDetailParams: IDonationDetail = {
                donation: donationRef,
                availability: undefined,
                donor: doc(db, `${USERS_COLLECTION}/${userId}`),
                tagNumber: undefined,
                tagNumberForItemDelivered: undefined,
                sku: undefined,
                recipientOrganization: undefined,
                images: newDonation.images,
                recipientContact: undefined,
                recipientAddress: undefined,
                requestor: undefined,
                storage: undefined,
                dateReceived: undefined,
                dateDistributed: undefined,
                scheduledPickupDate: undefined,
                dateOrderFulfilled: undefined,
                createdAt: serverTimestamp() as Timestamp,
                modifiedAt: serverTimestamp() as Timestamp
            };
            const donation = new Donation(donationParams);
            const donationDetail = new DonationDetail(donationDetailParams);
            transaction.set(donationRef, donationConverter.toFirestore(donation));
            transaction.set(donationDetailRef, donationDetailsConverter.toFirestore(donationDetail));
        });
    } catch (error: any) {
        const keys: any[] = [];
        for (const key in error) {
            keys.push(key);
        }
        addEvent({ location: 'addDonation', keys: keys });
    }
}
