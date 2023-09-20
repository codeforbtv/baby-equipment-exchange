//Firebase types
import { Timestamp, serverTimestamp } from 'firebase/firestore'

export function imageFactory(...downloadURLs: [string]): Image[] | Image | null {
    const images: Image[] = []

    if (downloadURLs.length === (0 as number)) {
        return null
    }

    if (downloadURLs.length === (1 as number)) {
        const date: number = Date.now()
        const imageData: IImage = {
            downloadURL: downloadURLs[0],
            createdAt: serverTimestamp() as Timestamp,
            modifiedAt: serverTimestamp() as Timestamp
        }
        const image = new Image(imageData)
        return image
    }

    for (const downloadURL of downloadURLs) {
        const date: number = Date.now()
        const imageData: IImage = {
            downloadURL: downloadURL,
            createdAt: serverTimestamp() as Timestamp,
            modifiedAt: serverTimestamp() as Timestamp
        }
        const image = new Image(imageData)
        images.push(image)
    }

    return images
}

export interface IImage {
    [key: string]: string | Timestamp | (() => string) | (() => Timestamp)
    downloadURL: string
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class Image implements IImage {
    [key: string]: string | Timestamp | (() => string) | (() => Timestamp)
    downloadURL: string
    createdAt: Timestamp
    modifiedAt: Timestamp

    constructor(args: IImage) {
        this.downloadURL = args.downloadURL
        this.createdAt = args.createdAt
        this.modifiedAt = args.modifiedAt
    }

    getDownloadURL(): string {
        return this.downloadURL
    }

    getCreatedAt(): Timestamp {
        return this.createdAt
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt
    }
}
