//Modules
import { DocumentData, collection, getDocs, query, where, QueryDocumentSnapshot, SnapshotOptions, getFirestore, doc } from 'firebase/firestore'
//Models
import { Donation, IDonation } from '../models/donation'
//Libs
import { getDb } from './firebase'
import { DonationDetail, IDonationDetail } from '@/models/donation-detail'

const DONATIONS_COLLECTION = 'Donations'
const DONATION_DETAILS_COLLECTION = 'DonationDetails'

const donationConverter = {
    toFirestore(donation: Donation): DocumentData {
        return {
            category: donation.getCategory(),
            brand: donation.getBrand(),
            model: donation.getModel(),
            description: donation.getDescription(),
            active: donation.getActive(),
            images: donation.getImages(),
            createdAt: donation.getCreatedAt(),
            modifiedAt: donation.getModifiedAt()
        }
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
        return {
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

export async function getActiveDonations(): Promise<Donation[]> {
    const q = query(collection(getDb(), 'donations'), where('active', '==', true)).withConverter(donationConverter)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
}
