interface IImageDetail {
    image: string
    uploadedBy: string
    uri: string
    filename: string
    createdAt: Date
    modifiedAt: Date
}

export class ImageDetail implements IImageDetail {
    image: string
    uploadedBy: string
    uri: string
    filename: string
    createdAt: Date
    modifiedAt: Date

    constructor(image: string, uploadedBy: string, uri: string, filename: string, createdAt: Date, modifiedAt: Date) {
        this.image = image
        this.uploadedBy = uploadedBy
        this.uri = uri
        this.filename = filename
        this.createdAt = createdAt
        this.modifiedAt = modifiedAt
    }

    getImage(): string {
        return this.image
    }

    getUploadedBy(): string {
        return this.uploadedBy
    }

    getUri(): string {
        return this.uri
    }

    getFilename(): string {
        return this.filename
    }

    getCreatedAt(): Date {
        return this.createdAt
    }

    getModifiedAt(): Date {
        return this.modifiedAt
    }
}
