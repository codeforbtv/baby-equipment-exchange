// Modules
import {
    collection,
    deleteDoc,
    doc,
    DocumentData,
    DocumentReference,
    getDoc,
    getDocs,
    query,
    QueryDocumentSnapshot,
    SnapshotOptions,
    where
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
// Libs
import { db, storage, addErrorEvent } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Models
import { IImage, Image } from '@/models/image';
import { getUserId } from './firebase-users';

const IMAGES_COLLECTION = 'Images';
const IMAGE_DETAILS_COLLECTION = 'ImageDetails';

const imageConverter = {
    toFirestore(image: Image): DocumentData {
        const imageData: IImage = {
            uploadedBy: image.getUploadedBy(),
            downloadURL: image.getDownloadURL(),
            createdAt: image.getCreatedAt(),
            modifiedAt: image.getModifiedAt()
        };

        for (const key in imageData) {
            if (imageData[key] === undefined || imageData[key] === null) {
                delete imageData[key];
            }
        }

        return imageData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Image {
        const data = snapshot.data(options)!;
        const imageData: IImage = {
            uploadedBy: data.uploadedBy,
            downloadURL: data.downloadURL,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        };
        return new Image(imageData);
    }
};

export async function uploadImages(files: File[]): Promise<string[]> {
    try {
        const imageURLs: string[] = [];
        const userId = await getUserId();

        for (const file of files) {
            const currentTime = Date.now();
            // eslint-disable-next-line no-useless-escape
            const extension = /[^\.]*$/.exec(file.name)![0]; // Suppress the no-useless-escape rule from being called on a regular expression.
            const fileSize = file.size;
            const storageFilename = `${uuidv4()}-${currentTime}.${extension}`;

            // todo: Validate file size
            // todo: Validate type

            //ensure image has correct contentType
            const metaData = {
                contentType: `image/${extension}`
            };

            const fileData: ArrayBuffer = await file.arrayBuffer();
            const storageRef = ref(storage, storageFilename);

            // Upload image(s) to Cloud Storage
            await uploadBytes(storageRef, fileData, metaData);
            const downloadURL = await getDownloadURL(storageRef);
            imageURLs.push(downloadURL);
        }
        return imageURLs;
    } catch (error: any) {
        addErrorEvent('uploadImages', error);
    }
    return Promise.reject();
}

export async function getImage(id: string): Promise<Image> {
    const imagesRef = collection(db, IMAGES_COLLECTION);
    const documentRef = doc(imagesRef, id).withConverter(imageConverter);
    const snapshot = await getDoc(documentRef);
    return snapshot.data() as Image;
}

export async function deleteImagesByRef(...documentReferences: DocumentReference<Image>[]): Promise<void> {
    for (const imageReference of documentReferences) {
        try {
            const imageSnapshot = await getDoc(imageReference.withConverter(imageConverter));
            if (imageSnapshot.exists()) {
                const imageDocument = imageSnapshot.data();

                const imageDetailsCollectionRef = collection(db, IMAGE_DETAILS_COLLECTION);
                const conjunctions = [where('image', '==', imageReference)];
                const q = query(imageDetailsCollectionRef, ...conjunctions);
                const imageDetailsSnapshot = await getDocs(q);
                if (imageDetailsSnapshot.size !== 1) {
                    throw new Error('No associated image details.');
                }

                await deleteObject(ref(storage, imageDocument.getDownloadURL()));
                await deleteDoc(imageDetailsSnapshot.docs[0].ref);
                await deleteDoc(imageReference);
            }
        } catch (error: any) {
            addErrorEvent('deleteImagesByRef', error);
        }
    }
}

/** Retrieve a file from storage enforcing Firebase Storage security rules.
 *
 */
export async function imageReferenceConverter(...documentReferences: DocumentReference<Image>[]): Promise<string[]> {
    const images: string[] = [];
    for (const documentReference of documentReferences) {
        try {
            const imageSnapshot = await getDoc(documentReference.withConverter(imageConverter));
            if (imageSnapshot.exists()) {
                const imageDocument = imageSnapshot.data();
                let url = imageDocument?.getDownloadURL();
                await getDownloadURL(ref(storage, url))
                    .then((url) => {
                        if (url) images.push(url);
                    })
                    .catch((error) => {
                        addErrorEvent('imageReferenceConverter', error);
                    });
            }
        } catch (error: any) {
            addErrorEvent('imageReferenceConverter', error);
        }
    }
    return images;
}
