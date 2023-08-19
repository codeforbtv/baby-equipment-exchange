//Modules
import { DocumentData, collection, getDocs, query, where, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
//Models
import { Donation } from '../models/donation';
//Libs
import { getDb } from './firebase';
import { DonationDetail } from '@/models/donation-detail';

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
        };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Donation {
        const data = snapshot.data(options);
        return new Donation(data.category, data.brand, data.model, data.description, data.active, data.images, data.createdAt, data.modifiedAt);
    }
};

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
            dateRecieved: donationDetail.getDateRecieved(),
            dateDistributed: donationDetail.getDateDistributed(),
            scheduledPickupDate: donationDetail.getScheduledPickupDate(),
            dateOrderFulfilled: donationDetail.getDateOrderFulfilled(),
            createdAt: donationDetail.getCreatedAt(),
            modifiedAt: donationDetail.getModifiedAt()
        };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): DonationDetail {
        const data = snapshot.data(options);
        return new DonationDetail(data.donation, data.availability, data.donor, data.tagNumber, data.tagNumberForItemDelivered, data.sku, data.recipientOrganization, data.images, data.daysInStorage, data.recipientContact, data.recipientAddress, data.requestor, data.storage, data.dateRecieved, data.dateDistributed, data.scheduledPickupDate, data.dateOrderFulfilled, data.createdAt, data.modifiedAt);
    }
}

export async function getActiveDonations(): Promise<Donation[]> {
    const q = query(collection(getDb(), 'donations'), where('active', '==', true)).withConverter(donationConverter);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
}
