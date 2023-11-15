//Firebase types
import { DocumentReference, Timestamp } from 'firebase/firestore'

export interface IImageDetail {
    [key: string]: string | DocumentReference | Timestamp | (() => string) | (() => DocumentReference) | (() => Timestamp)
    image: DocumentReference
    uploadedBy: DocumentReference
    uri: string
    filename: string
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class ImageDetail implements IImageDetail {
    [key: string]: string | DocumentReference | Timestamp | (() => string) | (() => DocumentReference) | (() => Timestamp)
    image: DocumentReference
    uploadedBy: DocumentReference
    uri: string
    filename: string
    createdAt: Timestamp
    modifiedAt: Timestamp

    constructor(args: IImageDetail) {
        this.image = args.image
        this.uploadedBy = args.uploadedBy
        this.uri = args.uri
        this.filename = args.filename
        this.createdAt = args.createdAt
        this.modifiedAt = args.modifiedAt
    }

    getImage(): DocumentReference {
        return this.image
    }

    getUploadedBy(): DocumentReference {
        return this.uploadedBy
    }

    getUri(): string {
        return this.uri
    }

    getFilename(): string {
        return this.filename
    }

    getCreatedAt(): Timestamp {
        return this.createdAt
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt
    }
}
