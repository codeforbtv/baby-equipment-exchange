//Modules
import {
    DocumentData,
    collection,
    getDocs,
    query,
    where,
    QueryDocumentSnapshot,
    SnapshotOptions,
    doc,
    runTransaction,
    serverTimestamp,
    Timestamp,
    getDoc,
    DocumentReference
} from 'firebase/firestore'
//Models
import { Donation, IDonation } from '@/models/donation'
import { DonationDetail, IDonationDetail } from '@/models/donation-detail'
import { DonationBody } from '@/types/post-data'
import { Image } from '@/models/image'
//Libs
import { getDb, getUserId } from './firebase'
import { addEvent } from './firebase-admin'
import { USERS_COLLECTION } from './firebase-users'
import { imageReferenceConverter } from './firebase-images'

export const DONATIONS_COLLECTION = 'Donations'
export const DONATION_DETAILS_COLLECTION = 'DonationDetails'

const donationConverter = {
    toFirestore(donation: Donation): DocumentData {
        const donationData: IDonation = {
            category: donation.getCategory(),
            brand: donation.getBrand(),
            model: donation.getModel(),
            description: donation.getDescription(),
            active: donation.getActive(),
            images: donation.getImages(),
            createdAt: donation.getCreatedAt(),
            modifiedAt: donation.getModifiedAt()
        }
        for (const key in donationData) {
            if (donationData[key] === undefined || donationData[key] === null) {
                delete donationData[key]
            }
        }
        return donationData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Donation {
        const data = snapshot.data(options)
        const donationData: IDonation = {
            category: data.category,
            brand: data.brand,
            model: data.model,
            description: data.description,
            active: data.active,
            images: data.images,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        }
        return new Donation(donationData)
    }
}

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
        }

        for (const key in donationDetailData) {
            if (donationDetailData[key] === undefined || donationDetailData[key] === null) {
                delete donationDetailData[key]
            }
        }

        return donationDetailData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): DonationDetail {
        const data = snapshot.data(options)
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
        }
        return new DonationDetail(donationDetailData)
    }
}

export async function getAllDonations(): Promise<Donation[]> {
    const donationDetailsRef = collection(getDb(), DONATION_DETAILS_COLLECTION).withConverter(donationDetailsConverter)
    const donationDetailsSnapshot = (await getDocs(donationDetailsRef))
    const donationDetails: DonationDetail[] = donationDetailsSnapshot.docs.map((doc) => doc.data())
    return await _getDonations(...donationDetails)
}

export async function getActiveDonations(): Promise<Donation[]> {
    const activeDonationDetailsQuery = query(collection(getDb(), DONATION_DETAILS_COLLECTION), where('active', '==', true)).withConverter(donationDetailsConverter)
    const donationDetailsSnapshot = await getDocs(activeDonationDetailsQuery)
    const donationDetails: DonationDetail[] = donationDetailsSnapshot.docs.map((doc) => doc.data())
    return await _getDonations(...donationDetails)
}

export async function getDonations(): Promise<Donation[]> {
    const uid = await getUserId()
    const userRef = doc(getDb(), `${USERS_COLLECTION}/${uid}`)
    const donationDetailsQuery = query(collection(getDb(), DONATION_DETAILS_COLLECTION), where('donor', '==', userRef)).withConverter(donationDetailsConverter)
    const donationDetailsSnapshot = await getDocs(donationDetailsQuery)
    const donationDetails: DonationDetail[] = donationDetailsSnapshot.docs.map((doc) => doc.data())
    return await _getDonations(...donationDetails)
}

async function _getDonations(...donationDetails: DonationDetail[]): Promise<Donation[]> {
    const donations: Donation[] = []
    for (const donationDetail of donationDetails) {
        const donationRef = donationDetail.getDonation().withConverter(donationConverter)
        const donationSnapshot = await getDoc(donationRef)
        if (donationSnapshot.exists()) {
            const donation = donationSnapshot.data()
            const imagesRef: DocumentReference<Image>[] = donation.getImages() as DocumentReference<Image>[]
            imagesRef.push(...donationDetail.getImages() as DocumentReference<Image>[])
            donation.images = await imageReferenceConverter(...imagesRef)
            donations.push(donation)
        }
    }
    return donations
}

export async function addDonation(newDonation: DonationBody) {
    try {
        const userId: string = await getUserId()
        const donationParams: IDonation = {
            category: newDonation.category,
            brand: newDonation.brand,
            model: newDonation.model,
            description: newDonation.description,
            active: false,
            images: [], // Only approved images display here.
            createdAt: serverTimestamp() as Timestamp,
            modifiedAt: serverTimestamp() as Timestamp
        }

        const donationDetailParams: IDonationDetail = {
            donation: doc(getDb(), `${DONATIONS_COLLECTION}/${userId}`),
            availability: undefined,
            donor: doc(getDb(), `${USERS_COLLECTION}/${userId}`),
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
        }

        const donation = new Donation(donationParams)
        const donationDetail = new DonationDetail(donationDetailParams)

        try {
            await runTransaction(getDb(), async (transaction) => {
                // Generate document references with firebase-generated IDs
                const donationRef = doc(collection(getDb(), DONATIONS_COLLECTION))
                const donationDetailRef = doc(collection(getDb(), DONATION_DETAILS_COLLECTION))
                // Assign donation reference to donation detail
                donationDetail.setDonation(donationRef)

                transaction.set(donationRef, donationConverter.toFirestore(donation))

                transaction.set(donationDetailRef, donationDetailsConverter.toFirestore(donationDetail))
            })
        } catch (error) {
            // eslint-disable-line no-empty
        }
    } catch (error) {
        addEvent(newDonation)
    }
}
