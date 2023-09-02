//Firebase types
import { Timestamp } from 'firebase/firestore'

export function imageFactory(...downloadURLs: [string]): Image[] | Image | null {
    const images: Image[] = []

    if (downloadURLs.length === (0 as number)) {
        return null
    }

    if (downloadURLs.length === (1 as number)) {
        const date: number = Date.now()
        const timestamp: Timestamp = Timestamp.fromMillis(date)
        const imageData: IImage = {
            downloadURL: downloadURLs[0],
            createdAt: timestamp,
            modifiedAt: timestamp
        }
        const image = new Image(imageData)
        return image
    }

    for (const downloadURL of downloadURLs) {
        const date: number = Date.now()
        const timestamp: Timestamp = Timestamp.fromMillis(date)
        const imageData: IImage = {
            downloadURL: downloadURL,
            createdAt: timestamp,
            modifiedAt: timestamp
        }
        const image = new Image(imageData)
        images.push(image)
    }

    return images
}

export interface IImage {
    downloadURL: string
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class Image implements IImage {
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
