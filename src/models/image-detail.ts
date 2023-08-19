//Firebase types
import { Timestamp } from 'firebase/firestore';

interface IImageDetail {
    image: string;
    uploadedBy: string;
    uri: string;
    filename: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class ImageDetail implements IImageDetail {
    image: string;
    uploadedBy: string;
    uri: string;
    filename: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(image: string, uploadedBy: string, uri: string, filename: string, createdAt: Timestamp, modifiedAt: Timestamp) {
        this.image = image;
        this.uploadedBy = uploadedBy;
        this.uri = uri;
        this.filename = filename;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
    }

    getImage(): string {
        return this.image;
    }

    getUploadedBy(): string {
        return this.uploadedBy;
    }

    getUri(): string {
        return this.uri;
    }

    getFilename(): string {
        return this.filename;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
