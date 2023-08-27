import { DocumentData, QueryDocumentSnapshot, collection, doc, getDoc, SnapshotOptions } from 'firebase/firestore';
import { Image } from '../models/image';
import { getDb } from './firebase';

const imageConverter = {
    toFirestore(image: Image): DocumentData {
        return {
            downloadURL: image.getDownloadURL(),
            createdAt: image.getCreatedAt(),
            modifiedAt: image.getModifiedAt()
        };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Image {
        const data = snapshot.data(options)!;
        return new Image(data.downloadURL, data.createdAt, data.modifiedAt);
    }
};

export async function getImage(id: string): Promise<Image | undefined> {
    const imagesRef = collection(getDb(), 'images');
    const documentRef = doc(imagesRef, id).withConverter(imageConverter);
    const snapshot = await getDoc(documentRef);
    return snapshot.data() as Image;
}
