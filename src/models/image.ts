interface IImage {
    downloadURL: string
    createdAt: Date
    modifiedAt: Date
}

export class Image implements IImage {
    downloadURL: string
    createdAt: Date
    modifiedAt: Date

    constructor(downloadURL: string, createdAt: Date, modifiedAt: Date) {
        this.downloadURL = downloadURL
        this.createdAt = createdAt
        this.modifiedAt = modifiedAt
    }

    getDownloadURL(): string {
        return this.downloadURL
    }

    getCreatedAt(): Date {
        return this.createdAt
    }

    getModifiedAt(): Date {
        return this.modifiedAt
    }
}
