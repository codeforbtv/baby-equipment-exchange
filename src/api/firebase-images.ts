//Modules
import { DocumentData, QueryDocumentSnapshot, collection, doc, getDoc, SnapshotOptions, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
//Models
import { Image } from '../models/image';
//Libs
import { getDb, getFirebaseStorage } from './firebase';
import { ref, uploadBytes } from 'firebase/storage';

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

export async function uploadImages(files: FileList): Promise<Array<string> | undefined> {
    let storedFilenames = new Array<string>();
    const storage = getFirebaseStorage();
    for (const file of files) {
        const currentTime = Date.now();
        const extension = '.' + /[^\.]*$/.exec(file.name)![0];
        const fileSize = file.size;
        const fileType = file.type;
        const timestamp = Timestamp.fromMillis(currentTime);
        const storageFilename = `${uuidv4()}-${currentTime}${extension}`;

        // todo: Validate file size
        // todo: Validate type
        const fileData: ArrayBuffer = await file.arrayBuffer();
        const storageRef = ref(storage, storageFilename);

        await uploadBytes(storageRef, fileData);
        storedFilenames.push(storageFilename);
    }
    return storedFilenames;
}

export async function getImage(id: string): Promise<Image | undefined> {
    const imagesRef = collection(getDb(), 'images');
    const documentRef = doc(imagesRef, id).withConverter(imageConverter);
    const snapshot = await getDoc(documentRef);
    return snapshot.data() as Image;
}
