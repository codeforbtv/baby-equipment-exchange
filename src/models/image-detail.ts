//Firebase types
import { Timestamp } from 'firebase/firestore';

export interface IImageDetail {
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

    constructor(args: IImageDetail) {
        this.image = args.image;
        this.uploadedBy = args.uploadedBy;
        this.uri = args.uri;
        this.filename = args.filename;
        this.createdAt = args.createdAt;
        this.modifiedAt = args.modifiedAt;
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
