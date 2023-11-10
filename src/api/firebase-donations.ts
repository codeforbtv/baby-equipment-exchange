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
    Timestamp
} from 'firebase/firestore'
//Models
import { Donation, IDonation } from '@/models/donation'
import { DonationDetail, IDonationDetail } from '@/models/donation-detail'
import { DonationForm } from '@/types/post-data'
//Libs
import { getDb, getUserId } from './firebase'
import { addEvent } from './firebase-admin'

const DONATIONS_COLLECTION = 'Donations'
const DONATION_DETAILS_COLLECTION = 'DonationDetails'

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

export async function getDonations(): Promise<Donation[]> {
    const q = query(collection(getDb(), DONATIONS_COLLECTION)).withConverter(donationConverter)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
}

export async function getActiveDonations(): Promise<Donation[]> {
    const q = query(collection(getDb(), DONATIONS_COLLECTION), where('active', '==', true)).withConverter(donationConverter)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
}

export async function addDonation(newDonation: DonationForm) {
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
            donation: userId,
            availability: undefined,
            donor: userId,
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
                donationDetail.setDonation(donationRef.id)

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
