//Libs
import { getDb, getFirebaseStorage, getUserId } from './firebase'
import { ref, uploadBytes } from 'firebase/storage'
//Models
import { IImage, Image, imageFactory } from '../models/image'
import { IImageDetail, ImageDetail } from '@/models/image-detail'
//Modules
import { addDoc, collection, doc, DocumentData, getDoc, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'

const IMAGES_COLLECTION = 'Images'
const IMAGE_DETAILS_COLLECTION = 'ImageDetails'

const imageConverter = {
    toFirestore(image: Image): DocumentData {
        return {
            downloadURL: image.getDownloadURL(),
            createdAt: image.getCreatedAt(),
            modifiedAt: image.getModifiedAt()
        }
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

export async function uploadImages(files: FileList): Promise<string[] | undefined> {
    const documentIds = []
    const storage = getFirebaseStorage()
    const uid = getUserId()

    if (uid === undefined) {
        return undefined
    }

    for (const file of files) {
        const currentTime = Date.now()
        // eslint-disable-next-line no-useless-escape
        const extension = '.' + /[^\.]*$/.exec(file.name)![0] // Suppress the no-useless-escape rule from being called on a regular expression.
        const fileSize = file.size
        const fileType = file.type
        const timestamp = Timestamp.fromMillis(currentTime)
        const storageFilename = `${uuidv4()}-${currentTime}${extension}`

        // Upload image(s) to Cloud Storage

        // todo: Validate file size
        // todo: Validate type
        const fileData: ArrayBuffer = await file.arrayBuffer()
        const storageRef = ref(storage, storageFilename)

        await uploadBytes(storageRef, fileData)

        // Create new Image document
        const imageCollection = collection(getDb(), IMAGES_COLLECTION)
        const { ...imageData } = imageFactory(storageFilename)
        const imageRef = await addDoc(imageCollection, imageData)

        // Create new Image Details document
        const imageDetailsCollection = collection(getDb(), IMAGE_DETAILS_COLLECTION)
        const imageDetailsData: IImageDetail = {
            image: imageRef.id,
            uploadedBy: uid,
            uri: storageFilename,
            filename: storageFilename,
            createdAt: timestamp,
            modifiedAt: timestamp
        }
        const { ...imageDetail } = new ImageDetail(imageDetailsData)
        await addDoc(imageDetailsCollection, imageDetail)

        // Return the newly created id values of Images collection documents.
        documentIds.push(imageRef.id)
    }

    return documentIds
}

export async function getImage(id: string): Promise<Image | undefined> {
    const imagesRef = collection(getDb(), IMAGES_COLLECTION)
    const documentRef = doc(imagesRef, id).withConverter(imageConverter)
    const snapshot = await getDoc(documentRef)
    return snapshot.data() as Image
}
