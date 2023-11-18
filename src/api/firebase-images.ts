//Libs
import { getDb, getFirebaseStorage, getUserId } from './firebase'
import { getBytes, getDownloadURL, getMetadata, getStorage, ref, uploadBytes } from 'firebase/storage'
//Models
import { IImage, Image, imageFactory } from '@/models/image'
import { IImageDetail, ImageDetail } from '@/models/image-detail'
//Modules
import { addDoc, collection, doc, DocumentData, DocumentReference, getDoc, QueryDocumentSnapshot, serverTimestamp, SnapshotOptions, Timestamp } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { USERS_COLLECTION } from './firebase-users'
import { getApp } from 'firebase/app'
import { unescape } from 'querystring'

export const IMAGES_COLLECTION = 'Images'
export const IMAGE_DETAILS_COLLECTION = 'ImageDetails'

export const imageConverter = {
    toFirestore(image: Image): DocumentData {
        const imageData: IImage = {
            downloadURL: image.getDownloadURL(),
            createdAt: image.getCreatedAt(),
            modifiedAt: image.getModifiedAt()
        }

        for (const key in imageData) {
            if (imageData[key] === undefined || imageData[key] === null) {
                delete imageData[key]
            }
        }

        return imageData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Image {
        const data = snapshot.data(options)!
        const imageData: IImage = {
            downloadURL: data.downloadURL,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        }
        return new Image(imageData)
    }
}

export async function uploadImages(files: FileList): Promise<DocumentReference[]> {
    try {
        const documentRefs: DocumentReference[] = []
        const storage = getFirebaseStorage()
        const userId = await getUserId()

        for (const file of files) {
            const currentTime = Date.now()
            // eslint-disable-next-line no-useless-escape
            const extension = '.' + /[^\.]*$/.exec(file.name)![0] // Suppress the no-useless-escape rule from being called on a regular expression.
            const fileSize = file.size
            const fileType = file.type
            const storageFilename = `${uuidv4()}-${currentTime}${extension}`

            // todo: Validate file size
            // todo: Validate type

            //ensure image has correct contentType
            const metaData = {
                contentType: fileType
            }

            const fileData: ArrayBuffer = await file.arrayBuffer()
            const storageRef = ref(storage, storageFilename)

            // Upload image(s) to Cloud Storage
            await uploadBytes(storageRef, fileData, metaData)
            const downloadURL = `gs://baby-equipment-exchange.appspot.com/${storageFilename}`
            //Create new Image document
            const imageCollection = collection(getDb(), IMAGES_COLLECTION)
            const { ...imageData } = imageFactory(downloadURL)

            const imageRef = await addDoc(imageCollection, imageData)

            //Create new Image Details document
            const imageDetailsCollection = collection(getDb(), IMAGE_DETAILS_COLLECTION)
            const imageDetailsData: IImageDetail = {
                image: imageRef,
                uploadedBy: doc(getDb(), `${USERS_COLLECTION}/${userId}`),
                uri: downloadURL,
                filename: storageFilename,
                createdAt: serverTimestamp() as Timestamp,
                modifiedAt: serverTimestamp() as Timestamp
            }
            const { ...imageDetail } = new ImageDetail(imageDetailsData)
            await addDoc(imageDetailsCollection, imageDetail)

            // Return the newly created id values of Images collection documents.
            documentRefs.push(imageRef)
        }
        return documentRefs
    } catch (error) {
        // eslint-disable-line no-empty
    }
    return Promise.reject()
}

export async function getImage(id: string): Promise<Image> {
    const imagesRef = collection(getDb(), IMAGES_COLLECTION)
    const documentRef = doc(imagesRef, id).withConverter(imageConverter)
    const snapshot = await getDoc(documentRef)
    return snapshot.data() as Image
}

/** Retrieve a file from storage enforcing Firebase Storage security rules.
 * 
 */
export async function imageReferenceConverter(...documentReferences: DocumentReference<Image>[]): Promise<string[]> {
    const images: string[] = []
    for (const documentReference of documentReferences) {
        const imageSnapshot = await getDoc(documentReference.withConverter(imageConverter))
        if (imageSnapshot.exists()) {
            const imageDocument = imageSnapshot.data()
            const bucketUrl = imageDocument.getDownloadURL()
            const storageRef = ref(getStorage(getApp()), bucketUrl)
            const fullMetadata = await getMetadata(storageRef)
            if (fullMetadata == null || fullMetadata.contentType == null) {
                return Promise.reject(new Error("Unable to retrieve metadata."))
            }
            const url = await getDownloadURL(storageRef)
            images.push(url)
        }
    }
    return images
}
