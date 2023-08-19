//Firebase types
import { Timestamp } from 'firebase/firestore';

interface IImage {
    downloadURL: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class Image implements IImage {
    downloadURL: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(downloadURL: string, createdAt: Timestamp, modifiedAt: Timestamp) {
        this.downloadURL = downloadURL;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
    }

    getDownloadURL(): string {
        return this.downloadURL;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
