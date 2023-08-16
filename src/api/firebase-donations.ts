//Modules
import { DocumentData, collection, getDocs, query, where, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
//Models
import { Donation } from '../models/donation';
//Libs
import { getDb } from './firebase';

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

export async function getActiveDonations(): Promise<Donation[]> {
    const q = query(collection(getDb(), 'donations'), where('active', '==', true)).withConverter(donationConverter);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
}
