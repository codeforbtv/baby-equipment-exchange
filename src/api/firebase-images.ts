// Modules
import {
    addDoc,
    collection,
    doc,
    DocumentData,
    DocumentReference,
    getDoc,
    QueryDocumentSnapshot,
    serverTimestamp,
    SnapshotOptions,
    Timestamp
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
// Libs
import { db, getUserId, storage, addErrorEvent } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Models
import { IImage, Image, imageFactory } from '@/models/image';
import { IImageDetail, ImageDetail } from '@/models/image-detail';
// Imported contants
import { USERS_COLLECTION } from './firebase-users';

const IMAGES_COLLECTION = 'Images';
const IMAGE_DETAILS_COLLECTION = 'ImageDetails';

const imageConverter = {
    toFirestore(image: Image): DocumentData {
        const imageData: IImage = {
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
            downloadURL: data.downloadURL,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        };
        return new Image(imageData);
    }
};

export async function uploadImages(files: File[]): Promise<DocumentReference[]> {
    try {
        const documentRefs: DocumentReference[] = [];
        const userId = await getUserId();

        for (const file of files) {
            const currentTime = Date.now();
            // eslint-disable-next-line no-useless-escape
            const extension = '.' + /[^\.]*$/.exec(file.name)![0]; // Suppress the no-useless-escape rule from being called on a regular expression.
            const fileSize = file.size;
            const fileType = file.type;
            const storageFilename = `${uuidv4()}-${currentTime}${extension}`;

            // todo: Validate file size
            // todo: Validate type

            //ensure image has correct contentType
            const metaData = {
                contentType: fileType
            };

            const fileData: ArrayBuffer = await file.arrayBuffer();
            const storageRef = ref(storage, storageFilename);

            // Upload image(s) to Cloud Storage
            await uploadBytes(storageRef, fileData, metaData);
            const downloadURL = `gs://baby-equipment-exchange.appspot.com/${storageFilename}`;
            //Create new Image document
            const imageCollection = collection(db, IMAGES_COLLECTION);
            const { ...imageData } = imageFactory(downloadURL);

            const imageRef = await addDoc(imageCollection, imageData);

            //Create new Image Details document
            const imageDetailsCollection = collection(db, IMAGE_DETAILS_COLLECTION);
            const imageDetailsData: IImageDetail = {
                image: imageRef,
                uploadedBy: doc(db, `${USERS_COLLECTION}/${userId}`),
                uri: downloadURL,
                filename: storageFilename,
                createdAt: serverTimestamp() as Timestamp,
                modifiedAt: serverTimestamp() as Timestamp
            };
            const { ...imageDetail } = new ImageDetail(imageDetailsData);
            await addDoc(imageDetailsCollection, imageDetail);

            // Return the newly created id values of Images collection documents.
            documentRefs.push(imageRef);
        }
        return documentRefs;
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
